# Stratified read -- paired sample

Four ADVERSARIAL passages (from the lessons the checks flagged most) and four RANDOM passages (from lessons the checks passed) per stratum and language. The random half is the one that can tell us what the checks miss; the adversarial half only measures the checks.

Selection is deterministic (FNV-1a over the slug), so this sample can be re-derived.
Sampled strata: **AIMS-F 2026-08-07, ISMS-IA 2026-08-12, AIMS-IA 2026-09-12**. The checks above cover all 14 strata and 917 rows; this document samples the named ones.


**Nothing here has been changed.**

---

## AIMS-F 2026-08-07 / es-419

35 row(s) in this stratum; 4 adversarial, 0 random.

### 1. ADVERSARIAL -- `03-04-operational-planning-and-control` / es-419

flags: _unit (block); defined-term (available (block): available is a duty to furnish on request; retained is a duty to keep -- La información documentada debe conservarse en la medida en que genere); clause-vocab (es uses `apartado`: cláusula 8.1); clause-vocab (es uses `apartado`: cláusula 6); clause-vocab (es uses `apartado`: cláusula 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1); clause-vocab (es uses `apartado`: capítulo 8.1)

**EN**

```
Documented information must be **available** to the extent **necessary** for confidence that the processes were carried out as planned. Note the phrasing: *to the extent necessary to have confidence.* The test is whether the evidence supports the claim, not whether a form was completed.
::

::callout type="pitfall"
Clause 8.1's change requirement has two halves and the second is the one that gets dropped. The organization controls **planned** changes, and reviews the consequences of **unintended** changes, taking action to mitigate adverse effects. Unintended change is the normal condition for AI systems — a supplier updates a model, an upstream data source shifts its schema, a dependency changes behaviour in a minor release. None of that is a change the organization planned, and all of it is inside this clause.
::

::concept title="Change, planned and otherwise"
[Change control for AI]{glossary="change-control-ai"} inherits the shape of change control anywhere and then acquires two complications.
```

**es-419**

```
La información documentada debe conservarse en la medida en que genere confianza en que los procesos se llevaron a cabo según lo planificado. Nótese la formulación: *en la medida necesaria para tener confianza.* La prueba es si la evidencia respalda la afirmación, no si se completó un formulario.
::

::callout type="pitfall"
El requisito de cambios del capítulo 8.1 tiene dos partes y la segunda es la que se omite. La organización controla los cambios **planificados** y revisa las consecuencias de los cambios **no previstos**, tomando acciones para mitigar los efectos adversos. El cambio no previsto es la condición normal para los sistemas de IA: un proveedor actualiza un modelo, una fuente de datos de origen modifica su esquema, una dependencia cambia su comportamiento en una versión menor. Nada de eso es un cambio que la organización planificó, y todo ello está dentro de este capítulo.
::

::concept title="Cambios, planificados y no planificados"
El [control de cambios para la IA]{glossary="change-control-ai"} hereda la forma del control de cambios en cualquier ámbito y luego adquiere dos complicaciones.
```

### 2. ADVERSARIAL -- `02-04-roles-responsibilities-authorities` / es-419

flags: _unit (block); clause-vocab (es uses `apartado`: cláusula 5.3); clause-vocab (es uses `apartado`: capítulo 5.3); clause-vocab (es uses `apartado`: capítulo 5.1); clause-vocab (es uses `apartado`: capítulo 9.3); clause-vocab (es uses `apartado`: capítulo 5.3); clause-vocab (es uses `apartado`: capítulo 5.3); clause-vocab (es uses `apartado`: capítulo 5.3); clause-vocab (es uses `apartado`: capítulo 5.3); clause-vocab (es uses `apartado`: capítulo 5.3); clause-vocab (es uses `apartado`: capítulo 5.3); clause-vocab (es uses `apartado`: capítulo 5.3); clause-vocab (es uses `apartado`: capítulo 5.3); clause-vocab (es uses `apartado`: capítulo 5.3); clause-vocab (es uses `apartado`: capítulo 9.1); clause-vocab (es uses `apartado`: capítulo 5.3)

**EN**

```
Both halves matter. An assignment nobody knows about is not an assignment — the person holding it cannot act on it, and the people who should escalate to them do not know to. Communication is not administrative tidiness here; it is what makes the assignment operative.

Note that the clause pairs responsibility with **authority** throughout. This is the older lesson of every management system standard and it applies with force here. Giving someone responsibility for AI risk without the authority to stop a deployment produces a role that can only document its own concerns being overruled.

The standard then names two assignments specifically, and only two.
::
```

**es-419**

```
Ambas partes importan. Una asignación que nadie conoce no es una asignación: la persona que la tiene no puede actuar en consecuencia, y quienes deberían escalar hacia ella no saben que deben hacerlo. La comunicación no es un trámite administrativo aquí; es lo que hace que la asignación sea operativa.

Nótese que el capítulo vincula la responsabilidad con la **autoridad** a lo largo de todo su texto. Esta es la lección más antigua de toda norma de sistema de gestión y se aplica con fuerza aquí. Otorgar a alguien responsabilidad sobre el riesgo de IA sin la autoridad para detener un despliegue produce un rol que solo puede documentar sus propias preocupaciones siendo ignoradas.

La norma luego nombra dos asignaciones específicamente, y solo dos.
::
```

### 3. ADVERSARIAL -- `01-04-harmonised-structure` / es-419

flags: accent (formula); _unit (block); register (reads as tu (3 tu / 1 usted) in a usted certification); clause-vocab (es uses `apartado`: capítulo 4); clause-vocab (es uses `apartado`: capítulo 5); clause-vocab (es uses `apartado`: capítulo 6); clause-vocab (es uses `apartado`: capítulo 7); clause-vocab (es uses `apartado`: capítulo 8); clause-vocab (es uses `apartado`: capítulo 9); clause-vocab (es uses `apartado`: capítulo 10); clause-vocab (es uses `apartado`: Capítulo 4); clause-vocab (es uses `apartado`: Capítulo 6); clause-vocab (es uses `apartado`: Capítulo 7); clause-vocab (es uses `apartado`: Capítulo 9); clause-vocab (es uses `apartado`: capítulo 6); clause-vocab (es uses `apartado`: capítulo 8)

**EN**

```
A partial list, each covered later in this course: the requirement to determine the organization's roles; the requirement to determine whether climate change is a relevant issue; AI risk criteria that must support assessing risk impacts as well as risks; the AI system impact assessment and the requirement to consider its results in the risk assessment; and the clause 8 restatement of assessment and treatment as things that must actually be performed at planned intervals.

Annex A is a separate exercise. Its 38 controls are organized by categories that do not correspond to ISO/IEC 27001's four themes, and a control-by-control mapping between the two is more misleading than helpful. Some obligations genuinely overlap; others look equivalent and are not. Lesson 4.7 works through that distinction, because getting it wrong produces a Statement of Applicability that passes review while leaving an AI obligation unmet.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "What does the harmonised structure guarantee between ISO/IEC 42001 and ISO/IEC 27001?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "That equivalent requirements appear under equivalent clause numbers and titles" },
      { "id": "b", "text": "That an organization certified to one is deemed conformant to the other" },
      { "id": "c", "text": "That the Annex A controls of each map one to one" },
      { "id": "d", "text": "That a single audit satisfies both standards" }
    ],
    "correct": ["a"],
    "explanation": "The harmonised structure means identical clause numbers, titles, text and core definitions. It says nothing about conformance transferring, and the two Annex A structures are organized differently. A combined audit is possible but is a separate matter from the shared structure.",
    "concept_slugs": ["harmonised-structure"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "How does the standard characterise integration with other management system standards?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "As optional, and appropriate only for large organizations" },
      { "id": "b", "text": "As essential to developing and using an AI system responsibly" },
      { "id": "c", "text": "As a matter for the certification body to determine" },
      { "id": "d", "text": "As applicable only where the organization already holds another certification" }
    ],
    "correct": ["b"],
    "explanation": "Annex D.2 states that integration is essential, reasoning that an AI system uses many technologies and that objectives such as safety, security and privacy should be managed holistically rather than separately for the AI components and everything else.",
    "concept_slugs": ["integrated-management-system"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "An organization proposes reusing its existing ISO/IEC 27001 competence records unchanged to satisfy clause 7.2 of ISO/IEC 42001. What is the flaw?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Clause 7.2 does not exist in ISO/IEC 42001" },
      { "id": "b", "text": "Competence records may not be shared between management systems" },
      { "id": "c", "text": "The clause carries over but the required competence is a different body of knowledge" },
      { "id": "d", "text": "Competence must be evidenced by external certification in both cases" }
    ],
    "correct": ["c"],
    "explanation": "The harmonised structure means clause 7.2 asks the same question in both standards. It does not mean the answer transfers. AI competence spans different knowledge and is evidenced differently, so the machinery can be reused while the content must be re-examined.",
    "concept_slugs": ["iso-42001-27001-integration"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "Which of these has no counterpart in ISO/IEC 27001?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "The requirement for top management to establish a policy" },
      { "id": "b", "text": "The requirement to determine the organization's roles with respect to its systems" },
      { "id": "c", "text": "The requirement to retain documented information about risk assessment" },
      { "id": "d", "text": "The requirement to conduct internal audits at planned intervals" }
    ],
    "correct": ["b"],
    "explanation": "Role determination is specific to ISO/IEC 42001 — an information asset does not change your obligations depending on how you relate to it. Policy, documented information and internal audit all carry across the harmonised structure.",
    "concept_slugs": ["clauses-four-to-ten", "iso-42001-27001-integration"],
    "bloom_level": "2_understand",
    "difficulty": 3
  }
]
::
```

**es-419**

```
Una lista parcial, cada elemento tratado más adelante en este curso: el requisito de determinar los roles de la organización; el requisito de determinar si el cambio climático es un asunto pertinente; los criterios de riesgo de IA que deben permitir evaluar los impactos del riesgo además de los riesgos en sí; la evaluación del impacto del sistema de IA y el requisito de considerar sus resultados en la evaluación del riesgo; y la reafirmación en el capítulo 8 de que la evaluación y el tratamiento son cosas que deben realizarse efectivamente a intervalos planificados.

El Anexo A es un ejercicio aparte. Sus 38 controles están organizados por categorías que no se corresponden con los cuatro temas de ISO/IEC 27001, y una correspondencia control por control entre ambas normas resulta más engañosa que útil. Algunas obligaciones se superponen genuinamente; otras parecen equivalentes y no lo son. La lección 4.7 trabaja sobre esa distinción, porque equivocarse produce una Declaración de Aplicabilidad que supera la revisión mientras deja una obligación de IA sin cumplir.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "¿Qué garantiza la estructura armonizada entre ISO/IEC 42001 e ISO/IEC 27001?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Que los requisitos equivalentes aparecen bajo números y títulos de capítulo equivalentes" },
      { "id": "b", "text": "Que una organización certificada en una se considera conforme con la otra" },
      { "id": "c", "text": "Que los controles del Anexo A de cada norma se corresponden uno a uno" },
      { "id": "d", "text": "Que una sola auditoría satisface ambas normas" }
    ],
    "correct": ["a"],
    "explanation": "La estructura armonizada implica números de capítulo, títulos, texto y definiciones básicas idénticos. No dice nada sobre la transferencia de conformidad, y las dos estructuras del Anexo A están organizadas de manera diferente. Una auditoría combinada es posible, pero es un asunto distinto de la estructura compartida.",
    "concept_slugs": ["harmonised-structure"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "¿Cómo caracteriza la norma la integración con otras normas de sistemas de gestión?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Como opcional, y apropiada solo para organizaciones grandes" },
      { "id": "b", "text": "Como esencial para el desarrollo y uso responsable de un sistema de IA" },
      { "id": "c", "text": "Como un asunto que corresponde determinar al organismo de certificación" },
      { "id": "d", "text": "Como aplicable solo cuando la organización ya cuenta con otra certificación" }
    ],
    "correct": ["b"],
    "explanation": "El Anexo D.2 establece que la integración es esencial, argumentando que un sistema de IA utiliza muchas tecnologías y que objetivos como la seguridad, la protección y la privacidad deben gestionarse de manera holística en lugar de hacerlo por separado para los componentes de IA y todo lo demás.",
    "concept_slugs": ["integrated-management-system"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "Una organización propone reutilizar sin cambios sus registros de competencia de ISO/IEC 27001 para satisfacer el apartado 7.2 de ISO/IEC 42001. ¿Cuál es el problema?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "El apartado 7.2 no existe en ISO/IEC 42001" },
      { "id": "b", "text": "Los registros de competencia no pueden compartirse entre sistemas de gestión" },
      { "id": "c", "text": "El capítulo se traslada, pero la competencia requerida es un cuerpo de conocimiento diferente" },
      { "id": "d", "text": "La competencia debe evidenciarse mediante certificación externa en ambos casos" }
    ],
    "correct": ["c"],
    "explanation": "La estructura armonizada significa que el apartado 7.2 formula la misma pregunta en ambas normas. No significa que la respuesta se traslade. La competencia en IA abarca conocimientos diferentes y se evidencia de manera distinta, por lo que la maquinaria puede reutilizarse mientras que el contenido debe reexaminarse.",
    "concept_slugs": ["iso-42001-27001-integration"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "¿Cuál de estos elementos no tiene equivalente en ISO/IEC 27001?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "El requisito de que la alta dirección establezca una política" },
      { "id": "b", "text": "El requisito de determinar los roles de la organización con respecto a sus sistemas" },
      { "id": "c", "text": "El requisito de conservar información documentada sobre la evaluación del riesgo" },
      { "id": "d", "text": "El requisito de realizar auditorías internas a intervalos planificados" }
    ],
    "correct": ["b"],
    "explanation": "La determinación de roles es específica de ISO/IEC 42001 — un activo de información no cambia tus obligaciones según cómo te relacionas con él. La política, la información documentada y la auditoría interna se trasladan a través de la estructura armonizada.",
    "concept_slugs": ["clauses-four-to-ten", "iso-42001-27001-integration"],
    "bloom_level": "2_understand",
    "difficulty": 3
  }
]
::
```

### 4. ADVERSARIAL -- `03-03-documented-information` / es-419

flags: _unit (sentence); defined-term (extent (sentence): extent rendered with the SCOPE term collapses two defined audit terms -- Una nota añade que el alcance de la información documentada varía de u); clause-vocab (es uses `apartado`: cláusula 7.5.3); clause-vocab (es uses `apartado`: capítulo 7.5); clause-vocab (es uses `apartado`: capítulo 7.5); clause-vocab (es uses `apartado`: capítulo 6); clause-vocab (es uses `apartado`: capítulo 4); clause-vocab (es uses `apartado`: capítulo 7); clause-vocab (es uses `apartado`: capítulo 8); clause-vocab (es uses `apartado`: capítulo 9); clause-vocab (es uses `apartado`: capítulo 10); clause-vocab (es uses `apartado`: capítulo 8); clause-vocab (es uses `apartado`: capítulo 8); clause-vocab (es uses `apartado`: capítulo 8)

**EN**

```
Every one of those is created by someone else, is necessary for planning and operation, and can change without the organization being consulted. The supplier controls require the organization to determine what information it needs from suppliers and to ensure adequate documentation is delivered — and clause 7.5.3 is what says that documentation, once received, has to be controlled like anything else.

**The practical failure is a model card downloaded once, filed, and never checked against the version now in production.**
::

::interactive widget="sort-into-order" id="record-lifecycle" concept_slugs="control-of-documented-information"
{
  "items": [
    {
      "id": "a",
      "text": "Distribution, access, retrieval and use"
    },
    {
      "id": "b",
      "text": "Storage and preservation, including preservation of legibility"
    },
    {
      "id": "c",
      "text": "Control of changes, such as version control"
    },
    {
      "id": "d",
      "text": "Retention and disposition"
    }
  ],
  "correct_order": [
    "a",
    "b",
    "c",
    "d"
  ],
  "explanation": "The order is the record's own life: made available, kept, changed under control, and eventually retained for a period and disposed of. Preservation of legibility is the item people skip, and it is the reason a record stored in a format nobody can open in five years fails this clause even though the file still exists. For AI systems the retention question is sharper than usual, because event logs and impact assessments may need to outlive the system that produced them."
}
::
```

**es-419**

```
Cada uno de esos elementos es creado por otra persona, es necesario para la planificación y operación, y puede cambiar sin que la organización sea consultada. Los requisitos sobre proveedores exigen que la organización determine qué información necesita de ellos y que se asegure de que la documentación adecuada sea entregada; y el apartado 7.5.3 es el que establece que esa documentación, una vez recibida, debe controlarse como cualquier otra.

**El fallo práctico es una ficha de modelo descargada una vez, archivada y nunca verificada contra la versión que está en producción.**
::

::interactive widget="sort-into-order" id="record-lifecycle" concept_slugs="control-of-documented-information"
{
  "items": [
    {
      "id": "a",
      "text": "Distribución, acceso, recuperación y uso"
    },
    {
      "id": "b",
      "text": "Almacenamiento y conservación, incluida la preservación de la legibilidad"
    },
    {
      "id": "c",
      "text": "Control de cambios, como el control de versiones"
    },
    {
      "id": "d",
      "text": "Retención y disposición"
    }
  ],
  "correct_order": [
    "a",
    "b",
    "c",
    "d"
  ],
  "explanation": "El orden es el ciclo de vida propio del registro: se pone a disposición, se conserva, se modifica bajo control y, finalmente, se retiene durante un período y se dispone de él. La preservación de la legibilidad es el elemento que la gente omite, y es la razón por la que un registro almacenado en un formato que nadie puede abrir cinco años después incumple este capítulo aunque el archivo siga existiendo. Para los sistemas de IA, la cuestión de la retención es más crítica que de costumbre, porque los registros de eventos y las evaluaciones de impacto pueden necesitar sobrevivir al sistema que los generó."
}
::
```

---

## AIMS-F 2026-08-07 / pt-BR

35 row(s) in this stratum; 4 adversarial, 0 random.

### 5. ADVERSARIAL -- `04-03-governing-apparatus-controls` / pt-BR

flags: accent (analise); convem (convem-que not clause-initial); convem (convem-que not clause-initial); convem (convem-que not clause-initial); _unit (sentence); modal-sentence (should -> obligation (sentence): Este é o complemento do Anexo A à cláusula 5.2, e a orientação acrescenta o que ); clause-vocab (pt uses a flat `Seção`: cláusula 5.2); clause-vocab (pt uses a flat `Seção`: cláusula )

**EN**

```
The guidance notes the organization can use existing reporting mechanisms as part of this process, and points at ISO 37002 for further consideration.

**Why this matters more than its placement suggests.** Most of what goes wrong is visible to someone before it appears in a metric. A support agent notices the suggestions have got worse; an analyst sees outputs that do not match the domain. Without a safe route to say so, the earliest signal is discarded.
::

::callout type="pitfall"
Reprisal protection covers the investigator as well as the reporter. That is an unusual provision and a deliberate one: a process where investigating a concern about a favoured project carries career risk produces investigations that find nothing.
::
```

**pt-BR**

```
A orientação observa que a organização pode usar mecanismos de reporte existentes como parte desse processo, e remete à ISO 37002 para considerações adicionais.

**Por que isso importa mais do que sua posição sugere.** A maior parte do que dá errado é visível para alguém antes de aparecer em uma métrica. Um agente de suporte percebe que as sugestões pioraram; um analista vê resultados que não correspondem ao domínio. Sem uma rota segura para dizê-lo, o sinal mais precoce é descartado.
::

::callout type="pitfall"
A proteção contra represálias abrange o investigador tanto quanto quem reporta. Essa é uma disposição incomum e deliberada: um processo em que investigar uma preocupação sobre um projeto favorito implica risco à carreira produz investigações que não encontram nada.
::
```

### 6. ADVERSARIAL -- `03-04-operational-planning-and-control` / pt-BR

flags: modal (should x2, no weak modal, 14 obligations vs 11 en); _unit (sentence); modal-sentence (should -> obligation (sentence): O padrão já deve ser familiar.); defined-term (available (sentence): available is a duty to furnish on request; retained is a duty to keep -- A informação documentada deve ser mantida na medida em que isso propor); clause-vocab (pt uses a flat `Seção`: Cláusula 8.1); clause-vocab (pt uses a flat `Seção`: cláusula)

**EN**

```
Documented information must be **available** to the extent **necessary** for confidence that the processes were carried out as planned. Note the phrasing: *to the extent necessary to have confidence.* The test is whether the evidence supports the claim, not whether a form was completed.
::

::callout type="pitfall"
Clause 8.1's change requirement has two halves and the second is the one that gets dropped. The organization controls **planned** changes, and reviews the consequences of **unintended** changes, taking action to mitigate adverse effects. Unintended change is the normal condition for AI systems — a supplier updates a model, an upstream data source shifts its schema, a dependency changes behaviour in a minor release. None of that is a change the organization planned, and all of it is inside this clause.
::

::concept title="Change, planned and otherwise"
[Change control for AI]{glossary="change-control-ai"} inherits the shape of change control anywhere and then acquires two complications.
```

**pt-BR**

```
A informação documentada deve ser mantida na medida em que isso proporcione confiança de que os processos foram executados conforme planejado. Observe a redação: *na medida necessária para ter confiança.* O teste é se as evidências sustentam a afirmação, não se um formulário foi preenchido.
::

::callout type="pitfall"
O requisito de mudanças da Seção 8.1 tem duas partes, e a segunda é a que costuma ser descartada. A organização controla as mudanças **planejadas** e analisa as consequências das mudanças **não intencionais**, tomando ações para mitigar efeitos adversos. A mudança não intencional é a condição normal para sistemas de IA — um fornecedor atualiza um modelo, uma fonte de dados upstream altera seu esquema, uma dependência muda de comportamento em uma versão secundária. Nada disso é uma mudança que a organização planejou, e tudo isso está dentro do escopo desta Seção.
::

::concept title="Mudança, planejada e não planejada"
O [controle de mudanças para IA]{glossary="change-control-ai"} herda a forma do controle de mudanças em geral e adquire duas complicações adicionais.
```

### 7. ADVERSARIAL -- `04-05-data-and-information-controls` / pt-BR

flags: convem (convem-que not clause-initial); convem (convem-que not clause-initial); _unit (sentence); modal-sentence (should -> obligation (sentence): Os critérios para decidir o que é fornecido devem ser documentados, com base no ); modal-sentence (should -> obligation (sentence): **A compreensibilidade é o objetivo, e o guia afirma que a organização deve ente)

**EN**

```
**Data provenance** — defining and documenting a process for recording provenance across the life cycles of the data and the system.

**Data preparation** — defining and documenting the criteria for selecting preparation methods, and the methods used.

The pattern across all five is *define, document, and do*. Worth noticing here because data work usually happens as technique rather than as documented decision: the standard treats an imputation method or a labelling rule as a choice requiring justification, not a step someone took.
::
```

**pt-BR**

```
**Proveniência dos dados** — definir e documentar um processo para registrar a proveniência ao longo dos ciclos de vida dos dados e do sistema.

**Preparação dos dados** — definir e documentar os critérios para selecionar métodos de preparação e os métodos utilizados.

O padrão em todos os cinco é *definir, documentar e executar*. Vale notar aqui porque o trabalho com dados geralmente acontece como técnica, e não como decisão documentada: a norma trata um método de imputação ou uma regra de rotulagem como uma escolha que requer justificativa, não como um passo que alguém simplesmente executou.
::
```

### 8. ADVERSARIAL -- `02-06-the-ai-system-impact-assessment` / pt-BR

flags: _unit (sentence); modal-sentence (should -> obligation (sentence): A organização deve avaliar essas expectativas e considerar como abordá-las.); modal-sentence (should -> obligation (sentence): Mas sua presença muda como o documento deve ser redigido.); clause-vocab (pt uses a flat `Seção`: cláusula 8.4); clause-vocab (pt uses a flat `Seção`: cláusula )

**EN**

```
---
lesson_id: 02-06-the-ai-system-impact-assessment
module_slug: aims-context-and-planning
certification_code: AIMS-F
title: The AI system impact assessment
subtitle: Foreseeable misuse, jurisdiction, and consequences you may have to disclose
language: en
lesson_group_id: 02-06-the-ai-system-impact-assessment
duration_minutes: 15
order_index: 6
task_codes: ["2.6"]
concept_slugs:
  - ai-system-impact-assessment
  - impact-on-individuals
  - impact-on-societies
  - foreseeable-misuse
  - jurisdictional-context
  - impact-assessment-documentation
prerequisites:
  - 02-05-the-ai-risk-assessment
preview: |
  The requirement most specific to this standard. It reaches past intended use
  into foreseeable misuse, past the organization into societies, and its result
  may be released to interested parties.
authors:
  - Certidemy team
status: draft
---

::hook
The impact assessment asks a question no other clause asks: not what could go wrong for you, but what this system does to people when it works exactly as intended.
::

::concept title="What clause 6.1.4 requires"
The [AI system impact assessment]{glossary="ai-system-impact-assessment"} is a formal process, and a documented one, that an organization developing, providing or using AI runs to find out what its systems do to individuals, to groups, and to societies — and then to do something about what it finds.
```

**pt-BR**

```
---
lesson_id: 02-06-the-ai-system-impact-assessment
module_slug: aims-context-and-planning
certification_code: AIMS-F
title: A avaliação de impacto do sistema de IA
subtitle: Uso indevido previsível, jurisdição e consequências que podem precisar ser divulgadas
language: pt-BR
lesson_group_id: 02-06-the-ai-system-impact-assessment
duration_minutes: 15
order_index: 6
task_codes: ["2.6"]
concept_slugs:
  - ai-system-impact-assessment
  - impact-on-individuals
  - impact-on-societies
  - foreseeable-misuse
  - jurisdictional-context
  - impact-assessment-documentation
prerequisites:
  - 02-05-the-ai-risk-assessment
preview: |
  O requisito mais específico desta norma. Vai além do uso pretendido
  para alcançar o uso indevido previsível, além da organização para abranger
  as sociedades, e seu resultado pode ser divulgado às partes interessadas.
authors:
  - Certidemy team
status: draft
---

::hook
A avaliação de impacto faz uma pergunta que nenhuma outra Seção faz: não o que pode dar errado para você, mas o que este sistema faz às pessoas quando funciona exatamente como pretendido.
::

::concept title="O que a Seção 6.1.4 exige"
A [avaliação de impacto do sistema de IA]{glossary="ai-system-impact-assessment"} é um processo formal e documentado que uma organização que desenvolve, fornece ou utiliza IA executa para descobrir o que seus sistemas fazem a indivíduos, a grupos e a sociedades — e, em seguida, para agir sobre o que encontra.
```

---

## AIMS-IA 2026-09-12 / es-419

30 row(s) in this stratum; 4 adversarial, 0 random.

### 9. ADVERSARIAL -- `aims-ia-04-13-competence-the-organization-claims` / es-419

flags: accent (formula); _unit (sentence); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: Capítulo 7.2); clause-vocab (es uses `apartado`: Capítulo 7.2); clause-vocab (es uses `apartado`: Capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 10.2); clause-vocab (es uses `apartado`: capítulo 10.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.3); clause-vocab (es uses `apartado`: capítulo 7.3); clause-vocab (es uses `apartado`: capítulo 7.2); clause-vocab (es uses `apartado`: capítulo 7.2)

**EN**

```
Clause 7.2 concerns persons doing work under the organization's control that affects its AI performance. As AI systems take over more of the work, some of what previously required a competent person is now performed by a system - triage decisions, first-line classification, drafting, monitoring.

Two observations, and the first is more important than it looks.

**The competence requirement does not disappear; it moves.** Where a system performs work a person used to do, the people whose competence now affects AI performance are the ones who configure it, evaluate whether it is performing acceptably, and decide when to intervene. That is different competence from doing the original task, and an organization that automated a task and retained its old competence determination has a determination describing work nobody does any more.
```

**es-419**

```
El capítulo 7.2 se refiere a las personas que realizan trabajo bajo el control de la organización que afecta a su desempeño en IA. A medida que los sistemas de IA asumen más trabajo, parte de lo que antes requería una persona competente ahora lo realiza un sistema: decisiones de clasificación inicial, clasificación de primera línea, redacción, monitoreo.

Dos observaciones, y la primera es más importante de lo que parece.

**El requisito de competencia no desaparece; se desplaza.** Cuando un sistema realiza el trabajo que antes hacía una persona, las personas cuya competencia ahora afecta al desempeño en IA son quienes lo configuran, evalúan si está funcionando de manera aceptable y deciden cuándo intervenir. Esa es una competencia diferente a la de realizar la tarea original, y una organización que automatizó una tarea y conservó su antigua determinación de competencia tiene una determinación que describe un trabajo que ya nadie realiza.
```

### 10. ADVERSARIAL -- `aims-ia-04-01-a-determination-or-an-assertion` / es-419

flags: _unit (block); modal-sentence (should -> obligation (block): **Externas.** La regulación en las jurisdicciones donde operan los sistemas — y ); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.2); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.2); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.1)

**EN**

```
Reading the role determination and finding it internally coherent establishes nothing. Two documents by the same organization usually agree. The independent reference point is what the organization actually does:

- **procurement and vendor records** - what AI services and licences are paid for;
- **engineering repositories and model registries** - what is built and what is deployed;
- **product documentation and customer contracts** - what is offered externally;
- **the interested parties in clause 4.2** - who the organization itself says is affected.

Comparing that estate to the determination produces three kinds of finding, in increasing order of usefulness:
```

**es-419**

```
Leer la determinación de roles y encontrarla internamente coherente no establece nada. Dos documentos de la misma organización suelen coincidir. El punto de referencia independiente es lo que la organización realmente hace:

- **registros de adquisiciones y proveedores** — qué servicios y licencias de IA se pagan;
- **repositorios de ingeniería y registros de modelos** — qué se construye y qué se despliega;
- **documentación de productos y contratos con clientes** — qué se ofrece externamente;
- **las partes interesadas del capítulo 4.2** — a quiénes la propia organización dice que afecta.

Comparar ese inventario con la determinación produce tres tipos de hallazgo, en orden creciente de utilidad:
```

### 11. ADVERSARIAL -- `aims-ia-04-08-defined-versus-running` / es-419

flags: accent (clausula); _unit (block); modal-sentence (should -> obligation (block): Y la observación honesta de auditoría es que no encontrar nada aquí es común, po); clause-vocab (es uses `apartado`: cláusula 8.1); clause-vocab (es uses `apartado`: cláusula 6); clause-vocab (es uses `apartado`: cláusula 8.1); clause-vocab (es uses `apartado`: cláusula 8.1); clause-vocab (es uses `apartado`: clausula 7.5.1); clause-vocab (es uses `apartado`: cláusula 8.1); clause-vocab (es uses `apartado`: cláusula 6.1.3); clause-vocab (es uses `apartado`: capítulo 8); clause-vocab (es uses `apartado`: capítulo 8); clause-vocab (es uses `apartado`: capítulo 6); clause-vocab (es uses `apartado`: capítulo 8); clause-vocab (es uses `apartado`: capítulo 6); clause-vocab (es uses `apartado`: capítulo 8); clause-vocab (es uses `apartado`: capítulo 6); clause-vocab (es uses `apartado`: capítulo 8); clause-vocab (es uses `apartado`: capítulo 6); clause-vocab (es uses `apartado`: capítulo 6); clause-vocab (es uses `apartado`: capítulo 8); clause-vocab (es uses `apartado`: capítulo 6)

**EN**

```
The monitoring limb is a second, separate obligation and it is the one organizations most often miss entirely: **the effectiveness of those controls shall be monitored**, and corrective actions considered where intended results are not achieved. An organization that implemented its declared controls and never asked whether they work has met the first half of that sentence.
::

::concept title="Defining and performing are split across the standard, and each pair has two clauses"
The split runs through the whole standard and the pairs are worth holding as a table, because most misplaced findings in module 4 come from citing the planning clause when the operating clause is the one that failed.

| Activity | Defined at | Performed at |
|---|---|---|
| AI risk assessment | 6.1.2 | **8.2** - at planned intervals, and whenever significant change is proposed or happens; retain documented information of the results |
| AI risk treatment | 6.1.3 | **8.3** - implement the risk treatment plan; retain documented information of the results |
| AI system impact assessment | 6.1.4 | **8.4** - at planned times and when significant changes occur; retain documented information of the results |
| Controls from the SoA | 6.1.3 | **8.1** - implement, and monitor their effectiveness |
```

**es-419**

```
El componente de monitoreo es una segunda obligación separada y es la que las organizaciones más frecuentemente omiten por completo: **la eficacia de esos controles deberá monitorearse**, y deberán considerarse acciones correctivas cuando no se logren los resultados previstos. Una organización que implementó sus controles declarados y nunca preguntó si funcionan ha cumplido solo la primera mitad de esa oración.
::

::concept title="Definir y ejecutar están separados en la norma, y cada par tiene dos apartados"
La separación recorre toda la norma y vale la pena mantener los pares como una tabla, porque la mayoría de los hallazgos mal ubicados en el módulo 4 provienen de citar el apartado de planificación cuando el apartado de operación es el que falló.

| Actividad | Definida en | Ejecutada en |
|---|---|---|
| Evaluación del riesgo de IA | 6.1.2 | **8.2** - a intervalos planificados y siempre que se proponga o se produzca un cambio significativo; conservar información documentada de los resultados |
| Tratamiento del riesgo de IA | 6.1.3 | **8.3** — implementar el plan de tratamiento del riesgo; conservar información documentada de los resultados |
| Evaluación del impacto del sistema de IA | 6.1.4 | **8.4** — en momentos planificados y cuando se producen cambios significativos; conservar información documentada de los resultados |
| Controles de la Declaración de Aplicabilidad | 6.1.3 | **8.1** — implementar y monitorear su eficacia |
```

### 12. ADVERSARIAL -- `aims-ia-04-02-boundaries-and-applicability` / es-419

flags: _unit (sentence); clause-vocab (es uses `apartado`: cláusula 4.3); clause-vocab (es uses `apartado`: cláusula 4.2); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.1); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3); clause-vocab (es uses `apartado`: capítulo 4.3)

**EN**

```
**Does the scope reflect the roles determined?** An organization determining that it develops, provides and uses AI systems, whose scope statement addresses only use, has not carried its own determination through. The obligations that attach to developing and providing sit outside a scope that does not reach them.

**Does the scope reflect the issues determined?** If clause 4.1 identified operations in two new jurisdictions as a relevant external issue, and the scope's virtual locations and activities do not reach the systems operating there, the consideration clause 4.3 requires did not happen.
::

::concept title="Interested-party requirements are the third input, and the least worked"
Clause 4.2 requires the organization to determine the interested parties relevant to the AI management system, their relevant requirements, and **which of those requirements will be addressed** through the AI management system.
```

**es-419**

```
**¿Refleja el alcance los roles determinados?** Una organización que determina que desarrolla, proporciona y usa sistemas de IA, cuyo enunciado de alcance aborda solo el uso, no ha trasladado su propia determinación hasta el final. Las obligaciones asociadas al desarrollo y la provisión quedan fuera de un alcance que no las alcanza.

**¿Refleja el alcance los asuntos determinados?** Si el apartado 4.1 identificó operaciones en dos nuevas jurisdicciones como un asunto externo relevante, y las ubicaciones virtuales y actividades del alcance no llegan a los sistemas que operan allí, la consideración que exige el capítulo 4.3 no tuvo lugar.
::

::concept title="Los requisitos de las partes interesadas son el tercer insumo, y el menos trabajado"
El apartado 4.2 requiere que la organización determine las partes interesadas relevantes para el sistema de gestión de IA, sus requisitos relevantes, y **cuáles de esos requisitos serán atendidos** a través del sistema de gestión de IA.
```

---

## AIMS-IA 2026-09-12 / pt-BR

26 row(s) in this stratum; 4 adversarial, 0 random.

### 13. ADVERSARIAL -- `aims-ia-04-02-boundaries-and-applicability` / pt-BR

flags: modal (should x3, no weak modal, 14 obligations vs 11 en); _unit (sentence); clause-vocab (pt uses a flat `Seção`: cláusula 4.3); clause-vocab (pt uses a flat `Seção`: cláusula 4.1); clause-vocab (pt uses a flat `Seção`: cláusula 4.2); clause-vocab (pt uses a flat `Seção`: cláusula 4.3); clause-vocab (pt uses a flat `Seção`: cláusula 4.1); clause-vocab (pt uses a flat `Seção`: cláusula 4.2); clause-vocab (pt uses a flat `Seção`: cláusula 4.1); clause-vocab (pt uses a flat `Seção`: cláusula 4.2); clause-vocab (pt uses a flat `Seção`: cláusula 4.2); clause-vocab (pt uses a flat `Seção`: cláusula 4.3)

**EN**

```
**Does the scope reflect the roles determined?** An organization determining that it develops, provides and uses AI systems, whose scope statement addresses only use, has not carried its own determination through. The obligations that attach to developing and providing sit outside a scope that does not reach them.

**Does the scope reflect the issues determined?** If clause 4.1 identified operations in two new jurisdictions as a relevant external issue, and the scope's virtual locations and activities do not reach the systems operating there, the consideration clause 4.3 requires did not happen.
::

::concept title="Interested-party requirements are the third input, and the least worked"
Clause 4.2 requires the organization to determine the interested parties relevant to the AI management system, their relevant requirements, and **which of those requirements will be addressed** through the AI management system.
```

**pt-BR**

```
**O escopo reflete os papéis determinados?** Uma organização que determinou que desenvolve, fornece e usa sistemas de IA, cujo enunciado de escopo aborda apenas o uso, não levou sua própria determinação adiante. As obrigações associadas ao desenvolvimento e ao fornecimento ficam fora de um escopo que não as alcança.

**O escopo reflete as questões determinadas?** Se a Seção 4.1 identificou operações em duas novas jurisdições como uma questão externa relevante, e os locais virtuais e as atividades do escopo não alcançam os sistemas que operam lá, a consideração que a Seção 4.3 exige não ocorreu.
::

::concept title="Os requisitos das partes interessadas são o terceiro insumo, e o menos trabalhado"
A Seção 4.2 exige que a organização determine as partes interessadas relevantes para o sistema de gestão de IA, seus requisitos relevantes e **quais desses requisitos serão atendidos** por meio do sistema de gestão de IA.
```

### 14. ADVERSARIAL -- `aims-ia-02-01-a-programme-is-designed-not-scheduled` / pt-BR

flags: accent (secao); convem (convem-que not clause-initial); convem (convem-que not clause-initial); convem (convem-que not clause-initial); convem (convem-que not clause-initial); _unit (block); clause-vocab (pt uses a flat `Seção`: cláusula 3.5); clause-vocab (pt uses a flat `Seção`: cláusula ); clause-vocab (pt uses a flat `Seção`: cláusula 5.1)

**EN**

```
The answer matters because clause 5.2 asks the audit client not only to establish objectives but to ensure the programme is implemented effectively. Where no one holds that role, the usual symptom is a programme that exists on paper and slips in practice - audits deferred, scopes quietly narrowed, findings from the previous cycle never revisited - with no one whose responsibility it was to notice.

ISO/IEC 42001 clause 5.3 requires top management to assign responsibility and authority for reporting on AIMS performance to top management. An audit programme with no identifiable client is often an early indicator that this assignment was made on paper only.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "An organization's AIMS audit programme objective reads: \"To verify ongoing conformity with ISO/IEC 42001 and readiness for certification.\" What is the most accurate assessment?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Adequate - it names the standard and the purpose of the programme." },
      { "id": "b", "text": "Weak against clause 5.2: it does not derive from the organization's context and cannot direct planning, since any audit plan would serve it equally." },
      { "id": "c", "text": "Nonconforming - programme objectives must be quantitative." },
      { "id": "d", "text": "Adequate for a first cycle, after which it should be replaced." }
    ],
    "correct": ["b"],
    "explanation": "Clause 5.2 asks that objectives be consistent with the audit client's strategic direction and context and that they direct the planning and conducting of audits. Nothing requires them to be quantitative, and nothing makes generic objectives acceptable in a first cycle - a first cycle has a context too.",
    "concept_slugs": ["aia-programme-objectives", "aia-objectives-from-context"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "Which statement correctly distinguishes a programme objective from an individual audit objective?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Programme objectives concern conformity; audit objectives concern effectiveness." },
      { "id": "b", "text": "A programme objective directs a set of audits over a time frame; an audit objective states what one audit is to accomplish, and ISO 19011 asks that the second be consistent with the first." },
      { "id": "c", "text": "Programme objectives are set by the auditor; audit objectives are set by the auditee." },
      { "id": "d", "text": "They are the same thing described at different levels of detail." }
    ],
    "correct": ["b"],
    "explanation": "Clause 5.2 covers programme objectives and 5.5.2 covers individual audit objectives, requiring consistency between them. Both can address conformity and effectiveness. Clause 5.2 places programme objectives with the audit client and 5.5.2 places audit objectives with the individual managing the programme; neither belongs to the auditee.",
    "concept_slugs": ["aia-programme-vs-individual-audit"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "An organization deployed AI systems in two new jurisdictions this year. Its audit programme objectives are unchanged from last year. What does ISO 19011:2026 clause 5.2 suggest about this?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Nothing - objectives should be stable to allow comparison between cycles." },
      { "id": "b", "text": "Objectives should be consistent with the audit client's context, and a material change in context that produced no change in objectives suggests they were not derived from it." },
      { "id": "c", "text": "The programme is nonconforming, because clause 5.2 requires annual revision of objectives." },
      { "id": "d", "text": "Only the individual audit objectives need to change." }
    ],
    "correct": ["b"],
    "explanation": "Clause 5.2 ties objectives to the audit client's strategic direction and context and lists changes to processes, products, services and projects among what they can be based on. It does not require annual revision, and stability is not itself a defect - what the unchanged objectives suggest is worth testing, not concluding.",
    "concept_slugs": ["aia-objectives-from-context", "aia-programme-objectives"],
    "bloom_level": "2_understand",
    "difficulty": 4
  },
  {
    "id": "q4",
    "question": "Why does ISO 19011:2026 clause 5.1 say the extent of an audit programme should follow from the auditee's size and character and the maturity of its management systems?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "So that larger organizations receive proportionally more audit days." },
      { "id": "b", "text": "So that the programme is sized to what this organization's systems actually require, rather than to a general standard of what an audit programme looks like." },
      { "id": "c", "text": "Because certification bodies calculate audit time on the same basis." },
      { "id": "d", "text": "Because clause 9.2 of ISO/IEC 42001 requires programme extent to be documented." }
    ],
    "correct": ["b"],
    "explanation": "Clause 5.1 lists size, nature, functionality, complexity, risks and opportunities, scope and maturity - a set of factors about this auditee, not a formula. Certification body audit-time calculation is a different exercise governed by ISO/IEC 17021-1 and, for AI, ISO/IEC 42006. Clause 9.2.2 requires an audit programme covering frequency, methods, responsibilities, planning requirements and reporting, not its extent as such.",
    "concept_slugs": ["aia-programme-objectives", "aia-objectives-from-context"],
    "bloom_level": "2_understand",
    "difficulty": 4
  }
]
::
```

**pt-BR**

```
A resposta importa porque a Seção 5.2 pede ao cliente da auditoria não apenas que estabeleça objetivos, mas que assegure que o programa seja implementado de forma eficaz. Quando ninguém ocupa esse papel, o sintoma habitual é um programa que existe no papel e escorrega na prática — auditorias adiadas, escopos silenciosamente reduzidos, constatações do ciclo anterior nunca revisitadas — sem que ninguém tivesse a responsabilidade de perceber.

A Seção 5.3 da ISO/IEC 42001 exige que a alta direção atribua responsabilidade e autoridade para reportar o desempenho do sistema de gestão de IA à alta direção. Um programa de auditoria sem um cliente identificável é frequentemente um indicador precoce de que essa atribuição foi feita apenas no papel.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "O objetivo do programa de auditoria do sistema de gestão de IA de uma organização é: \"Verificar a conformidade contínua com a ISO/IEC 42001 e a prontidão para certificação.\" Qual é a avaliação mais precisa?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Adequado — nomeia a norma e o propósito do programa." },
      { "id": "b", "text": "Fraco em relação à Seção 5.2: não deriva do contexto da organização e não consegue orientar o planejamento, pois qualquer plano de auditoria o serviria igualmente." },
      { "id": "c", "text": "Não conforme — os objetivos do programa devem ser quantitativos." },
      { "id": "d", "text": "Adequado para um primeiro ciclo, após o qual deve ser substituído." }
    ],
    "correct": ["b"],
    "explanation": "A Seção 5.2 pede que os objetivos sejam consistentes com a direção estratégica e o contexto do cliente da auditoria e que orientem o planejamento e a condução das auditorias. Nada exige que sejam quantitativos, e nada torna objetivos genéricos aceitáveis em um primeiro ciclo — um primeiro ciclo também tem um contexto.",
    "concept_slugs": ["aia-programme-objectives", "aia-objectives-from-context"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "Qual afirmação distingue corretamente um objetivo do programa de um objetivo de auditoria individual?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Os objetivos do programa dizem respeito à conformidade; os objetivos da auditoria dizem respeito à eficácia." },
      { "id": "b", "text": "Um objetivo do programa orienta um conjunto de auditorias ao longo de um período de tempo; um objetivo de auditoria declara o que uma auditoria deve realizar, e a ISO 19011 pede que o segundo seja consistente com o primeiro." },
      { "id": "c", "text": "Os objetivos do programa são definidos pelo auditor; os objetivos da auditoria são definidos pelo auditado." },
      { "id": "d", "text": "São a mesma coisa descrita em diferentes níveis de detalhe." }
    ],
    "correct": ["b"],
    "explanation": "A Seção 5.2 trata dos objetivos do programa e a Seção 5.5.2 trata dos objetivos da auditoria individual, exigindo consistência entre eles. Ambos podem abordar conformidade e eficácia. A Seção 5.2 coloca os objetivos do programa com o cliente da auditoria e a Seção 5.5.2 coloca os objetivos da auditoria com o indivíduo que gerencia o programa; nenhum deles pertence ao auditado.",
    "concept_slugs": ["aia-programme-vs-individual-audit"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "Uma organização implantou sistemas de IA em duas novas jurisdições este ano. Os objetivos do seu programa de auditoria estão inalterados em relação ao ano anterior. O que a Seção 5.2 da ISO 19011:2026 sugere sobre isso?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Nada — os objetivos devem ser estáveis para permitir a comparação entre ciclos." },
      { "id": "b", "text": "Os objetivos devem ser consistentes com o contexto do cliente da auditoria, e uma mudança material de contexto que não produziu nenhuma mudança nos objetivos sugere que eles não foram derivados dele." },
      { "id": "c", "text": "O programa está em não conformidade, porque a Seção 5.2 exige revisão anual dos objetivos." },
      { "id": "d", "text": "Apenas os objetivos da auditoria individual precisam mudar." }
    ],
    "correct": ["b"],
    "explanation": "A Seção 5.2 vincula os objetivos à direção estratégica e ao contexto do cliente da auditoria e lista mudanças em processos, produtos, serviços e projetos entre o que pode embasá-los. Ela não exige revisão anual, e a estabilidade em si não é um defeito — o que os objetivos inalterados sugerem vale a pena ser testado, não concluído.",
    "concept_slugs": ["aia-objectives-from-context", "aia-programme-objectives"],
    "bloom_level": "2_understand",
    "difficulty": 4
  },
  {
    "id": "q4",
"question": "Por que a cláusula 5.1 da ISO 19011:2026 afirma que a extensão de um programa de auditoria convém que siga o tamanho e as características do auditado e a maturidade de seus sistemas de gestão?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Para que organizações maiores recebam proporcionalmente mais dias de auditoria." },
      { "id": "b", "text": "Para que o programa seja dimensionado de acordo com o que os sistemas desta organização realmente exigem, e não com um padrão geral de como um programa de auditoria deve ser." },
      { "id": "c", "text": "Porque os organismos de certificação calculam o tempo de auditoria na mesma base." },
      { "id": "d", "text": "Porque a Seção 9.2 da ISO/IEC 42001 exige que a extensão do programa seja documentada." }
    ],
    "correct": ["b"],
    "explanation": "A Seção 5.1 lista tamanho, natureza, funcionalidade, complexidade, riscos e oportunidades, escopo e maturidade — um conjunto de fatores sobre este auditado, não uma fórmula. O cálculo do tempo de auditoria por organismos de certificação é um exercício diferente, regido pela ISO/IEC 17021-1 e, para IA, pela ISO/IEC 42006. A Seção 9.2.2 exige um programa de auditoria que cubra frequência, métodos, responsabilidades, requisitos de planejamento e reporte, não sua extensão como tal.",
    "concept_slugs": ["aia-programme-objectives", "aia-objectives-from-context"],
    "bloom_level": "2_understand",
    "difficulty": 4
  }
]
::
```

### 15. ADVERSARIAL -- `aims-ia-05-04-can-this-finding-stand` / pt-BR

flags: _unit (sentence); modal-sentence (should -> obligation (sentence): O A.6.2.6 exige que a organização defina e documente os elementos necessários pa); modal-sentence (should -> obligation (sentence): O A.6.2.8 exige que a organização determine em quais fases do ciclo de vida o re); clause-vocab (pt uses a flat `Seção`: cláusula 3.16); clause-vocab (pt uses a flat `Seção`: cláusula 3.14); clause-vocab (pt uses a flat `Seção`: cláusula 3.15); clause-vocab (pt uses a flat `Seção`: cláusula 4.2); clause-vocab (pt uses a flat `Seção`: cláusula 3.26)

**EN**

```
**Look for a different criterion that does carry it.** Frequently one exists. An observation that will not stand against ISO 19011 clause 5.5.3's method-selection guidance may stand against ISO/IEC 42001 clause 9.2.2, which requires the audit programme to include methods. An observation that will not stand against Annex B guidance may stand against clause 6.1.3 e) if the guidance was never considered at all, or against clause 8.1 if a declared control is not operated.

**Check the organization's own requirements.** The criterion most often forgotten, per lesson 05-03. If the organization's own procedure requires what the auditor thinks should happen, clause 9.2.1 a) 1) makes it a criterion and the finding stands.

**And withdraw it if none of those work.** An auditor who withdraws their own finding at the closing meeting has done the job correctly. It costs a sentence. A finding pressed through on a criterion that will not carry it costs the auditor's credibility on every other finding in the report, and lesson 03-08 covered why the closing meeting is where that becomes visible.
::
```

**pt-BR**

```
**Procure um critério diferente que a suporte.** Com frequência, existe um. Uma observação que não se sustenta contra a orientação da Seção 5.5.3 da ISO 19011 sobre seleção de métodos pode se sustentar contra a Seção 9.2.2 da ISO/IEC 42001, que exige que o programa de auditoria inclua métodos. Uma observação que não se sustenta contra a orientação do Anexo B pode se sustentar contra a Seção 6.1.3 e) se a orientação nunca foi considerada, ou contra a Seção 8.1 se um controle declarado não está sendo operado.

**Verifique os requisitos próprios da organização.** O critério mais frequentemente esquecido, conforme a lição 05-03. Se o próprio procedimento da organização exige o que o auditor considera que deveria acontecer, a Seção 9.2.1 a) 1) o torna um critério e a constatação se sustenta.

**E retire-a se nenhuma dessas alternativas funcionar.** Um auditor que retira sua própria constatação na reunião de encerramento fez o trabalho corretamente. Custa uma frase. Uma constatação pressionada com um critério que não a suporta custa a credibilidade do auditor em todas as outras constatações do relatório, e a lição 03-08 explicou por que a reunião de encerramento é onde isso se torna visível.
::
```

### 16. ADVERSARIAL -- `aims-ia-02-03-competence-the-team-needs` / pt-BR

flags: accent (secao); convem (convem-que not clause-initial); convem (convem-que not clause-initial); convem (convem-que not clause-initial); _unit (sentence); modal-sentence (should -> obligation (sentence): Esse julgamento requer compreensão do domínio, e um auditor sem ela deve declara); clause-vocab (pt uses a flat `Seção`: cláusula 3.15); clause-vocab (pt uses a flat `Seção`: cláusula 3.17)

**EN**

```
Clause 5.3 places this squarely in the programme's risks: lack of competent auditors is named there, and the clause asks that such risks be presented to the audit client when developing the programme and its resource requirements. **The competence decision is made when the programme is planned, not discovered during fieldwork.**
::

::interactive widget="drag-match" id="which-remedy-fits" concept_slugs="aia-competence-gap-remedies,aia-technical-expert-vs-auditor,aia-aims-specific-knowledge"
{
  "items": [
    { "id": "s1", "text": "The audit team can plan and conduct the audit but cannot judge whether a model evaluation report supports the deployment claim made for it." },
    { "id": "s2", "text": "The only person who understands the retraining pipeline is the engineer who operates it, and the audit covers that area." },
    { "id": "s3", "text": "No one available in this cycle can evaluate the data provenance records for the two acquired systems, and no expert can be engaged in time." },
    { "id": "s4", "text": "A capable auditor lacks AIMS experience but will run this programme for several cycles." }
  ],
  "targets": [
    { "id": "t-expert", "text": "Technical expert supports the team; auditors still form the conclusions" },
    { "id": "t-safeguards", "text": "Proceed with declared safeguards under the clause 4.6 carve-out" },
    { "id": "t-narrow", "text": "Narrow the scope and state the omission in the report" },
    { "id": "t-train", "text": "Train and pair, accepting it does not help this cycle" }
  ],
  "correct": {
    "s1": "t-expert",
    "s2": "t-safeguards",
    "s3": "t-narrow",
    "s4": "t-train"
  },
  "explanation": "The third is the one people avoid choosing, and it is often correct. Auditing an area you cannot evaluate produces a finding about whether documents exist, which is worse than a stated gap - it looks like coverage. Clause 4.3 asks that significant obstacles encountered be reported, and an area nobody could competently audit is exactly such an obstacle."
}
::

::deep-dive title="Auditing the organization's competence determination with your own in question"
There is an uncomfortable case worth naming, because it arrives in small organizations regularly.
```

**pt-BR**

```
A Seção 5.3 coloca isso diretamente nos riscos do programa: a falta de auditores competentes é mencionada ali, e a seção exige que esses riscos sejam apresentados ao cliente da auditoria ao desenvolver o programa e seus requisitos de recursos. **A decisão sobre competência é tomada quando o programa é planejado, não descoberta durante o trabalho de campo.**
::

::interactive widget="drag-match" id="which-remedy-fits" concept_slugs="aia-competence-gap-remedies,aia-technical-expert-vs-auditor,aia-aims-specific-knowledge"
{
  "items": [
    { "id": "s1", "text": "A equipe de auditoria consegue planejar e conduzir a auditoria, mas não consegue julgar se um relatório de avaliação de modelo sustenta a afirmação de implantação feita para ele." },
    { "id": "s2", "text": "A única pessoa que entende o pipeline de retreinamento é o engenheiro que o opera, e a auditoria cobre essa área." },
    { "id": "s3", "text": "Ninguém disponível neste ciclo consegue avaliar os registros de proveniência de dados dos dois sistemas adquiridos, e nenhum especialista pode ser contratado a tempo." },
    { "id": "s4", "text": "Um auditor capaz não tem experiência em sistema de gestão de IA, mas conduzirá este programa por vários ciclos." }
  ],
  "targets": [
    { "id": "t-expert", "text": "Especialista técnico apoia a equipe; os auditores ainda formam as conclusões" },
    { "id": "t-safeguards", "text": "Prosseguir com salvaguardas declaradas sob a ressalva da Seção 4.6" },
    { "id": "t-narrow", "text": "Reduzir o escopo e declarar a omissão no relatório" },
    { "id": "t-train", "text": "Treinar e parear, aceitando que não ajuda neste ciclo" }
  ],
  "correct": {
    "s1": "t-expert",
    "s2": "t-safeguards",
    "s3": "t-narrow",
    "s4": "t-train"
  },
  "explanation": "A terceira é a que as pessoas evitam escolher, e frequentemente é a correta. Auditar uma área que não se consegue avaliar produz uma constatação sobre se documentos existem, o que é pior do que uma lacuna declarada — parece cobertura. A Seção 4.3 exige que obstáculos significativos encontrados durante a auditoria sejam relatados, e uma área que ninguém conseguiu auditar com competência é exatamente esse tipo de obstáculo."
}
::

::deep-dive title="Auditar a determinação de competência da organização com a sua própria em questão"
Há um caso desconfortável que vale nomear, pois aparece regularmente em organizações pequenas.
```

---

## ISMS-IA 2026-08-12 / es-419

34 row(s) in this stratum; 4 adversarial, 0 random.

### 17. ADVERSARIAL -- `isms-ia-01-01-audit-parties` / es-419

flags: modal (should x1, no weak modal, 2 obligations vs 0 en); _unit (sentence); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: Capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2)

**EN**

```
They overlap in evidence and they are not interchangeable in obligation. One piece of evidence can serve more than one of them - the same interview record might support a clause 9.2 finding and a 5.36 compliance review. What cannot happen is one **activity** being offered as discharging all three without anyone checking that its scope, criteria and independence actually satisfied each.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "An organization's certification body completed a surveillance audit three months ago and raised no findings. The internal audit programme has not run this year. Which statement is correct?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "The clause 9.2 obligation is satisfied, because an audit of the ISMS was conducted at a planned interval." },
      { "id": "b", "text": "The clause 9.2 obligation is outstanding, because a third-party audit answers a different question under different criteria." },
      { "id": "c", "text": "The clause 9.2 obligation is satisfied only if the certification body's report is shared with management." },
      { "id": "d", "text": "The clause 9.2 obligation is deferred until the next surveillance visit." }
    ],
    "correct": ["b"],
    "explanation": "A third-party audit is commissioned by the certification body, applies its criteria, and results in a decision about a certificate. Clause 9.2 requires the organization to obtain information for itself, against its own requirements as well as the standard's. Neither the report being shared nor the timing changes the type of audit that was conducted.",
    "concept_slugs": ["ia-who-may-conduct-each-audit-type", "ia-first-party-audit-purpose"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "A retailer engages an independent consultancy to conduct its scheduled internal audit, using the retailer's own audit criteria and reporting to the retailer's management. How should this audit be classified?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Second party, because an external organization conducted it." },
      { "id": "b", "text": "Third party, because the consultancy is independent of the retailer." },
      { "id": "c", "text": "First party, because the retailer commissioned it, its criteria apply, and it is the audience." },
      { "id": "d", "text": "It cannot be classified until the consultancy's accreditation status is known." }
    ],
    "correct": ["c"],
    "explanation": "ISO 19011:2026 clause 3.1 defines audit, and a note there allows an internal audit to be run in-house or handed to an outside party engaged to carry it out. Who performs the fieldwork does not determine the audit type. The commissioner, the criteria and the audience do.",
    "concept_slugs": ["ia-first-party-audit-purpose", "ia-19011-table-1-audit-types"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "An auditor is told: \"We commissioned an independent review of our security approach in March, so control 5.35 and clause 9.2 are both covered.\" What is the most accurate response?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Correct, provided the review was documented and conducted at a planned interval." },
      { "id": "b", "text": "Correct for control 5.35 only; clause 9.2 requires an internal audit programme examining conformity and effective implementation of the management system." },
      { "id": "c", "text": "Correct for clause 9.2 only; control 5.35 additionally requires a certification body to be involved." },
      { "id": "d", "text": "Incorrect for both; independent review is guidance rather than a requirement." }
    ],
    "correct": ["b"],
    "explanation": "Both obligations speak of planned intervals, which is why they are confused. Control 5.35 asks whether the organization's approach to managing information security holds up under independent review. Clause 9.2 asks whether the management system conforms and is effectively implemented and maintained. Control 5.35 does not involve a certification body, and Annex A controls are not guidance.",
    "concept_slugs": ["ia-clause-9-2-versus-control-5-35", "ia-annex-a-5-35-independent-review"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "Which of the following are true of a second-party audit? Select all that apply.",
    "type": "multi_choice",
    "options": [
      { "id": "a", "text": "It is conducted by a party with an interest in the organization, such as a customer." },
      { "id": "b", "text": "An organization auditing its own external provider is conducting one." },
      { "id": "c", "text": "It results in a certificate of conformity being issued or withheld." },
      { "id": "d", "text": "ISO 19011 offers guidance applicable to it." }
    ],
    "correct": ["a", "b", "d"],
    "explanation": "Certificates come from third-party certification audits, governed by ISO/IEC 17021-1 with ISO/IEC 27006 for ISMS specifics. ISO 19011's introduction states that it concentrates on first-party audits and on audits an organization conducts of its external providers and other external interested parties - which is the second-party case.",
    "concept_slugs": ["ia-second-party-audit-context", "ia-third-party-certification-audit"],
    "bloom_level": "2_understand",
    "difficulty": 2
  }
]
::

::summary
- Audit type is set by who commissioned it, whose criteria apply and what it can result in.
- An internal audit may be performed by an external party and remain first party.
- Clause 9.2 checks the management system; Annex A 5.35 independently reviews the whole approach.
- Both say "planned intervals"; satisfying one does not satisfy the other.
- Clause 9.2 is owed by everyone; 5.35 is an Annex A control and may be justifiably excluded.
- Third-party certification auditing is governed by ISO/IEC 17021-1, not by ISO 19011.
::
```

**es-419**

```
Se superponen en evidencia y no son intercambiables en obligación. Una pieza de evidencia puede servir para más de uno — el mismo registro de entrevista podría respaldar un hallazgo del capítulo 9.2 y una revisión de cumplimiento del 5.36. Lo que no puede ocurrir es que una **actividad** se ofrezca como cumplimiento de las tres sin que nadie verifique que su alcance, criterios e independencia satisfacen efectivamente cada una.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "El organismo de certificación de una organización completó una auditoría de seguimiento hace tres meses y no levantó ningún hallazgo. El programa de auditoría interna no se ha ejecutado este año. ¿Cuál afirmación es correcta?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "La obligación del capítulo 9.2 está satisfecha, porque se realizó una auditoría del SGSI a un intervalo planificado." },
      { "id": "b", "text": "La obligación del capítulo 9.2 está pendiente, porque una auditoría de tercera parte responde a una pregunta diferente bajo criterios diferentes." },
      { "id": "c", "text": "La obligación del capítulo 9.2 está satisfecha solo si el informe del organismo de certificación se comparte con la dirección." },
      { "id": "d", "text": "La obligación del capítulo 9.2 queda diferida hasta la próxima visita de seguimiento." }
    ],
    "correct": ["b"],
    "explanation": "Una auditoría de tercera parte es encargada por el organismo de certificación, aplica sus criterios y resulta en una decisión sobre un certificado. El capítulo 9.2 requiere que la organización obtenga información para sí misma, frente a sus propios requisitos además de los de la norma. Ni que el informe se comparta ni el momento en que se realice cambia el tipo de auditoría que se llevó a cabo.",
    "concept_slugs": ["ia-who-may-conduct-each-audit-type", "ia-first-party-audit-purpose"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "Un minorista contrata a una consultoría independiente para llevar a cabo su auditoría interna programada, utilizando los propios criterios de auditoría del minorista e informando a la dirección del minorista. ¿Cómo debe clasificarse esta auditoría?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Segunda parte, porque una organización externa la realizó." },
      { "id": "b", "text": "Tercera parte, porque la consultoría es independiente del minorista." },
      { "id": "c", "text": "Primera parte, porque el minorista la encargó, sus criterios se aplican y él es el destinatario." },
      { "id": "d", "text": "No puede clasificarse hasta que se conozca el estado de acreditación de la consultoría." }
    ],
    "correct": ["c"],
    "explanation": "ISO 19011:2026 define auditoría en 3.1, y una nota allí permite que una auditoría interna se realice internamente o se encargue a un tercero contratado para llevarla a cabo. Quién realiza el trabajo de campo no determina el tipo de auditoría. Lo que lo determina es el comitente, los criterios y el destinatario.",
    "concept_slugs": ["ia-first-party-audit-purpose", "ia-19011-table-1-audit-types"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "A un auditor se le dice: «Encargamos una revisión independiente de nuestro enfoque de seguridad en marzo, así que el control 5.35 y el capítulo 9.2 están ambos cubiertos». ¿Cuál es la respuesta más precisa?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Correcto, siempre que la revisión haya sido documentada y realizada a un intervalo planificado." },
      { "id": "b", "text": "Correcto solo para el control 5.35; el capítulo 9.2 requiere un programa de auditoría interna que examine la conformidad y la implementación eficaz del sistema de gestión." },
      { "id": "c", "text": "Correcto solo para el capítulo 9.2; el control 5.35 requiere adicionalmente la participación de un organismo de certificación." },
      { "id": "d", "text": "Incorrecto para ambos; la revisión independiente es orientación y no un requisito." }
    ],
    "correct": ["b"],
    "explanation": "Ambas obligaciones hablan de intervalos planificados, que es la razón por la que se confunden. El control 5.35 pregunta si el enfoque de la organización para gestionar la seguridad de la información se sostiene bajo una revisión independiente. El capítulo 9.2 pregunta si el sistema de gestión cumple y está implementado y mantenido de manera eficaz. El control 5.35 no involucra a un organismo de certificación, y los controles del Anexo A no son orientación.",
    "concept_slugs": ["ia-clause-9-2-versus-control-5-35", "ia-annex-a-5-35-independent-review"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "¿Cuáles de las siguientes afirmaciones son verdaderas sobre una auditoría de segunda parte? Seleccione todas las que apliquen.",
    "type": "multi_choice",
    "options": [
      { "id": "a", "text": "Es realizada por una parte con interés en la organización, como un cliente." },
      { "id": "b", "text": "Una organización que audita a su propio proveedor externo está realizando una." },
      { "id": "c", "text": "Resulta en la emisión o denegación de un certificado de conformidad." },
      { "id": "d", "text": "ISO 19011 ofrece orientación aplicable a ella." }
    ],
    "correct": ["a", "b", "d"],
    "explanation": "Los certificados provienen de auditorías de certificación de tercera parte, regidas por ISO/IEC 17021-1 con ISO/IEC 27006 para los aspectos específicos del SGSI. La introducción de ISO 19011 establece que se concentra en las auditorías de primera parte y en las auditorías que una organización realiza de sus proveedores externos y otras partes interesadas externas — que es el caso de segunda parte.",
    "concept_slugs": ["ia-second-party-audit-context", "ia-third-party-certification-audit"],
    "bloom_level": "2_understand",
    "difficulty": 2
  }
]
::

::summary
- El tipo de auditoría está determinado por quién la encargó, qué criterios se aplican y cuál puede ser su resultado.
- Una auditoría interna puede ser realizada por una parte externa y seguir siendo de primera parte.
- El capítulo 9.2 verifica el sistema de gestión; el control 5.35 del Anexo A revisa de forma independiente el enfoque global.
- Ambos mencionan "intervalos planificados"; satisfacer uno no satisface el otro.
- El capítulo 9.2 es una obligación de toda organización; el 5.35 es un control del Anexo A y puede ser justificadamente excluido.
- La auditoría de certificación de tercera parte está regida por ISO/IEC 17021-1, no por ISO 19011.
::
```

### 18. ADVERSARIAL -- `isms-ia-04-01-what-the-scope-left-out` / es-419

flags: structure (quotes en=3 tr=2); _unit (block); clause-vocab (es uses `apartado`: cláusula 4.3); clause-vocab (es uses `apartado`: cláusula 1); clause-vocab (es uses `apartado`: cláusula 4.3); clause-vocab (es uses `apartado`: cláusula 6.1.3); clause-vocab (es uses `apartado`: capítulo 4); clause-vocab (es uses `apartado`: Capítulo 1); clause-vocab (es uses `apartado`: Capítulo 1); clause-vocab (es uses `apartado`: Capítulo 1); clause-vocab (es uses `apartado`: Capítulo 1); clause-vocab (es uses `apartado`: Capítulo 1); clause-vocab (es uses `apartado`: Capítulo 1)

**EN**

```
**What "consider" means matters here.** It does not require the other organization to be inside the scope - it cannot be. It requires the interface to have been identified and its treatment decided: through supplier controls, through contractual requirements, through a declared boundary that names where the organization's responsibility ends.

**A scope that is silent about a dependency has not considered it, and that silence is the finding.** Not the dependency existing, which is normal, but the absence of any evidence it was determined.
::

::callout type="pitfall"
"That's the provider's responsibility" is a legitimate treatment of an interface and an illegitimate reason to omit it from the scope determination. The point of naming the interface is to record where responsibility transfers.
::
```

**es-419**

```
**El significado de "considerar" importa aquí.** No exige que la otra organización esté dentro del alcance —no puede estarlo—. Exige que la interfaz haya sido identificada y que su tratamiento haya sido decidido: mediante controles de proveedores, mediante requisitos contractuales, mediante un límite declarado que indique dónde termina la responsabilidad de la organización.

**Un alcance que guarda silencio sobre una dependencia no la ha considerado, y ese silencio es el hallazgo.** No la existencia de la dependencia, que es normal, sino la ausencia de cualquier evidencia de que fue determinada.
::

::callout type="pitfall"
"Eso es responsabilidad del proveedor" es un tratamiento legítimo de una interfaz y una razón ilegítima para omitirla de la determinación del alcance. El propósito de nombrar la interfaz es registrar dónde se transfiere la responsabilidad.
::
```

### 19. ADVERSARIAL -- `isms-ia-02-06-testing-the-programme` / es-419

flags: _unit (sentence); clause-vocab (es uses `apartado`: cláusula 9.2.2); clause-vocab (es uses `apartado`: cláusula 9.2.2); clause-vocab (es uses `apartado`: cláusula 9.2.2); clause-vocab (es uses `apartado`: cláusula 9.2.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2); clause-vocab (es uses `apartado`: capítulo 9.2)

**EN**

```
Audit reports are usually present - they are the visible output. Evidence of *implementation* is thinner: that the programme was established, that it ran as planned, and that deviations were handled.

What tends to satisfy it:

- The programme itself, dated and approved.
- Evidence that the scheduled audits happened - completed reports mapped against the plan.
- A record of deviations. An audit deferred, cancelled or rescoped, with the reason.
- Evidence that results reached relevant management, per 9.2.2 c). A report filed in a folder that management does not read has not been reported to them.
```

**es-419**

```
Los informes de auditoría suelen estar presentes: son el resultado visible. La evidencia de la *implementación* es más escasa: que el programa fue establecido, que se ejecutó según lo planificado y que las desviaciones fueron gestionadas.

Lo que tiende a satisfacerlo:

- El programa en sí, con fecha y aprobación.
- Evidencia de que las auditorías programadas se realizaron: informes completados mapeados contra el plan.
- Un registro de desviaciones. Una auditoría diferida, cancelada o con alcance modificado, con la razón correspondiente.
- Evidencia de que los resultados llegaron a la dirección pertinente, conforme al apartado 9.2.2 c). Un informe archivado en una carpeta que la dirección no lee no le ha sido comunicado.
```

### 20. ADVERSARIAL -- `isms-ia-02-03-scope-criteria-objectives` / es-419

flags: ceiling (span 2 en=24 tr=36 cap=34); _unit (sentence); clause-vocab (es uses `apartado`: cláusula 9.2.2); clause-vocab (es uses `apartado`: cláusula 1); clause-vocab (es uses `apartado`: cláusula 1); clause-vocab (es uses `apartado`: Capítulo 1); clause-vocab (es uses `apartado`: Capítulo 1); clause-vocab (es uses `apartado`: Capítulo 1); clause-vocab (es uses `apartado`: Capítulo 1); clause-vocab (es uses `apartado`: Capítulo 1); clause-vocab (es uses `apartado`: Capítulo 1)

**EN**

```
Scope is what the audit will examine. It is not what the audit will conclude about, which is a separate discipline covered in Module 3.
::

::concept title="Criteria: what evidence is compared against"
ISO 19011:2026 defines **audit criteria** as the set of requirements used as a reference against which objective evidence is compared. Its notes make the breadth explicit - criteria may be policies, procedures or work instructions, legal requirements and contractual obligations and industry standards.

For an internal ISMS audit, the criteria are typically ISO/IEC 27001 **and** the organization's own requirements. Clause 9.2.1 lists both, in that order:
```

**es-419**

```
El alcance es lo que la auditoría examinará. No es aquello sobre lo que la auditoría concluirá, que es una disciplina separada tratada en el Módulo 3.
::

::concept title="Criterios: contra qué se compara la evidencia"
ISO 19011:2026 define los **criterios de auditoría** como el conjunto de requisitos utilizados como referencia contra la cual se compara la evidencia objetiva. Sus notas hacen explícita la amplitud del término: los criterios pueden ser políticas, procedimientos o instrucciones de trabajo, requisitos legales y obligaciones contractuales y normas del sector.

Para una auditoría interna del SGSI, los criterios son típicamente ISO/IEC 27001 **y** los propios requisitos de la organización. El apartado 9.2.1 enumera ambos, en ese orden:
```

---

## ISMS-IA 2026-08-12 / pt-BR

31 row(s) in this stratum; 4 adversarial, 0 random.

### 21. ADVERSARIAL -- `isms-ia-03-08-what-the-tool-verified` / pt-BR

flags: _unit (sentence); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula ); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula ); clause-vocab (pt uses a flat `Seção`: cláusula ); clause-vocab (pt uses a flat `Seção`: cláusula ); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula)

**EN**

```
**The specific risk is a blind spot with a shape.** A tool trained or configured to find things that look like known problems will reliably not surface the problem that looks like nothing. An audit that finds no anomalies in a tool-selected sample has established that the tool found no anomalies.
::

::callout type="exam-watch"
Know what **shape** a tool's misses have, not its accuracy percentage. Template matching finds absence, not weakness - a clause present but reduced to best endeavours passes. Anomaly detection finds the unusual, not the routine problem. Keyword search finds the term, not the paraphrase. **The shape of the miss is what determines what a clean result means**, and an auditor who cannot describe it cannot say what their sample established.
::

::concept title="Provenance, and the question to ask"
Lesson 03-03 established that provenance is what you lose first with remote evidence. With tool-assisted evidence you lose it in a different way: not the source of the record, but **the process that selected or transformed it.**
```

**pt-BR**

```
**O risco específico é um ponto cego com uma forma definida.** Uma ferramenta treinada ou configurada para encontrar coisas que se parecem com problemas conhecidos não irá, de forma confiável, identificar o problema que não se parece com nada. Uma auditoria que não encontra anomalias em uma amostra selecionada por ferramenta estabeleceu que a ferramenta não encontrou anomalias.
::

::callout type="exam-watch">
Saiba qual **forma** têm as omissões de uma ferramenta, não seu percentual de precisão. A correspondência por modelo encontra ausência, não fraqueza — uma cláusula presente, mas reduzida a melhores esforços, passa. A detecção de anomalias encontra o incomum, não o problema rotineiro. A busca por palavras-chave encontra o termo, não a paráfrase. **A forma da omissão é o que determina o que um resultado limpo significa**, e um auditor que não consegue descrevê-la não pode dizer o que sua amostra estabeleceu.
::

::concept title="Proveniência e a pergunta a fazer"
A lição 03-03 estabeleceu que a proveniência é o que se perde primeiro com evidências remotas. Com evidências assistidas por ferramenta, ela se perde de uma forma diferente: não a origem do registro, mas **o processo que o selecionou ou transformou.**
```

### 22. ADVERSARIAL -- `isms-ia-02-03-scope-criteria-objectives` / pt-BR

flags: ceiling (span 2 en=24 tr=33 cap=32); _unit (block); clause-vocab (pt uses a flat `Seção`: cláusula 9.2.2); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: Cláusula 1); clause-vocab (pt uses a flat `Seção`: Cláusula); clause-vocab (pt uses a flat `Seção`: Cláusula 1); clause-vocab (pt uses a flat `Seção`: Cláusula)

**EN**

```
Scope is what the audit will examine. It is not what the audit will conclude about, which is a separate discipline covered in Module 3.
::

::concept title="Criteria: what evidence is compared against"
ISO 19011:2026 defines **audit criteria** as the set of requirements used as a reference against which objective evidence is compared. Its notes make the breadth explicit - criteria may be policies, procedures or work instructions, legal requirements and contractual obligations and industry standards.

For an internal ISMS audit, the criteria are typically ISO/IEC 27001 **and** the organization's own requirements. Clause 9.2.1 lists both, in that order:
```

**pt-BR**

```
Escopo é o que a auditoria examinará. Não é sobre o que a auditoria concluirá, o que é uma disciplina separada abordada no Módulo 3.
::

::concept title="Critérios: contra o que as evidências são comparadas"
A ISO 19011:2026 define **critérios de auditoria** como o conjunto de requisitos usados como referência contra os quais as evidências objetivas são comparadas. Suas notas tornam a abrangência explícita - os critérios podem ser políticas, procedimentos ou instruções de trabalho, requisitos legais e obrigações contratuais e normas do setor.

Para uma auditoria interna de SGSI, os critérios são tipicamente a ISO/IEC 27001 **e** os próprios requisitos da organização. A Seção 9.2.1 lista ambos, nessa ordem:
```

### 23. ADVERSARIAL -- `isms-ia-05-04-what-the-report-must-disclose` / pt-BR

flags: _unit (sentence); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula ); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula); clause-vocab (pt uses a flat `Seção`: cláusula)

**EN**

```
**Method disclosure is the same principle applied to how the evidence was obtained.** It is not a new obligation invented for AI. Reports have always said "a sample of twelve records was examined, selected as those processed during the migration" - because the selection shapes what the absence of exceptions means.
::

::concept title="The test: did it shape the evidence?"
Lesson 03-08 established that a tool making selection decisions is making a sampling decision. Here is what follows for the report.

**Disclose where the tool shaped which evidence was examined or how it was interpreted.**
```

**pt-BR**

```
**A divulgação do método é o mesmo princípio aplicado à forma como as evidências foram obtidas.** Não é uma obrigação nova criada para a IA. Os relatórios sempre disseram "uma amostra de doze registros foi examinada, selecionados por serem os processados durante a migração" — porque a seleção determina o que a ausência de exceções significa.
::

::concept title="O critério: a ferramenta moldou as evidências?"
A lição 03-08 estabeleceu que uma ferramenta que toma decisões de seleção está tomando uma decisão de amostragem. Eis o que isso implica para o relatório.

**Divulgue quando a ferramenta moldou quais evidências foram examinadas ou como foram interpretadas.**
```

### 24. ADVERSARIAL -- `isms-ia-04-05-competence-awareness-documents` / pt-BR

**NOT SAMPLED: the two bodies do not share a block signature.** Printing a pair
that is not a pair is worse than printing nothing -- this row needs the structure
flag read first.

---

## Not sampled -- 1 row(s) whose bodies do not align

These carry a different sequence of blocks from their English, so there is no
coordinate at which the two can be compared. They are the structure finding, and a
passage pair would have been fiction.

- `isms-ia-04-05-competence-awareness-documents/pt-BR`
