# AIMS-F: repaired English, no retranslation record

Generated 2026-09-23 by `scripts/classify-uncovered-repairs.mjs --cert AIMS-F`. **Read-only. Nothing was changed.**

**33 lessons, 123 spans.** Every one is a REPRODUCTION-REMOVAL: the `before` text was measured against the indexed ISO corpus and matched a run of ISO's own words. Classification is by measurement, not by the repair note.

**AIMS-F is released, and there is no `*-spec.json` for it on disk** — so no record exists that any of these repairs was followed by a retranslation.

The live Spanish and Portuguese are located by **paragraph position**: the English paragraph containing the repaired text, then the same index in each translation. These bodies are structurally parallel markdown and it held for every span below; it is alignment by position, not by meaning.

> **What to look for:** does the live Spanish render the ENGLISH BEFORE (ISO's sentence, translated) or the ENGLISH AFTER (ours)? The leak index is English-only, so no instrument here can answer it.

---

## 01-01-what-an-aims-is

`42001 clause 0.1 and clause 1`  —  2 span(s)  —  _second span is the conformity-evidence sentence, recast as in batch 1_

### run 10w, coverage 0.71

| | |
|---|---|
| **EN before** | combine established frameworks, other International Standards, and its own experience to implement things like |
| **EN after** | combine established frameworks, other standards and its own experience when implementing things like |

**live es-419**  —  La norma es explícita sobre esta restricción. Evita deliberadamente orientaciones específicas sobre los procesos de gestión y espera que la organización combine marcos establecidos, otras normas y su propia experiencia al implementar aspectos como la gestión del riesgo, la gestión del ciclo de vida y la gestión de la calidad de los datos de una manera que se adapte a sus propios casos de uso.

**live pt-BR**  —  A norma é explícita sobre essa contenção. Ela deliberadamente evita orientações específicas sobre processos de gestão e espera que a organização combine frameworks estabelecidos, outras normas e sua própria experiência ao implementar coisas como gestão de riscos, gestão do ciclo de vida e gestão da qualidade de dados de uma forma adequada aos seus próprios casos de uso.

### run 16w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | can generate evidence of its responsibility and accountability regarding its role with respect to AI systems. |
| **EN after** | can produce evidence that it is responsible and accountable for whatever role it holds around AI systems. |

**live es-419**  —  Lo que la propia ISO/IEC 42001 dice sobre el resultado es más acotado y vale la pena leerlo con precisión: una organización que cumple con sus requisitos puede producir evidencia de que es responsable y rinde cuentas por cualquier rol que desempeñe en torno a los sistemas de IA. Eso es una afirmación sobre evidencia, no una afirmación sobre el cumplimiento de ninguna ley.

**live pt-BR**  —  O que a própria ISO/IEC 42001 diz sobre o resultado é mais restrito e vale a pena ler com precisão: uma organização em conformidade com seus requisitos pode produzir evidências de que é responsável e presta contas por qualquer papel que desempenhe em relação a sistemas de IA. Essa é uma afirmação sobre evidências, não uma afirmação sobre conformidade com qualquer lei.

## 01-02-determining-your-roles

`42001 A.10 relationship controls`  —  1 span(s)  —  _the list reorder already used for tasks.knowledge 4.6_

### run 11w, coverage 0.92

| | |
|---|---|
| **EN before** | responsibilities allocated between the organization, its partners, suppliers, customers and third parties |
| **EN after** | responsibilities allocated between the organization and its suppliers, partners, customers and other third parties |

**live es-419**  —  Los controles del Anexo A no son uniformemente aplicables. Los controles sobre el uso responsable aplican de manera distinta a una organización que solo usa IA que a una que la provee. Los controles sobre el suministro de documentación a terceros son significativos para un proveedor y pueden ser legítimamente excluidos por una organización que no suministra nada. Los controles de relación abordan las responsabilidades asignadas entre la organización y sus proveedores, socios, clientes y otros terceros, lo que requiere saber cuál de ellos se es.

**live pt-BR**  —  Os controles do Anexo A não são uniformemente aplicáveis. Os controles sobre uso responsável se aplicam de forma diferente a uma organização que apenas usa IA em comparação com uma que a fornece. Os controles sobre o fornecimento de documentação a terceiros são relevantes para um provedor e podem ser legitimamente excluídos por uma organização que não fornece nada. Os controles de relacionamento tratam das responsabilidades alocadas entre a organização e seus fornecedores, parceiros, clientes e outros terceiros — o que exige saber qual deles você é.

## 01-03-the-ai-system-life-cycle

`42001 A.4 resources, clause 8`  —  5 span(s)  —  _5 runs; one inside a ::checkpoint explanation_

### run 15w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | development, deployment, operation, change management, maintenance, transfer and decommissioning, as well as verification and integration |
| **EN after** | development, verification and validation, integration, deployment, operation, maintenance, change management, transfer and decommissioning |

**live es-419**  —  Una imagen funcional del alcance proviene del propio control de recursos de la norma, que solicita a las organizaciones documentar los recursos humanos y las competencias utilizadas para el desarrollo, la verificación y validación, la integración, el despliegue, la operación, el mantenimiento, la gestión de cambios, la transferencia y el desmantelamiento. Esa lista es una respuesta razonable a la pregunta "¿hasta dónde llega esto?" — incluidos los dos extremos que la gente suele olvidar: la transferencia y el desmantelamiento. ::

**live pt-BR**  —  Uma visão funcional da abrangência vem do próprio controle de recursos da norma, que solicita às organizações que documentem os recursos humanos e as competências utilizadas para desenvolvimento, verificação e validação, integração, implantação, operação, manutenção, gestão de mudanças, transferência e desativação. Essa lista é uma resposta razoável à pergunta "até onde isso chega?" — incluindo as duas extremidades que as pessoas costumam esquecer: transferência e desativação. ::

### run 11w, coverage 0.92

| | |
|---|---|
| **EN before** | production data and output data are used to further train the model |
| **EN after** | output and production data are fed back to train the model further |

**live es-419**  —  **[Aprendizaje continuo]{glossary="continuous-learning-behaviour"}.** Algunos sistemas desplegados siguen aprendiendo: los datos de salida y de producción se retroalimentan para seguir entrenando el modelo. El comportamiento cambia por diseño. Cuando esto está en uso, la organización tiene que monitorear el rendimiento para confirmar que el sistema sigue cumpliendo sus objetivos de diseño y que sigue operando sobre los datos de producción según lo previsto.

**live pt-BR**  —  **[Aprendizado contínuo]{glossary="continuous-learning-behaviour"}.** Alguns sistemas implantados continuam aprendendo: dados de saída e dados de produção são retroalimentados para treinar ainda mais o modelo. O comportamento muda por design. Quando esse mecanismo está em uso, a organização deve monitorar o desempenho para confirmar que o sistema ainda atende aos seus objetivos de design e ainda opera sobre os dados de produção conforme previsto.

### run 12w, coverage 1  [27001:2022, 27005:2022]

| | |
|---|---|
| **EN before** | assessments at planned intervals, or when significant changes are proposed or occur |
| **EN after** | assessments at planned intervals, and again whenever a significant change is proposed or occurs |

**live es-419**  —  **Las evaluaciones se repiten.** Los requisitos operacionales de la cláusula 8 ejecutan evaluaciones del riesgo y evaluaciones de impacto a intervalos planificados, y también cada vez que se propone o se produce un cambio significativo. Un cambio significativo es un evento del ciclo de vida, y un sistema que ha sido reentrenado con nuevos datos ha experimentado uno.

**live pt-BR**  —  **As avaliações se repetem.** Os requisitos operacionais da cláusula 8 executam avaliações de riscos e avaliações de impacto em intervalos planejados, e novamente sempre que uma mudança significativa for proposta ou ocorrer. Uma mudança significativa é um evento do ciclo de vida, e um sistema que foi retreinado com novos dados passou por uma.

### run 9w, coverage 0.82

| | |
|---|---|
| **EN before** | allocated across the organization, its partners, suppliers, customers and third parties |
| **EN after** | allocated across the organization and its suppliers, partners, customers and other third parties |

**live es-419**  —  **Las responsabilidades deben sobrevivir a la transferencia.** Cuando terceros participan en cualquier etapa, las responsabilidades se asignan entre la organización y sus proveedores, socios, clientes y otros terceros. Un sistema que cambia de manos a mitad de su vida no pierde sus obligaciones; las reubica, y alguien debe haber decidido a quién. ::

**live pt-BR**  —  **As responsabilidades precisam sobreviver à transferência.** Quando terceiros estão envolvidos em qualquer etapa, as responsabilidades são alocadas entre a organização, seus parceiros, fornecedores, clientes e terceiros. Um sistema que muda de mãos no meio de sua vida não perde suas obrigações; ele as realoca, e alguém precisa ter decidido para quem. ::

### run 12w, coverage 1  [27005:2022]

| | |
|---|---|
| **EN before** | performed at planned intervals or when significant changes are proposed or occur. |
| **EN after** | performed at planned intervals, and again whenever a significant change is proposed or occurs. |

**live es-419**  —  ::checkpoint [ { "id": "q1", "question": "Un equipo confirma que su modelo desplegado no utiliza aprendizaje continuo y concluye que su comportamiento es, por lo tanto, estable. ¿Qué se ha pasado por alto?", "type": "single_choice", "options": [ { "id": "a", "text": "Nada; sin aprendizaje continuo, el comportamiento es estable por definición" }, { "id": "b", "text": "La deriva de concepto o de datos en los datos de producción puede cambiar el rendimiento incluso sin aprendizaje" }, { "id": "c", "text": "El aprendizaje continuo es obligatorio para los sistemas dentro del alcance de un sistema de gestión de IA" }, { "id": "d", "text": "La conclusión es correcta, pero debe documentarse en la Declaración de Aplicabilidad" } ], "correct": ["b"], "explanation": "Dos mecanismos mueven el comportamiento. El aprendizaje continuo cambia el modelo; la deriva cambia el ajuste entre un modelo estático y un mundo en movimiento. El monitoreo es lo que identifica la necesidad de reentrenamiento en el segundo caso, y un equipo que ha descartado el primero a menudo deja de monitorear el segundo.", "concept_slugs": ["retraining-and-drift", "continuous-learning-behaviour"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q2", "question": "¿Cuál afirmación sobre las etapas del ciclo de vida es correcta?", "type": "single_choice", "options": [ { "id": "a", "text": "La norma prescribe un conjunto fijo de etapas que toda organización debe adoptar" }, { "id": "b", "text": "Una organización puede especificar sus propias etapas y debe definir criterios y requisitos para cada una" }, { "id": "c", "text": "Las etapas solo son relevantes para las organizaciones que desarrollan sistemas de IA" }, { "id": "d", "text": "Las etapas están definidas en el Anexo A y no pueden modificarse" } ], "correct": ["b"], "explanation": "Hay un modelo genérico disponible en ISO/IEC 22989 y procesos del ciclo de vida en ISO/IEC 5338, pero la norma permite que una organización especifique sus propias etapas. Lo que exige es que se definan criterios y requisitos para cada etapa en uso.", "concept_slugs": ["life-cycle-stages"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q3", "question": "¿Por qué aparece la frase 'a lo largo de su ciclo de vida' en tantos objetivos de control?", "type": "single_choice", "options": [ { "id": "a", "text": "Señala que las obligaciones se vinculan durante toda la existencia de un sistema, no en un momento de aprobación" }, { "id": "b", "text": "Indica qué controles son obligatorios en lugar de opcionales" }, { "id": "c", "text": "Restringe esos controles a los sistemas que aún están en desarrollo" }, { "id": "d", "text": "Es una convención de redacción heredada de ISO/IEC 27001" } ], "correct": ["a"], "explanation": "La evaluación de impacto, la documentación de recursos, el reporte de preocupaciones y la asignación de responsabilidades a terceros la incluyen. La repetición establece que el ciclo de vida, y no la fecha de lanzamiento, es el período durante el cual rigen las obligaciones. Los controles del Anexo A son todos controles de referencia; la frase no dice nada sobre el carácter obligatorio.", "concept_slugs": ["ai-system-life-cycle"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q4", "question": "Un sistema es reentrenado con doce meses de nuevos datos de producción y vuelto a desplegar. ¿Qué exige más directamente la norma?", "type": "single_choice", "options": [ { "id": "a", "text": "Nada adicional, ya que el sistema fue evaluado antes de su despliegue original" }, { "id": "b", "text": "Una nueva Declaración de Aplicabilidad" }, { "id": "c", "text": "Las evaluaciones se reactivan, porque ha ocurrido un cambio significativo" }, { "id": "d", "text": "Notificación al organismo de certificación antes del redespliegue" } ], "correct": ["c"], "explanation": "Las evaluaciones del riesgo y las evaluaciones de impacto se realizan a intervalos planificados o cuando se proponen o producen cambios significativos. El reentrenamiento con nuevos datos constituye dicho cambio. La Declaración de Aplicabilidad registra qué controles son necesarios y por qué; no cambia automáticamente porque un sistema haya sido reentrenado.", "concept_slugs": ["ai-system-life-cycle", "retraining-and-drift"], "bloom_level": "2_understand", "difficulty": 3 } ] ::

**live pt-BR**  —  ::checkpoint [ { "id": "q1", "question": "Uma equipe confirma que seu modelo implantado não utiliza aprendizado contínuo e conclui que seu comportamento é, portanto, estável. O que foi negligenciado?", "type": "single_choice", "options": [ { "id": "a", "text": "Nada; sem aprendizado contínuo, o comportamento é estável por definição" }, { "id": "b", "text": "A deriva de conceito ou de dados nos dados de produção pode alterar o desempenho mesmo sem aprendizado" }, { "id": "c", "text": "O aprendizado contínuo é obrigatório para sistemas dentro do escopo de um sistema de gestão de IA" }, { "id": "d", "text": "A conclusão está correta, mas deve ser documentada na Declaração de Aplicabilidade" } ], "correct": ["b"], "explanation": "Dois mecanismos alteram o comportamento. O aprendizado contínuo muda o modelo; a deriva muda o ajuste entre um modelo estático e um mundo em movimento. O monitoramento é o que identifica a necessidade de retreinamento no segundo caso, e uma equipe que descartou o primeiro mecanismo frequentemente para de monitorar o segundo.", "concept_slugs": ["retraining-and-drift", "continuous-learning-behaviour"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q2", "question": "Qual afirmação sobre as etapas do ciclo de vida é precisa?", "type": "single_choice", "options": [ { "id": "a", "text": "A norma prescreve um conjunto fixo de etapas que toda organização deve adotar" }, { "id": "b", "text": "Uma organização pode especificar suas próprias etapas e deve definir critérios e requisitos para cada uma delas" }, { "id": "c", "text": "As etapas são relevantes apenas para organizações que desenvolvem sistemas de IA" }, { "id": "d", "text": "As etapas são definidas no Anexo A e não podem ser alteradas" } ], "correct": ["b"], "explanation": "Um modelo genérico está disponível na ISO/IEC 22989 e os processos do ciclo de vida na ISO/IEC 5338, mas a norma permite que uma organização especifique suas próprias etapas. O que ela exige é que critérios e requisitos sejam definidos para cada etapa em uso.", "concept_slugs": ["life-cycle-stages"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q3", "question": "Por que a expressão 'ao longo de seu ciclo de vida' aparece em tantos objetivos de controle?", "type": "single_choice", "options": [ { "id": "a", "text": "Ela sinaliza que as obrigações se vinculam a toda a existência de um sistema, e não a um momento de aprovação" }, { "id": "b", "text": "Ela indica quais controles são obrigatórios em vez de opcionais" }, { "id": "c", "text": "Ela restringe esses controles a sistemas ainda em desenvolvimento" }, { "id": "d", "text": "É uma convenção de redação herdada da ISO/IEC 27001" } ], "correct": ["a"], "explanation": "A avaliação de impacto, a documentação de recursos, o reporte de preocupações e a alocação de responsabilidades a terceiros — todos carregam essa expressão. A repetição estabelece que o ciclo de vida, e não a data de lançamento, é o período durante o qual as obrigações vigoram. Os controles do Anexo A são todos controles de referência; a expressão não diz nada sobre o caráter obrigatório.", "concept_slugs": ["ai-system-life-cycle"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q4", "question": "Um sistema é retreinado com doze meses de novos dados de produção e reimplantado. O que a norma exige mais diretamente?", "type": "single_choice", "options": [ { "id": "a", "text": "Nada além do que já foi feito, pois o sistema foi avaliado antes de sua implantação original" }, { "id": "b", "text": "Uma nova Declaração de Aplicabilidade" }, { "id": "c", "text": "As avaliações são reativadas, pois ocorreu uma mudança significativa" }, { "id": "d", "text": "Notificação ao organismo de certificação antes da reimplantação" } ], "correct": ["c"], "explanation": "As avaliações de riscos e as avaliações de impacto são realizadas em intervalos planejados ou quando mudanças significativas são propostas ou ocorrem. O retreinamento com novos dados constitui tal mudança. A Declaração de Aplicabilidade registra quais controles são necessários e por quê; ela não muda automaticamente porque um sistema foi retreinado.", "concept_slugs": ["ai-system-life-cycle", "retraining-and-drift"], "bloom_level": "2_understand", "difficulty": 3 } ] ::

## 01-04-harmonised-structure

`42001 harmonised structure, Annex D.2`  —  6 span(s)  —  _6 runs; the Annex D.2 sentence carries three of them_

### run 14w, coverage 0.93

| | |
|---|---|
| **EN before** | — identical clause numbers, clause titles, text, and common terms and core definitions — developed to align |
| **EN after** | — the same clause numbering and titles, the same core text, and a shared vocabulary — built to align |

**live es-419**  —  ::concept title="Una estructura, varias disciplinas" ISO/IEC 42001 aplica la [estructura armonizada]{glossary="harmonised-structure"} — la misma numeración de cláusulas y títulos, el mismo texto base y un vocabulario compartido — desarrollada para alinear las normas de sistemas de gestión entre sí.

**live pt-BR**  —  ::concept title="Uma estrutura, várias disciplinas" A ISO/IEC 42001 aplica a [estrutura harmonizada]{glossary="harmonised-structure"} — a mesma numeração de cláusulas e títulos, o mesmo texto central e um vocabulário compartilhado — desenvolvida para alinhar as normas de sistema de gestão entre si.

### run 18w, coverage 0.95

| | |
|---|---|
| **EN before** | integration of the AI management system with generic or sector-specific management system standards for relevant topics is **essential** |
| **EN after** | bringing the AI management system together with generic or sector-specific standards on relevant topics is **essential** |

**live es-419**  —  El Anexo D.2 establece que integrar el sistema de gestión de IA con normas genéricas o específicas del sector sobre los temas pertinentes es **esencial** para desarrollar y utilizar un sistema de IA de manera responsable. Su razonamiento es que un sistema de IA no se compone únicamente de sus componentes de IA — utiliza una variedad de tecnologías, y objetivos como la seguridad, la privacidad, la protección y el impacto ambiental deberían gestionarse de manera holística en lugar de hacerlo por separado para la parte de IA y todo lo demás.

**live pt-BR**  —  O Anexo D.2 afirma que integrar o sistema de gestão de IA com normas genéricas ou específicas de setor sobre tópicos relevantes é **essencial** para desenvolver e usar um sistema de IA de forma responsável. O raciocínio é que um sistema de IA não é apenas seus componentes de IA — ele utiliza uma variedade de tecnologias, e objetivos como segurança, privacidade, proteção e impacto ambiental deveriam ser tratados como um todo único, e não separadamente para a parte de IA e todo o restante.

### run 10w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | **essential** for responsible development and use of an AI system |
| **EN after** | **essential** to developing and using an AI system responsibly |

**live es-419**  —  El Anexo D.2 establece que integrar el sistema de gestión de IA con normas genéricas o específicas del sector sobre los temas pertinentes es **esencial** para desarrollar y utilizar un sistema de IA de manera responsable. Su razonamiento es que un sistema de IA no se compone únicamente de sus componentes de IA — utiliza una variedad de tecnologías, y objetivos como la seguridad, la privacidad, la protección y el impacto ambiental deberían gestionarse de manera holística en lugar de hacerlo por separado para la parte de IA y todo lo demás.

**live pt-BR**  —  O Anexo D.2 afirma que integrar o sistema de gestão de IA com normas genéricas ou específicas de setor sobre tópicos relevantes é **essencial** para desenvolver e usar um sistema de IA de forma responsável. O raciocínio é que um sistema de IA não é apenas seus componentes de IA — ele utiliza uma variedade de tecnologias, e objetivos como segurança, privacidade, proteção e impacto ambiental deveriam ser tratados como um todo único, e não separadamente para a parte de IA e todo o restante.

### run 13w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | objectives such as safety, security, privacy and environmental impact should be managed holistically |
| **EN after** | objectives such as security, privacy, safety and environmental impact should be handled as one whole |

**live es-419**  —  El Anexo D.2 establece que integrar el sistema de gestión de IA con normas genéricas o específicas del sector sobre los temas pertinentes es **esencial** para desarrollar y utilizar un sistema de IA de manera responsable. Su razonamiento es que un sistema de IA no se compone únicamente de sus componentes de IA — utiliza una variedad de tecnologías, y objetivos como la seguridad, la privacidad, la protección y el impacto ambiental deberían gestionarse de manera holística en lugar de hacerlo por separado para la parte de IA y todo lo demás.

**live pt-BR**  —  O Anexo D.2 afirma que integrar o sistema de gestão de IA com normas genéricas ou específicas de setor sobre tópicos relevantes é **essencial** para desenvolver e usar um sistema de IA de forma responsável. O raciocínio é que um sistema de IA não é apenas seus componentes de IA — ele utiliza uma variedade de tecnologias, e objetivos como segurança, privacidade, proteção e impacto ambiental deveriam ser tratados como um todo único, e não separadamente para a parte de IA e todo o restante.

### run 14w, coverage 0.88

| | |
|---|---|
| **EN before** | because both use the high-level structure their integrated use is facilitated and of great benefit |
| **EN after** | because both share the high-level structure, using them together is easier and well worth doing |

**live es-419**  —  [ISO/IEC 27001]{glossary="iso-42001-27001-integration"} es la primera norma que menciona. El razonamiento es específico: en la mayoría de los contextos, la seguridad es clave para alcanzar los objetivos de la organización con el sistema de IA, y dado que ambas comparten la estructura de alto nivel, usarlas de forma conjunta resulta más sencillo y vale la pena hacerlo. El anexo llega a afirmar que los controles de ISO/IEC 42001 que se relacionan parcialmente con la seguridad de la información pueden implementarse a través de la implementación existente de ISO/IEC 27001 de la organización.

**live pt-BR**  —  A [ISO/IEC 27001]{glossary="iso-42001-27001-integration"} é a primeira norma citada. O raciocínio é específico: na maioria dos contextos, a segurança é fundamental para que a organização alcance seus objetivos com o sistema de IA, e como ambas compartilham a estrutura de alto nível, seu uso integrado é facilitado e de grande benefício. O anexo chega a afirmar que controles da ISO/IEC 42001 que se relacionam parcialmente com a segurança da informação podem ser implementados por meio da implementação existente da ISO/IEC 27001 da organização.

### run 10w, coverage 0.83

| | |
|---|---|
| **EN before** | "text": "As essential for responsible development and use of an AI system" |
| **EN after** | "text": "As essential to developing and using an AI system responsibly" |

**live es-419**  —  ::checkpoint [ { "id": "q1", "question": "¿Qué garantiza la estructura armonizada entre ISO/IEC 42001 e ISO/IEC 27001?", "type": "single_choice", "options": [ { "id": "a", "text": "Que los requisitos equivalentes aparecen bajo números y títulos de capítulo equivalentes" }, { "id": "b", "text": "Que una organización certificada en una se considera conforme con la otra" }, { "id": "c", "text": "Que los controles del Anexo A de cada norma se corresponden uno a uno" }, { "id": "d", "text": "Que una sola auditoría satisface ambas normas" } ], "correct": ["a"], "explanation": "La estructura armonizada implica números de capítulo, títulos, texto y definiciones básicas idénticos. No dice nada sobre la transferencia de conformidad, y las dos estructuras del Anexo A están organizadas de manera diferente. Una auditoría combinada es posible, pero es un asunto distinto de la estructura compartida.", "concept_slugs": ["harmonised-structure"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q2", "question": "¿Cómo caracteriza la norma la integración con otras normas de sistemas de gestión?", "type": "single_choice", "options": [ { "id": "a", "text": "Como opcional, y apropiada solo para organizaciones grandes" }, { "id": "b", "text": "Como esencial para el desarrollo y uso responsable de un sistema de IA" }, { "id": "c", "text": "Como un asunto que corresponde determinar al organismo de certificación" }, { "id": "d", "text": "Como aplicable solo cuando la organización ya cuenta con otra certificación" } ], "correct": ["b"], "explanation": "El Anexo D.2 establece que la integración es esencial, argumentando que un sistema de IA utiliza muchas tecnologías y que objetivos como la seguridad, la protección y la privacidad deben gestionarse de manera holística en lugar de hacerlo por separado para los componentes de IA y todo lo demás.", "concept_slugs": ["integrated-management-system"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q3", "question": "Una organización propone reutilizar sin cambios sus registros de competencia de ISO/IEC 27001 para satisfacer el apartado 7.2 de ISO/IEC 42001. ¿Cuál es el problema?", "type": "single_choice", "options": [ { "id": "a", "text": "El apartado 7.2 no existe en ISO/IEC 42001" }, { "id": "b", "text": "Los registros de competencia no pueden compartirse entre sistemas de gestión" }, { "id": "c", "text": "El capítulo se traslada, pero la competencia requerida es un cuerpo de conocimiento diferente" }, { "id": "d", "text": "La competencia debe evidenciarse mediante certificación externa en ambos casos" } ], "correct": ["c"], "explanation": "La estructura armonizada significa que el apartado 7.2 formula la misma pregunta en ambas normas. No significa que la respuesta se traslade. La competencia en IA abarca conocimientos diferentes y se evidencia de manera distinta, por lo que la maquinaria puede reutilizarse mientras que el contenido debe reexaminarse.", "concept_slugs": ["iso-42001-27001-integration"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q4", "question": "¿Cuál de estos elementos no tiene equivalente en ISO/IEC 27001?", "type": "single_choice", "options": [ { "id": "a", "text": "El requisito de que la alta dirección establezca una política" }, { "id": "b", "text": "El requisito de determinar los roles de la organización con respecto a sus sistemas" }, { "id": "c", "text": "El requisito de conservar información documentada sobre la evaluación del riesgo" }, { "id": "d", "text": "El requisito de realizar auditorías internas a intervalos planificados" } ], "correct": ["b"], "explanation": "La determinación de roles es específica de ISO/IEC 42001 — un activo de información no cambia tus obligaciones según cómo te relacionas con él. La política, la información documentada y la auditoría interna se trasladan a través de la estructura armonizada.", "concept_slugs": ["clauses-four-to-ten", "iso-42001-27001-integration"], "bloom_level": "2_understand", "difficulty": 3 } ] ::

**live pt-BR**  —  ::checkpoint [ { "id": "q1", "question": "O que a estrutura harmonizada garante entre a ISO/IEC 42001 e a ISO/IEC 27001?", "type": "single_choice", "options": [ { "id": "a", "text": "Que requisitos equivalentes aparecem sob números e títulos de seção equivalentes" }, { "id": "b", "text": "Que uma organização certificada em uma é considerada conforme à outra" }, { "id": "c", "text": "Que os controles do Anexo A de cada norma se mapeiam um a um" }, { "id": "d", "text": "Que uma única auditoria satisfaz ambas as normas" } ], "correct": ["a"], "explanation": "A estrutura harmonizada significa números de seção, títulos, texto e definições centrais idênticos. Ela não diz nada sobre transferência de conformidade, e as duas estruturas do Anexo A são organizadas de forma diferente. Uma auditoria combinada é possível, mas é uma questão separada da estrutura compartilhada.", "concept_slugs": ["harmonised-structure"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q2", "question": "Como a norma caracteriza a integração com outras normas de sistema de gestão?", "type": "single_choice", "options": [ { "id": "a", "text": "Como opcional e adequada apenas para grandes organizações" }, { "id": "b", "text": "Como essencial para o desenvolvimento e uso responsável de um sistema de IA" }, { "id": "c", "text": "Como uma questão a ser determinada pelo organismo de certificação" }, { "id": "d", "text": "Como aplicável apenas onde a organização já possui outra certificação" } ], "correct": ["b"], "explanation": "O Anexo D.2 afirma que a integração é essencial, argumentando que um sistema de IA utiliza muitas tecnologias e que objetivos como segurança, proteção e privacidade devem ser gerenciados de forma holística, e não separadamente para os componentes de IA e todo o restante.", "concept_slugs": ["integrated-management-system"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q3", "question": "Uma organização propõe reutilizar seus registros de competência existentes da ISO/IEC 27001 sem alterações para satisfazer a Seção 7.2 da ISO/IEC 42001. Qual é o problema?", "type": "single_choice", "options": [ { "id": "a", "text": "A Seção 7.2 não existe na ISO/IEC 42001" }, { "id": "b", "text": "Registros de competência não podem ser compartilhados entre sistemas de gestão" }, { "id": "c", "text": "A seção se repete, mas a competência exigida é um corpo de conhecimento diferente" }, { "id": "d", "text": "A competência deve ser evidenciada por certificação externa em ambos os casos" } ], "correct": ["c"], "explanation": "A estrutura harmonizada significa que a Seção 7.2 faz a mesma pergunta em ambas as normas. Isso não significa que a resposta se transfere. A competência em IA abrange conhecimentos diferentes e é evidenciada de forma distinta, portanto a estrutura pode ser reutilizada enquanto o conteúdo deve ser reexaminado.", "concept_slugs": ["iso-42001-27001-integration"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q4", "question": "Qual destes não tem equivalente na ISO/IEC 27001?", "type": "single_choice", "options": [ { "id": "a", "text": "O requisito de que a alta direção estabeleça uma política" }, { "id": "b", "text": "O requisito de determinar os papéis da organização em relação aos seus sistemas" }, { "id": "c", "text": "O requisito de reter informação documentada sobre o processo de avaliação de riscos" }, { "id": "d", "text": "O requisito de conduzir auditorias internas em intervalos planejados" } ], "correct": ["b"], "explanation": "A determinação de papéis é específica da ISO/IEC 42001 — um ativo de informação não altera suas obrigações dependendo de como você se relaciona com ele. Política, informação documentada e auditoria interna se transferem pela estrutura harmonizada.", "concept_slugs": ["clauses-four-to-ten", "iso-42001-27001-integration"], "bloom_level": "2_understand", "difficulty": 3 } ] ::

## 01-05-drivers-and-what-certification-means

`42001 clause 1, scope`  —  2 span(s)  —  _TWO instances. The second is inside a ::checkpoint JSON block -- not a bank item, and not served over MCP, since courseware-read replaces content_md with PUBLISHED_BLOCKS only. Repaired anyway: a learner reads it in the app, and leaving the two copies saying different things is its own defect._

### run 16w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | **can generate evidence of its responsibility and accountability regarding its role with respect to AI systems.** |
| **EN after** | **can produce evidence that it is responsible and accountable for whatever role it holds around AI systems.** |

**live es-419**  —  ::concept title="La afirmación que un certificado realmente respalda" Esta es la frase que hay que retener con precisión. Una organización que cumple con los requisitos de esta norma **puede generar evidencia de que es responsable y rinde cuentas por cualquier rol que desempeñe en relación con los sistemas de IA.**

**live pt-BR**  —  ::concept title="A afirmação que um certificado realmente sustenta" Eis a frase a ser compreendida com precisão. Uma organização em conformidade com os requisitos desta norma **pode produzir evidências de que é responsável e presta contas por qualquer papel que desempenhe em relação aos sistemas de IA.**

### run 16w, coverage 0.8

| | |
|---|---|
| **EN before** | "text": "That the organization can generate evidence of its responsibility and accountability regarding its role with respect to AI systems" |
| **EN after** | "text": "That the organization can produce evidence that it is responsible and accountable for whatever role it holds around AI systems" |

**live es-419**  —  ::checkpoint [ { "id": "q1", "question": "¿Cuál afirmación describe con mayor precisión lo que respalda la conformidad con ISO/IEC 42001?", "type": "single_choice", "options": [ { "id": "a", "text": "Que la organización cumple con la regulación de IA aplicable" }, { "id": "b", "text": "Que la organización puede generar evidencia de su responsabilidad y rendición de cuentas respecto a su rol en relación con los sistemas de IA" }, { "id": "c", "text": "Que los sistemas de IA de la organización han sido probados de forma independiente" }, { "id": "d", "text": "Que los sistemas de IA de la organización presentan un riesgo bajo para las personas" } ], "correct": ["b"], "explanation": "La afirmación es sobre evidencia y está delimitada al rol de la organización. No dice nada sobre el cumplimiento legal, no implica ninguna prueba de los sistemas por parte del organismo de certificación y no hace ninguna afirmación sobre el nivel de riesgo que presenta cualquier sistema.", "concept_slugs": ["certification-is-not-compliance"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q2", "question": "Una organización fuera de la UE vende un producto habilitado con IA en el mercado de la UE. ¿Qué se desprende de ello respecto al Reglamento de IA de la UE?", "type": "single_choice", "options": [ { "id": "a", "text": "Queda fuera del Reglamento, que se aplica por lugar de establecimiento" }, { "id": "b", "text": "Puede quedar dentro del Reglamento, que se aplica por colocación en el mercado" }, { "id": "c", "text": "Queda dentro del Reglamento solo si posee certificación ISO/IEC 42001" }, { "id": "d", "text": "Queda dentro del Reglamento solo para los sistemas clasificados como prohibidos" } ], "correct": ["b"], "explanation": "El Reglamento alcanza a las organizaciones cuyos sistemas se colocan en el mercado de la UE independientemente de dónde esté establecida la organización. El estado de certificación es irrelevante para determinar si una regulación aplica, y el alcance no se limita a ningún nivel de riesgo en particular.", "concept_slugs": ["eu-ai-act-overview", "regulatory-driver"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q3", "question": "¿Por qué un curso debería tratar las fechas de aplicación del Reglamento de IA de la UE como contenido perecedero?", "type": "single_choice", "options": [ { "id": "a", "text": "Porque el Reglamento se aplica de manera diferente en cada Estado miembro" }, { "id": "b", "text": "Porque su calendario escalonado ya ha sido modificado, aplazando partes en más de un año" }, { "id": "c", "text": "Porque ISO/IEC 42001 lo reemplaza para las organizaciones certificadas" }, { "id": "d", "text": "Porque las fechas dependen de la clasificación de riesgo de cada organización" } ], "correct": ["b"], "explanation": "Una modificación de 2026 aplazó sustancialmente las obligaciones de alto riesgo mientras dejaba las obligaciones de transparencia en su fecha original. El contenido duradero es la forma — escalonada, extraterritorial, implementada en fases, susceptible de modificación — más que cualquier calendario específico.", "concept_slugs": ["eu-ai-act-overview"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q4", "question": "¿Cuál es la justificación interna más defendible para adoptar un sistema de gestión de IA?", "type": "single_choice", "options": [ { "id": "a", "text": "Elimina la responsabilidad por fallos de los sistemas de IA" }, { "id": "b", "text": "Garantiza la aprobación regulatoria en las jurisdicciones donde opera la organización" }, { "id": "c", "text": "Produce, en el curso ordinario de la operación, los registros que un regulador o cliente solicitaría" }, { "id": "d", "text": "Certifica que los modelos de la organización cumplen con umbrales de rendimiento publicados" } ], "correct": ["c"], "explanation": "El valor radica en que las evaluaciones de impacto, los planes de tratamiento, las aprobaciones, los mecanismos de seguimiento y la información proporcionada a las partes interesadas existen como registros antes de que alguien los solicite. No elimina ninguna responsabilidad, no garantiza ninguna aprobación y la norma no publica umbrales de rendimiento.", "concept_slugs": ["regulatory-driver", "certification-is-not-compliance"], "bloom_level": "2_understand", "difficulty": 3 } ] ::

**live pt-BR**  —  ::checkpoint [ { "id": "q1", "question": "Qual afirmação descreve com mais precisão o que a conformidade com a ISO/IEC 42001 sustenta?", "type": "single_choice", "options": [ { "id": "a", "text": "Que a organização está em conformidade legal com a regulação de IA aplicável" }, { "id": "b", "text": "Que a organização pode gerar evidências de sua responsabilidade e prestação de contas em relação ao seu papel com respeito aos sistemas de IA" }, { "id": "c", "text": "Que os sistemas de IA da organização foram testados de forma independente" }, { "id": "d", "text": "Que os sistemas de IA da organização apresentam baixo risco para os indivíduos" } ], "correct": ["b"], "explanation": "A afirmação é sobre evidência e está delimitada ao papel da organização. Não diz nada sobre conformidade legal, não envolve nenhum teste de sistemas pelo organismo de certificação e não faz nenhuma afirmação sobre o nível de risco que qualquer sistema apresenta.", "concept_slugs": ["certification-is-not-compliance"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q2", "question": "Uma organização fora da UE vende um produto habilitado por IA no mercado da UE. O que isso implica em relação ao EU AI Act?", "type": "single_choice", "options": [ { "id": "a", "text": "Está fora do escopo do EU AI Act, que se aplica pelo local de estabelecimento" }, { "id": "b", "text": "Pode estar sujeita ao EU AI Act, que se aplica pela colocação no mercado" }, { "id": "c", "text": "Está sujeita ao EU AI Act somente se possuir certificação ISO/IEC 42001" }, { "id": "d", "text": "Está sujeita ao EU AI Act somente para sistemas classificados como proibidos" } ], "correct": ["b"], "explanation": "O EU AI Act alcança organizações cujos sistemas são colocados no mercado da UE, independentemente de onde a organização está estabelecida. O status de certificação é irrelevante para determinar se uma regulação se aplica, e o alcance não se limita a nenhum nível de risco específico.", "concept_slugs": ["eu-ai-act-overview", "regulatory-driver"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q3", "question": "Por que um curso deve tratar as datas de aplicação do EU AI Act como conteúdo perecível?", "type": "single_choice", "options": [ { "id": "a", "text": "Porque o EU AI Act se aplica de forma diferente em cada Estado-membro" }, { "id": "b", "text": "Porque seu cronograma faseado já foi alterado, adiando partes em mais de um ano" }, { "id": "c", "text": "Porque a ISO/IEC 42001 o substitui para organizações certificadas" }, { "id": "d", "text": "Porque as datas dependem da classificação de risco de cada organização" } ], "correct": ["b"], "explanation": "Uma alteração de 2026 adiou substancialmente as obrigações de alto risco, mantendo as obrigações de transparência na data original. O conteúdo duradouro é a estrutura — escalonada, extraterritorial, faseada, passível de alteração — e não qualquer calendário específico.", "concept_slugs": ["eu-ai-act-overview"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q4", "question": "Qual é a justificativa interna mais defensável para adotar um sistema de gestão de IA?", "type": "single_choice", "options": [ { "id": "a", "text": "Ele elimina a responsabilidade por falhas em sistemas de IA" }, { "id": "b", "text": "Ele garante aprovação regulatória nas jurisdições em que a organização opera" }, { "id": "c", "text": "Ele produz, no curso normal da operação, os registros que um regulador ou cliente solicitaria" }, { "id": "d", "text": "Ele certifica que os modelos da organização atendem a limites de desempenho publicados" } ], "correct": ["c"], "explanation": "O valor está em que avaliações de impacto, planos de tratamento, aprovações, arranjos de monitoramento e informações fornecidas às partes interessadas existem como registros antes de qualquer pessoa solicitá-los. Não elimina nenhuma responsabilidade, não garante nenhuma aprovação e a norma não publica limites de desempenho.", "concept_slugs": ["regulatory-driver", "certification-is-not-compliance"], "bloom_level": "2_understand", "difficulty": 3 } ] ::

## 01-06-what-an-aims-is-not

`42001 A.6 design, clause 1 scope`  —  3 span(s)  —  _3 runs, two of them lists_

### run 11w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | requirements specification, data acquisition, data conditioning, model training, verification and validation |
| **EN after** | requirements specification, data acquisition and conditioning, model training, then verification and validation |

**live es-419**  —  Lo que hace en cambio es requerir que la organización nombre los objetivos que inciden en el diseño y el desarrollo, y que integre su consecución en el trabajo en lugar de dejarlos como una declaración de intenciones. Su orientación ofrece la equidad como ejemplo: si una organización define la equidad como un objetivo, esta debe trasladarse a la especificación de requisitos, la adquisición y el acondicionamiento de datos, el entrenamiento del modelo, y luego la verificación y la validación. Incluso contempla la posibilidad de exigir una herramienta o método de prueba específico — como algo que determina la **organización**, no algo que suministra la norma.

**live pt-BR**  —  O que ela faz, em vez disso, é exigir que a organização nomeie os objetivos que influenciam o design e o desenvolvimento, e que incorpore a busca por eles ao trabalho, em vez de deixá-los como uma declaração de intenção. Sua orientação apresenta a equidade como exemplo: se uma organização define a equidade como um objetivo, isso deve ser levado para a especificação de requisitos, aquisição e condicionamento de dados, treinamento de modelos, e então verificação e validação. A norma chega a contemplar a exigência de uma ferramenta ou método de teste específico — como algo que a **organização** determina, não algo que a norma fornece.

### run 10w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | provides requirements and guidance from an **AI technology specific** view |
| **EN after** | sets out requirements and guidance from an **AI-technology-specific** angle |

**live es-419**  —  Su posición es que establece requisitos y orientación desde un ángulo **específico de la tecnología de IA**, mientras que las normas sectoriales y disciplinarias abordan su objetivo desde uno tecnológicamente neutral. Ninguna sustituye a la otra.

**live pt-BR**  —  Sua posição é que ela estabelece requisitos e orientações a partir de uma perspectiva **específica da tecnologia de IA**, enquanto as normas setoriais e disciplinares abordam seu objetivo a partir de uma perspectiva tecnologicamente neutra. Nenhuma substitui a outra.

### run 13w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | fairness, accountability, transparency, explainability, reliability, safety, robustness and redundancy, privacy and security, accessibility |
| **EN after** | fairness, accountability, transparency and explainability, reliability, safety, robustness, redundancy, privacy, security and accessibility |

**live es-419**  —  La respuesta honesta es que la norma guarda en gran medida silencio sobre ello como categoría, y ese silencio es informativo. No respalda ningún conjunto de principios, no define la IA ética ni exige una función de ética. Lo que sí hace es requerir que la organización identifique sus propios objetivos para el desarrollo y uso responsable, y su orientación ofrece una lista de aspecto familiar — equidad, responsabilidad, transparencia y explicabilidad, fiabilidad, seguridad, robustez, redundancia, privacidad, seguridad y accesibilidad — como **ejemplos** que una organización podría identificar. Cabe destacar que los introduce con una redacción que los hace ilustrativos en lugar de obligatorios, y señala que las organizaciones en diferentes contextos tendrán distintas expectativas sobre lo que significa el desarrollo responsable.

**live pt-BR**  —  A resposta honesta é que a norma é em grande parte silenciosa sobre isso como categoria, e esse silêncio é informativo. Ela não endossa nenhum conjunto de princípios, não define IA ética nem exige uma função de ética. O que ela faz é exigir que a organização identifique seus próprios objetivos para o desenvolvimento e uso responsável, e sua orientação oferece uma lista de aparência familiar — equidade, responsabilização, transparência e explicabilidade, confiabilidade, segurança, robustez, redundância, privacidade, proteção e acessibilidade — como **exemplos** que uma organização pode identificar. Notavelmente, ela os introduz com uma redação que os torna ilustrativos em vez de obrigatórios, e afirma que organizações em contextos diferentes terão expectativas diferentes sobre o que o desenvolvimento responsável significa.

## 02-01-context-and-interested-parties

`42001 clauses 4.1, 4.2 and 3.x`  —  6 span(s)  —  _6 runs; the interested-party definition three times over_

### run 18w, coverage 1  [27001:2022, 42001:2023]

| | |
|---|---|
| **EN before** | determine external and internal issues that are relevant to its purpose and that affect its ability to achieve |
| **EN after** | work out which external and internal issues bear on its purpose and on its ability to achieve |

**live es-419**  —  ::concept title="Qué cuenta como un problema" La cláusula 4.1 pide a la organización que determine qué problemas externos e internos inciden en su propósito y en su capacidad de lograr lo que espera de su sistema de gestión de IA. El [contexto]{glossary="organizational-context"} va antes que el alcance, antes que la política, antes que el riesgo, porque todo lo que viene después se calibra en función de él.

**live pt-BR**  —  ::concept title="O que conta como um problema" A Cláusula 4.1 solicita que a organização determine quais questões externas e internas influenciam seu propósito e sua capacidade de alcançar o que deseja com o sistema de gestão de IA. O [contexto]{glossary="organizational-context"} vem antes do escopo, antes da política, antes do risco, porque tudo o que vem depois é calibrado a partir dele.

### run 17w, coverage 1  [22989:2022, 27000:2018, 27002:2022, 42001:2023]

| | |
|---|---|
| **EN before** | that can affect, be affected by, **or perceive itself to be affected by** a decision or activity |
| **EN after** | who can affect a decision or activity, be affected by one, **or believe themselves to be affected** |

**live es-419**  —  La definición de [parte interesada]{glossary="interested-parties-ai"} con la que trabaja la norma es inusualmente amplia: una persona u organización que puede afectar a una decisión o actividad, verse afectada por ella, **o creer que se ve afectada**.

**live pt-BR**  —  A definição de [parte interessada]{glossary="interested-parties-ai"} da qual a norma parte é excepcionalmente ampla: uma pessoa ou organização que pode afetar uma decisão ou atividade, ser afetada por ela, **ou acreditar que é afetada por ela**.

### run 11w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | are expected to change and be reviewed from time to time |
| **EN after** | will shift over time and are meant to be revisited |

**live es-419**  —  ::deep-dive title="Por qué el contexto es un documento vivo" La norma indica que los factores de influencia en este ámbito cambiarán con el tiempo y está previsto que se revisen. Esa frase aparece en la introducción y es fácil tratarla como texto de relleno. En un programa de IA, no lo es.

**live pt-BR**  —  ::deep-dive title="Por que o contexto é um documento vivo" A norma afirma que os fatores de influência aqui tratados irão mudar ao longo do tempo e estao previstos para serem revisitados. Essa frase está na introdução e é fácil de tratar como texto padrão. Em um programa de IA, não é.

### run 20w, coverage 0.95

| | |
|---|---|
| **EN before** | a person or organization that can affect, be affected by, or perceive itself to be affected by a decision or activity |
| **EN after** | a person or organization who can affect a decision or activity, be affected by one, or believe themselves to be affected |

**live es-419**  —  ::checkpoint [ { "id": "q1", "question": "Una organización determina que el cambio climático no es un problema relevante para su sistema de gestión de IA y no registra nada más. ¿Cuál es el problema?", "type": "single_choice", "options": [ { "id": "a", "text": "El cambio climático siempre es un problema relevante para un sistema de gestión de IA" }, { "id": "b", "text": "La determinación es obligatoria y debe poder demostrarse que se realizó" }, { "id": "c", "text": "La relevancia solo puede ser determinada por el organismo de certificación" }, { "id": "d", "text": "No hay ningún problema; el apartado aplica únicamente a los sistemas de gestión ambiental" } ], "correct": ["b"], "explanation": "El requisito es determinar si el cambio climático es relevante. Concluir que no lo es, es un resultado legítimo; no poder demostrar que la determinación se realizó, no lo es. El apartado 4.2 añade que las partes interesadas pueden tener requisitos relacionados con el clima.", "concept_slugs": ["climate-change-relevance"], "bloom_level": "3_apply", "difficulty": 2 }, { "id": "q2", "question": "Una persona que cree que un sistema de recomendación la perjudica, pero está equivocada sobre cómo funciona, contacta a la organización. ¿Es una parte interesada?", "type": "single_choice", "options": [ { "id": "a", "text": "No, porque la creencia es factualmente incorrecta" }, { "id": "b", "text": "No, a menos que sea cliente de la organización" }, { "id": "c", "text": "Sí, porque una parte que se percibe a sí misma como afectada está dentro de la definición" }, { "id": "d", "text": "Solo si un regulador toma la queja" } ], "correct": ["c"], "explanation": "La definición abarca a una persona u organización que puede afectar, verse afectada o percibirse a sí misma como afectada por una decisión o actividad. La percepción es suficiente, y lo es porque una parte que cree que está afectada actuará en consecuencia independientemente de si eso es correcto.", "concept_slugs": ["interested-parties-ai"], "bloom_level": "3_apply", "difficulty": 3 }, { "id": "q3", "question": "¿Cuál de estos nombra la norma como un problema externo que la organización debe considerar?", "type": "single_choice", "options": [ { "id": "a", "text": "La competencia del equipo de ciencia de datos propio de la organización" }, { "id": "b", "text": "El panorama competitivo y las tendencias en nuevos productos y servicios que utilizan IA" }, { "id": "c", "text": "El calendario de retención de información documentada de la organización" }, { "id": "d", "text": "El presupuesto asignado al sistema de gestión de IA" } ], "correct": ["b"], "explanation": "El panorama competitivo y las tendencias aparecen entre las consideraciones externas, junto con los requisitos legales, la orientación de los reguladores, los incentivos y consecuencias, y la cultura y la ética. La competencia del equipo, los calendarios de retención y el presupuesto son asuntos internos abordados por otros apartados.", "concept_slugs": ["internal-external-issues"], "bloom_level": "3_apply", "difficulty": 2 }, { "id": "q4", "question": "¿Por qué un análisis incompleto del apartado 4.2 genera un defecto que los apartados posteriores no detectarán?", "type": "single_choice", "options": [ { "id": "a", "text": "Porque la Declaración de Aplicabilidad se deriva del registro de partes interesadas" }, { "id": "b", "text": "Porque la evaluación de impacto solo puede evaluar las consecuencias para las partes que alguien identificó" }, { "id": "c", "text": "Porque la auditoría interna muestrea únicamente las partes listadas en el apartado 4.2" }, { "id": "d", "text": "Porque los organismos de certificación auditan el capítulo 4 antes que cualquier otro capítulo" } ], "correct": ["b"], "explanation": "El apartado 6.1.4 pregunta sobre las consecuencias para individuos, grupos y sociedades. Una parte ausente del análisis del apartado 4.2 también estará ausente de la evaluación de impacto, y ninguno de los dos pasos reportará un error: la evaluación es completa respecto a lo que se le proporcionó.", "concept_slugs": ["affected-individuals", "interested-parties-ai"], "bloom_level": "3_apply", "difficulty": 3 } ] ::

**live pt-BR**  —  ::checkpoint [ { "id": "q1", "question": "Uma organização determina que as mudanças climáticas não são um problema relevante para o seu sistema de gestão de IA e não registra mais nada. Qual é o problema?", "type": "single_choice", "options": [ { "id": "a", "text": "As mudanças climáticas são sempre um problema relevante para um sistema de gestão de IA" }, { "id": "b", "text": "A determinação é obrigatória e deve ser demonstrada que foi realizada" }, { "id": "c", "text": "A relevância só pode ser determinada pelo organismo de certificação" }, { "id": "d", "text": "Não há problema; a seção se aplica apenas a sistemas de gestão ambiental" } ], "correct": ["b"], "explanation": "O requisito é determinar se as mudanças climáticas são relevantes. Concluir que não são é um resultado legítimo; não demonstrar que a determinação ocorreu não é. A Seção 4.2 acrescenta que as partes interessadas podem ter requisitos relacionados ao clima.", "concept_slugs": ["climate-change-relevance"], "bloom_level": "3_apply", "difficulty": 2 }, { "id": "q2", "question": "Uma pessoa que acredita que um sistema de recomendação a prejudica, mas está equivocada sobre como ele funciona, entra em contato com a organização. Ela é uma parte interessada?", "type": "single_choice", "options": [ { "id": "a", "text": "Não, porque a crença é factualmente incorreta" }, { "id": "b", "text": "Não, a menos que seja cliente da organização" }, { "id": "c", "text": "Sim, porque uma parte que se percebe afetada se enquadra na definição" }, { "id": "d", "text": "Somente se um regulador assumir a reclamação" } ], "correct": ["c"], "explanation": "A definição abrange uma pessoa ou organização que pode afetar, ser afetada por, ou perceber-se afetada por uma decisão ou atividade. A percepção é suficiente, e é suficiente porque uma parte que acredita ser afetada agirá com base nessa crença, independentemente de ela ser correta.", "concept_slugs": ["interested-parties-ai"], "bloom_level": "3_apply", "difficulty": 3 }, { "id": "q3", "question": "Qual destes a norma menciona como um problema externo que uma organização deve considerar?", "type": "single_choice", "options": [ { "id": "a", "text": "A competência da própria equipe de ciência de dados da organização" }, { "id": "b", "text": "O cenário competitivo e as tendências para novos produtos e serviços que utilizam IA" }, { "id": "c", "text": "O cronograma de retenção de informação documentada da organização" }, { "id": "d", "text": "O orçamento alocado para o sistema de gestão de IA" } ], "correct": ["b"], "explanation": "O cenário competitivo e as tendências aparecem entre as considerações externas, ao lado dos requisitos legais, orientações dos reguladores, incentivos e consequências, e cultura e ética. Competência da equipe, cronogramas de retenção e orçamento são assuntos internos abordados por outras seções.", "concept_slugs": ["internal-external-issues"], "bloom_level": "3_apply", "difficulty": 2 }, { "id": "q4", "question": "Por que uma análise incompleta da Seção 4.2 cria uma falha que as seções posteriores não detectarão?", "type": "single_choice", "options": [ { "id": "a", "text": "Porque a Declaração de Aplicabilidade é derivada do registro de partes interessadas" }, { "id": "b", "text": "Porque a avaliação de impacto só pode avaliar consequências para as partes que alguém identificou" }, { "id": "c", "text": "Porque a auditoria interna amostra apenas as partes listadas na Seção 4.2" }, { "id": "d", "text": "Porque os organismos de certificação auditam a Seção 4 antes de qualquer outra seção" } ], "correct": ["b"], "explanation": "A Seção 6.1.4 questiona as consequências para indivíduos, grupos e sociedades. Uma parte ausente da análise da Seção 4.2 também está ausente da avaliação de impacto, e nenhuma das etapas reporta um erro — a avaliação está completa em relação ao que lhe foi fornecido.", "concept_slugs": ["affected-individuals", "interested-parties-ai"], "bloom_level": "3_apply", "difficulty": 3 } ] ::

### run 11w, coverage 0.85

| | |
|---|---|
| **EN before** | "text": "The competitive landscape and trends for new products and services using AI" |
| **EN after** | "text": "The competitive picture, and where AI-based products and services are heading" |

**live es-419**  —  ::checkpoint [ { "id": "q1", "question": "Una organización determina que el cambio climático no es un problema relevante para su sistema de gestión de IA y no registra nada más. ¿Cuál es el problema?", "type": "single_choice", "options": [ { "id": "a", "text": "El cambio climático siempre es un problema relevante para un sistema de gestión de IA" }, { "id": "b", "text": "La determinación es obligatoria y debe poder demostrarse que se realizó" }, { "id": "c", "text": "La relevancia solo puede ser determinada por el organismo de certificación" }, { "id": "d", "text": "No hay ningún problema; el apartado aplica únicamente a los sistemas de gestión ambiental" } ], "correct": ["b"], "explanation": "El requisito es determinar si el cambio climático es relevante. Concluir que no lo es, es un resultado legítimo; no poder demostrar que la determinación se realizó, no lo es. El apartado 4.2 añade que las partes interesadas pueden tener requisitos relacionados con el clima.", "concept_slugs": ["climate-change-relevance"], "bloom_level": "3_apply", "difficulty": 2 }, { "id": "q2", "question": "Una persona que cree que un sistema de recomendación la perjudica, pero está equivocada sobre cómo funciona, contacta a la organización. ¿Es una parte interesada?", "type": "single_choice", "options": [ { "id": "a", "text": "No, porque la creencia es factualmente incorrecta" }, { "id": "b", "text": "No, a menos que sea cliente de la organización" }, { "id": "c", "text": "Sí, porque una parte que se percibe a sí misma como afectada está dentro de la definición" }, { "id": "d", "text": "Solo si un regulador toma la queja" } ], "correct": ["c"], "explanation": "La definición abarca a una persona u organización que puede afectar, verse afectada o percibirse a sí misma como afectada por una decisión o actividad. La percepción es suficiente, y lo es porque una parte que cree que está afectada actuará en consecuencia independientemente de si eso es correcto.", "concept_slugs": ["interested-parties-ai"], "bloom_level": "3_apply", "difficulty": 3 }, { "id": "q3", "question": "¿Cuál de estos nombra la norma como un problema externo que la organización debe considerar?", "type": "single_choice", "options": [ { "id": "a", "text": "La competencia del equipo de ciencia de datos propio de la organización" }, { "id": "b", "text": "El panorama competitivo y las tendencias en nuevos productos y servicios que utilizan IA" }, { "id": "c", "text": "El calendario de retención de información documentada de la organización" }, { "id": "d", "text": "El presupuesto asignado al sistema de gestión de IA" } ], "correct": ["b"], "explanation": "El panorama competitivo y las tendencias aparecen entre las consideraciones externas, junto con los requisitos legales, la orientación de los reguladores, los incentivos y consecuencias, y la cultura y la ética. La competencia del equipo, los calendarios de retención y el presupuesto son asuntos internos abordados por otros apartados.", "concept_slugs": ["internal-external-issues"], "bloom_level": "3_apply", "difficulty": 2 }, { "id": "q4", "question": "¿Por qué un análisis incompleto del apartado 4.2 genera un defecto que los apartados posteriores no detectarán?", "type": "single_choice", "options": [ { "id": "a", "text": "Porque la Declaración de Aplicabilidad se deriva del registro de partes interesadas" }, { "id": "b", "text": "Porque la evaluación de impacto solo puede evaluar las consecuencias para las partes que alguien identificó" }, { "id": "c", "text": "Porque la auditoría interna muestrea únicamente las partes listadas en el apartado 4.2" }, { "id": "d", "text": "Porque los organismos de certificación auditan el capítulo 4 antes que cualquier otro capítulo" } ], "correct": ["b"], "explanation": "El apartado 6.1.4 pregunta sobre las consecuencias para individuos, grupos y sociedades. Una parte ausente del análisis del apartado 4.2 también estará ausente de la evaluación de impacto, y ninguno de los dos pasos reportará un error: la evaluación es completa respecto a lo que se le proporcionó.", "concept_slugs": ["affected-individuals", "interested-parties-ai"], "bloom_level": "3_apply", "difficulty": 3 } ] ::

**live pt-BR**  —  ::checkpoint [ { "id": "q1", "question": "Uma organização determina que as mudanças climáticas não são um problema relevante para o seu sistema de gestão de IA e não registra mais nada. Qual é o problema?", "type": "single_choice", "options": [ { "id": "a", "text": "As mudanças climáticas são sempre um problema relevante para um sistema de gestão de IA" }, { "id": "b", "text": "A determinação é obrigatória e deve ser demonstrada que foi realizada" }, { "id": "c", "text": "A relevância só pode ser determinada pelo organismo de certificação" }, { "id": "d", "text": "Não há problema; a seção se aplica apenas a sistemas de gestão ambiental" } ], "correct": ["b"], "explanation": "O requisito é determinar se as mudanças climáticas são relevantes. Concluir que não são é um resultado legítimo; não demonstrar que a determinação ocorreu não é. A Seção 4.2 acrescenta que as partes interessadas podem ter requisitos relacionados ao clima.", "concept_slugs": ["climate-change-relevance"], "bloom_level": "3_apply", "difficulty": 2 }, { "id": "q2", "question": "Uma pessoa que acredita que um sistema de recomendação a prejudica, mas está equivocada sobre como ele funciona, entra em contato com a organização. Ela é uma parte interessada?", "type": "single_choice", "options": [ { "id": "a", "text": "Não, porque a crença é factualmente incorreta" }, { "id": "b", "text": "Não, a menos que seja cliente da organização" }, { "id": "c", "text": "Sim, porque uma parte que se percebe afetada se enquadra na definição" }, { "id": "d", "text": "Somente se um regulador assumir a reclamação" } ], "correct": ["c"], "explanation": "A definição abrange uma pessoa ou organização que pode afetar, ser afetada por, ou perceber-se afetada por uma decisão ou atividade. A percepção é suficiente, e é suficiente porque uma parte que acredita ser afetada agirá com base nessa crença, independentemente de ela ser correta.", "concept_slugs": ["interested-parties-ai"], "bloom_level": "3_apply", "difficulty": 3 }, { "id": "q3", "question": "Qual destes a norma menciona como um problema externo que uma organização deve considerar?", "type": "single_choice", "options": [ { "id": "a", "text": "A competência da própria equipe de ciência de dados da organização" }, { "id": "b", "text": "O cenário competitivo e as tendências para novos produtos e serviços que utilizam IA" }, { "id": "c", "text": "O cronograma de retenção de informação documentada da organização" }, { "id": "d", "text": "O orçamento alocado para o sistema de gestão de IA" } ], "correct": ["b"], "explanation": "O cenário competitivo e as tendências aparecem entre as considerações externas, ao lado dos requisitos legais, orientações dos reguladores, incentivos e consequências, e cultura e ética. Competência da equipe, cronogramas de retenção e orçamento são assuntos internos abordados por outras seções.", "concept_slugs": ["internal-external-issues"], "bloom_level": "3_apply", "difficulty": 2 }, { "id": "q4", "question": "Por que uma análise incompleta da Seção 4.2 cria uma falha que as seções posteriores não detectarão?", "type": "single_choice", "options": [ { "id": "a", "text": "Porque a Declaração de Aplicabilidade é derivada do registro de partes interessadas" }, { "id": "b", "text": "Porque a avaliação de impacto só pode avaliar consequências para as partes que alguém identificou" }, { "id": "c", "text": "Porque a auditoria interna amostra apenas as partes listadas na Seção 4.2" }, { "id": "d", "text": "Porque os organismos de certificação auditam a Seção 4 antes de qualquer outra seção" } ], "correct": ["b"], "explanation": "A Seção 6.1.4 questiona as consequências para indivíduos, grupos e sociedades. Uma parte ausente da análise da Seção 4.2 também está ausente da avaliação de impacto, e nenhuma das etapas reporta um erro — a avaliação está completa em relação ao que lhe foi fornecido.", "concept_slugs": ["affected-individuals", "interested-parties-ai"], "bloom_level": "3_apply", "difficulty": 3 } ] ::

### run 11w, coverage 0.79

| | |
|---|---|
| **EN before** | An interested party can affect, be affected by, or perceive itself to be affected. |
| **EN after** | An interested party can affect something, be affected by it, or believe themselves affected. |

**live es-419**  —  ::summary - El apartado 4.1 exige determinar los problemas externos e internos relevantes para el sistema de gestión de IA. - Nombrados externamente: requisitos legales y usos prohibidos, orientación de reguladores, incentivos, cultura y ética, panorama competitivo. - Determinar si el cambio climático es un problema relevante es un requisito, independientemente de la respuesta. - Una parte interesada puede afectar algo, verse afectada por ello, o percibirse a sí misma como afectada. - Los sujetos de IA —personas sobre las que actúa el sistema sin tener ninguna relación con la organización— son la categoría que los registros convencionales omiten. - Una brecha aquí se convierte en una brecha en la evaluación de impacto, y ninguno de los dos pasos la reporta. ::

**live pt-BR**  —  ::summary - A Seção 4.1 exige a determinação dos problemas externos e internos relevantes para o sistema de gestão de IA. - Mencionados externamente: requisitos legais e usos proibidos, orientações dos reguladores, incentivos, cultura e ética, cenário competitivo. - Determinar se as mudanças climáticas são um problema relevante é um requisito, independentemente da resposta. - Uma parte interessada pode afetar algo, ser afetada por ele, ou acreditar que é afetada. - Os sujeitos de IA — pessoas sobre as quais o sistema atua sem qualquer relação com a organização — são a categoria que os registros convencionais ignoram. - Uma lacuna aqui se torna uma lacuna na avaliação de impacto, e nenhuma das etapas a reporta. ::

## 02-02-determining-the-scope

`42001 A.10 relationship controls`  —  2 span(s)  —  _TWO runs. The second is the harmonised-structure clause list, which the first dump missed because its output was tail-truncated -- a reminder that a scan read through `tail` is a scan read in part._

### run 11w, coverage 0.79

| | |
|---|---|
| **EN before** | responsibilities to be allocated between the organization, its partners, suppliers, customers and third parties |
| **EN after** | responsibilities to be allocated between the organization and its suppliers, partners, customers and other third parties |

**live es-419**  —  **Sistemas suministrados por socios.** Cuando hay [terceros]{glossary="third-party-ai-in-scope"} involucrados en cualquier etapa del ciclo de vida de un sistema, la norma espera que las responsabilidades se asignen entre la organización y sus proveedores, socios, clientes y otros terceros. La asignación presupone que el sistema fue identificado en primer lugar.

**live pt-BR**  —  **Sistemas fornecidos por parceiros.** Quando [terceiros]{glossary="third-party-ai-in-scope"} estão envolvidos em qualquer etapa do ciclo de vida de um sistema, a norma espera que as responsabilidades sejam alocadas entre a organização e seus fornecedores, parceiros, clientes e outros terceiros. A alocação pressupõe que o sistema foi identificado em primeiro lugar.

### run 12w, coverage 0.75

| | |
|---|---|
| **EN before** | the requirements on the management system, leadership, planning, support, operation, performance, evaluation, improvement, controls and objectives. |
| **EN after** | the requirements on leadership, planning, support, operation, improvement, performance evaluation, and the controls and objectives of the management system itself. |

**live es-419**  —  El alcance debe estar disponible como información documentada. Y la norma es específica sobre lo que determina el alcance: las actividades de la organización con respecto a los requisitos sobre liderazgo, planificación, soporte, operación, mejora, evaluación del desempeño, y los controles y objetivos del propio sistema de gestión.

**live pt-BR**  —  O escopo deve estar disponível como informação documentada. E a norma é específica sobre o que o escopo determina: as atividades da organização em relação aos requisitos de liderança, planejamento, suporte, operação, melhoria, avaliação de desempenho e os controles e objetivos do próprio sistema de gestão.

## 02-04-roles-responsibilities-authorities

`42001 clause 5.3`  —  3 span(s)  —  _3 runs, one of them a long ownership list_

### run 10w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | for relevant roles are assigned **and communicated** within the organization |
| **EN after** | attaching to each relevant role are assigned **and communicated** across the organization |

**live es-419**  —  ::concept title="La responsabilidad viaja con la autoridad, o no viaja" La cláusula 5.3 requiere que la alta dirección se asegure de que las [responsabilidades y autoridades]{glossary="roles-responsibilities-authorities"} asociadas a cada rol pertinente estén asignadas **y comunicadas** en toda la organización.

**live pt-BR**  —  ::concept title="A responsabilidade acompanha a autoridade, ou não vai a lugar nenhum" A Cláusula 5.3 exige que a alta direção assegure que as [responsabilidades e autoridades]{glossary="roles-responsibilities-authorities"} associadas a cada função relevante sejam atribuídas **e comunicadas** em toda a organização.

### run 12w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | **Reporting on the performance of the AI management system to top management.** |
| **EN after** | **Reporting to top management on how the AI management system is performing.** |

**live es-419**  —  **Informar a la alta dirección sobre el desempeño del sistema de gestión de IA.** La [autoridad de reporte]{glossary="performance-reporting-authority"} — una ruta definida por la cual la alta dirección conoce cómo está funcionando el sistema.

**live pt-BR**  —  **Reportar à alta direção o desempenho do sistema de gestão de IA.** A [autoridade de reporte]{glossary="performance-reporting-authority"} — um canal definido pelo qual a alta direção toma conhecimento de como o sistema está se saindo.

### run 19w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | Risk management. AI system impact assessments. Asset and resource management. Security. Safety. Privacy. Development. Performance. Human oversight. Supplier relationships. |
| **EN after** | AI system impact assessments. Security. Privacy. Safety. Development. Performance. Supplier relationships. Asset and resource management. Risk management. Human oversight. |

**live es-419**  —  Evaluaciones de impacto del sistema de IA. Seguridad. Privacidad. seguridad. Desarrollo. Desempeño. Relaciones con proveedores. Gestión de activos y recursos. Gestión del riesgo. Supervisión humana. Demostrar la capacidad de cumplir de manera consistente los requisitos legales. Y gestión de la calidad de los datos a lo largo de todo el ciclo de vida.

**live pt-BR**  —  Avaliações de impacto de sistemas de IA. Segurança. Privacidade. Proteção. Desenvolvimento. Desempenho. Relacionamentos com fornecedores. Gestão de ativos e recursos. Gestão de riscos. Supervisão humana. Demonstração da capacidade de cumprir consistentemente os requisitos legais. E gestão da qualidade de dados ao longo de todo o ciclo de vida.

## 02-05-the-ai-risk-assessment

`42001 Annex A risk control objectives`  —  2 span(s)  —  _a list of control objectives; recast in our own words, order kept because the lesson walks them in order_

### run 14w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | Distinguishing acceptable from non-acceptable risks. Performing AI risk assessments. Conducting AI risk treatment. |
| **EN after** | Separating acceptable risk from unacceptable. Running AI risk assessments. Treating the risk that results. |

**live es-419**  —  Separar el riesgo aceptable del inaceptable. Realizar evaluaciones del riesgo de IA. Tratar el riesgo resultante. Y **evaluar los impactos del riesgo de IA.**

**live pt-BR**  —  Separar riscos aceitáveis de não aceitáveis. Realizar avaliações de riscos de IA. Tratar o risco resultante. E **avaliar os impactos dos riscos de IA.**

### run 10w, coverage 0.63

| | |
|---|---|
| **EN before** | It expects the organization to first adopt a vision of risk adapted to its own context |
| **EN after** | It expects the organization to start by adopting a view of risk that fits its own context |

**live es-419**  —  ::callout type="pitfall" La norma señala algo que las organizaciones provenientes de una sola disciplina suelen pasar por alto: la forma en que se define el riesgo, y por tanto la forma en que se concibe la gestión del riesgo, varía entre sectores e industrias. Espera que la organización comience por adoptar una visión del riesgo que se adapte a su propio contexto, lo que puede significar tomar prestada la definición utilizada en el sector al que sirve el sistema de IA, en lugar de la que ya usa el equipo de seguridad. ::

**live pt-BR**  —  ::callout type="pitfall" A norma destaca algo que organizações de uma única disciplina frequentemente ignoram: a forma como o risco é definido, e portanto como a gestão de riscos é concebida, varia entre setores e indústrias. Ela espera que a organização comece adotando uma visão de risco adequada ao seu próprio contexto — o que pode significar tomar emprestada a definição utilizada no setor que o sistema de IA serve, em vez daquela que a equipe de segurança já utiliza. ::

## 02-06-the-ai-system-impact-assessment

`42001 clause 6.1.4, clause 8.4, Annex B.5`  —  9 span(s)  —  _NINE runs -- the densest lesson in the certification. Four are enumerations from Annex B guidance._

### run 12w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | **Define a process** for assessing the potential consequences for individuals or groups |
| **EN after** | **Define a process** for working out what a system could do to individuals or to groups |

**live es-419**  —  **Definir un proceso** para determinar qué podría hacer un sistema a individuos o a grupos, y a las sociedades, que puede surgir en cualquier punto de cómo se construyen, suministran o utilizan los sistemas de IA.

**live pt-BR**  —  **Definir um processo** para determinar o que um sistema poderia fazer a indivíduos ou a grupos, e a sociedades, que pode surgir em qualquer ponto de como os sistemas de IA são construídos, fornecidos ou usados.

### run 14w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | and societies, that can result from the development, provision or use of AI systems |
| **EN after** | and to societies, that can arise anywhere in how AI systems are built, supplied or used |

**live es-419**  —  **Definir un proceso** para determinar qué podría hacer un sistema a individuos o a grupos, y a las sociedades, que puede surgir en cualquier punto de cómo se construyen, suministran o utilizan los sistemas de IA.

**live pt-BR**  —  **Definir um processo** para determinar o que um sistema poderia fazer a indivíduos ou a grupos, e a sociedades, que pode surgir em qualquer ponto de como os sistemas de IA são construídos, fornecidos ou usados.

### run 11w, coverage 0.79

| | |
|---|---|
| **EN before** | **Take into account** the specific technical and societal context where the system is deployed |
| **EN after** | **Take into account** the particular technical and social setting the system is deployed into |

**live es-419**  —  **Tener en cuenta** el entorno técnico y social particular en el que se despliega el sistema, y las jurisdicciones aplicables.

**live pt-BR**  —  **Levar em conta** o contexto técnico e social específico no qual o sistema é implantado, e as jurisdições aplicáveis.

### run 16w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | the organization shall consider the results of the AI system impact assessment in the risk assessment |
| **EN after** | the impact assessment's results shall be taken into account when risk is assessed |

**live es-419**  —  Luego viene la frase que conecta todo: los resultados de la evaluación de impacto deberán tenerse en cuenta al evaluar el riesgo. La lección 2.7 trata sobre esa conexión. Aquí, lo importante es que se trata de un `deberá`.

**live pt-BR**  —  Em seguida, a frase que conecta tudo: a organização deve considerar os resultados da avaliação de impacto do sistema de IA no processo de avaliação de riscos. A lição 2.7 trata dessa conexão. Aqui, o ponto é que se trata de um `shall`.

### run 11w, coverage 0.79

| | |
|---|---|
| **EN before** | assessments are performed at planned intervals, or when significant changes are proposed to occur |
| **EN after** | assessments are performed at planned intervals, and again whenever a significant change is proposed |

**live es-419**  —  La cláusula 8.4 añade la parte operativa: las evaluaciones se realizan a intervalos planificados, y también cada vez que se propone un cambio significativo, y se conserva la información documentada sobre los resultados de todas ellas. ::

**live pt-BR**  —  A cláusula 8.4 acrescenta a parte operacional: as avaliações são realizadas em intervalos planejados, e também sempre que uma mudança significativa for proposta, e a informação documentada sobre os resultados de todas elas é retida. ::

### run 10w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | system affects the **legal position or life opportunities** of individuals |
| **EN after** | system bears on an individual's **legal standing or life chances** |

**live es-419**  —  ::concept title="Impactos en los individuos" La orientación es específica sobre qué buscar. La organización debería considerar si un sistema incide en la **posición jurídica u oportunidades de vida** de los individuos; su **bienestar físico o psicológico**; los **derechos humanos universales**; y las sociedades.

**live pt-BR**  —  ::concept title="Impactos sobre indivíduos" A orientação é específica sobre o que procurar. Convém que a organização considere se um sistema afeta a **posição jurídica ou as oportunidades de vida** dos indivíduos; seu **bem-estar físico ou psicológico**; os **direitos humanos universais**; e as sociedades.

### run 11w, coverage 0.61

| | |
|---|---|
| **EN before** | include fairness, accountability, transparency and explainability, security and privacy, safety and health, financial consequences, accessibility, and human rights |
| **EN after** | include fairness, accountability, transparency and explainability, privacy and security, health and safety, accessibility, human rights, and financial consequences |

**live es-419**  —  Según el propósito y el uso del sistema, las áreas de impacto a considerar incluyen equidad, responsabilidad, transparencia y explicabilidad, privacidad y seguridad, salud y seguridad, accesibilidad, derechos humanos y consecuencias financieras.

**live pt-BR**  —  Dependendo do propósito e do uso do sistema, as áreas de impacto a considerar incluem equidade, responsabilização, transparência e explicabilidade, privacidade e segurança, saúde e segurança, acessibilidade, direitos humanos e consequências financeiras.

### run 31w, coverage 0.91

| | |
|---|---|
| **EN before** | environmental sustainability, including natural resources and greenhouse gas emissions; economic, including access to financial services, employment opportunities, taxes, trade and commerce; government, including legislative processes, misinformation for political gain, national security and criminal justice |
| **EN after** | economic, including access to financial services, employment, taxes, trade and commerce; environmental sustainability, including natural resources and greenhouse gas emissions; government, including legislative processes, national security, criminal justice and misinformation for political gain |

**live es-419**  —  ::concept title="Impactos en las sociedades" La parte societal es donde las organizaciones suelen quedarse sin vocabulario, por lo que la orientación proporciona categorías: económica, incluido el acceso a servicios financieros, el empleo, los impuestos, el comercio y los negocios; sostenibilidad ambiental, incluidos los recursos naturales y las emisiones de gases de efecto invernadero; gobierno, incluidos los procesos legislativos, la seguridad nacional, la justicia penal y la desinformación con fines políticos; salud y seguridad, incluido el acceso a la atención sanitaria, el diagnóstico y tratamiento, y el posible daño físico y psicológico; y normas, tradiciones, cultura y valores, incluida la desinformación que conduce a sesgos o daños.

**live pt-BR**  —  ::concept title="Impactos sobre as sociedades" A parte social é onde as organizações tendem a ficar sem vocabulário, por isso a orientação fornece categorias: econômica, incluindo acesso a serviços financeiros, oportunidades de emprego, impostos, comércio e negócios; sustentabilidade ambiental, incluindo recursos naturais e emissões de gases de efeito estufa; governamental, incluindo processos legislativos, segurança nacional, justiça criminal e desinformação para ganho político; saúde e segurança, incluindo acesso a cuidados de saúde, diagnóstico e tratamento, e potenciais danos físicos e psicológicos; e normas, tradições, cultura e valores, incluindo desinformação que leva a preconceitos ou danos.

### run 18w, coverage 0.86

| | |
|---|---|
| **EN before** | consider how the systems can be **misused** to create societal harms, and how they can be used to **address historical harms** |
| **EN after** | consider how these systems might be **misused** in ways that harm society, and how they might instead **help undo historical harms** |

**live es-419**  —  También orienta hacia un tipo específico de reflexión: considerar cómo estos sistemas podrían ser **utilizados indebidamente** de maneras que dañen a la sociedad, y cómo podrían en cambio **ayudar a revertir daños históricos**. Ambas direcciones.

**live pt-BR**  —  Ela também orienta um tipo específico de raciocínio: considere como esses sistemas podem ser **mal utilizados** de maneiras que prejudicam a sociedade, e como podem, ao contrário, **ajudar a desfazer danos históricos**. Ambas as direções.

## 02-07-risk-versus-impact

`42001 clause 6.1.4`  —  1 span(s)  —  _the same recast as tasks.knowledge 2.7; `requiring` is held_

### run 13w, coverage 0.76

| | |
|---|---|
| **EN before** | requiring the organization to **consider the results of the AI system impact assessment in the risk assessment.** |
| **EN after** | requiring the impact assessment's results **to be taken into account when risk is assessed.** |

**live es-419**  —  Segundo, la cláusula 6.1.4 concluye requiriendo que los resultados de la evaluación de impacto **sean tomados en cuenta al evaluar el riesgo.** Una nota en la cláusula 6.1.2 apunta en la misma dirección, indicando que la organización puede utilizar una evaluación de impacto al evaluar las consecuencias.

**live pt-BR**  —  Segundo, a Seção 6.1.4 termina exigindo que os resultados da avaliação de impacto **sejam considerados quando o risco for avaliado.** Uma nota na Seção 6.1.2 aponta na mesma direção, indicando que a organização pode usar uma avaliação de impacto ao avaliar consequências.

## 02-08-risk-treatment-and-the-soa

`42001 Annex A intro and clause 6.1.3`  —  2 span(s)  —  _`can` held as `may`; `shall` held as `shall`_

### run 9w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | and additional control objectives and controls can be needed |
| **EN after** | and further control objectives and controls may be needed |

**live es-419**  —  Los controles del Anexo A **no son exhaustivos**, y pueden necesitarse objetivos de control y controles adicionales. Cuando sean necesarios controles diferentes o adicionales, la organización puede diseñarlos ella misma o tomarlos de fuentes existentes.

**live pt-BR**  —  Os controles do Anexo A **não são exaustivos**, e objetivos de controle e controles adicionais podem ser necessários. Quando controles diferentes ou adicionais forem necessários, a organização pode criá-los ela mesma ou obtê-los de fontes existentes.

### run 17w, coverage 1

| | |
|---|---|
| **EN before** | **shall obtain approval from designated management** for the AI risk treatment plan **and for acceptance of the |
| **EN after** | **shall get sign-off from designated management** on the AI risk treatment plan **and on accepting the |

**live es-419**  —  La organización **deberá obtener la aprobación de la dirección designada** sobre el plan de tratamiento del riesgo de IA **y sobre la aceptación de los [riesgos residuales de IA]{glossary="residual-risk-approval"}.** Dos aprobaciones, y la segunda es la que tiene mayor peso — alguien con autoridad debe declarar, de manera formal, que lo que queda tras el tratamiento es aceptable.

**live pt-BR**  —  A organização **deve obter aprovação da gestão designada** para o plano de tratamento de riscos de IA **e para a aceitação dos [riscos residuais de IA]{glossary="residual-risk-approval"}.** Duas aprovações, sendo a segunda a que carrega mais peso — alguém com autoridade precisa declarar formalmente, e de forma registrada, que o que permanece após o tratamento é aceitável.

## 03-01-resources-and-competence

`42001 clauses 7.1, 7.2, A.4`  —  6 span(s)  —  _6 runs; the 30-word expertise list is the longest and is an ordering_

### run 15w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | resources can be provided by the organization itself, by its customers, or by third parties |
| **EN after** | resources may come from the organization itself, from its customers, or from third parties |

**live es-419**  —  Dos observaciones. Primero, la guía señala que los recursos pueden provenir de la propia organización, de sus clientes o de terceros, por lo que el inventario se extiende más allá de la organización. Segundo, documentar los recursos se describe como un elemento que informa la evaluación del impacto, una conexión que vale la pena retener: no es posible evaluar lo que un sistema hace a las personas sin conocer con qué está construido. ::

**live pt-BR**  —  Duas observações. Primeiro, as notas de orientação indicam que os recursos podem vir da própria organização, de seus clientes ou de terceiros — portanto, o inventário se estende para além da organização. Segundo, documentar os recursos é descrito como algo que subsidia a avaliação de impacto, uma conexão que vale a pena reter: não é possível avaliar o que um sistema faz às pessoas sem saber com o que ele foi construído. ::

### run 11w, coverage 1  [27001:2022, 42001:2023]

| | |
|---|---|
| **EN before** | are competent on the basis of appropriate education, training or experience |
| **EN after** | are competent, grounded in suitable education, training or experience |

**live es-419**  —  ::concept title="Competencia y cómo se demuestra" El apartado 7.2 exige tres cosas. Determinar la [competencia]{glossary="competence-requirements-ai"} necesaria de las personas que realizan trabajo bajo el control de la organización y que afecta su desempeño en IA. Asegurarse de que sean competentes sobre la base de educación, formación o experiencia apropiadas. Y cuando corresponda, tomar acciones para adquirir la competencia y **evaluar si la acción funcionó.**

**live pt-BR**  —  ::concept title="Competência e como ela é demonstrada" A Seção 7.2 exige três coisas. Determinar a [competência]{glossary="competence-requirements-ai"} necessária das pessoas que realizam trabalho sob o controle da organização que afeta seu desempenho em IA. Garantir que essas pessoas sejam competentes, com base em educação, treinamento ou experiência adequados. E, quando aplicável, tomar ações para adquirir a competência e **avaliar se a ação funcionou.**

### run 15w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | the organization should consider the need for **diverse expertise** and include the types of roles |
| **EN after** | the organization should weigh its need for **diverse expertise** and name the kinds of role |

**live es-419**  —  ::concept title="Por qué la competencia en IA no recae en una sola persona" La guía sobre recursos humanos señala que la organización debería considerar su necesidad de **experiencia diversa** e indicar los tipos de roles que el sistema necesita. Sus ejemplos son instructivos:

**live pt-BR**  —  ::concept title="Por que a competência em IA não é uma única pessoa" A orientação sobre recursos humanos afirma que a organização convém que considere sua necessidade de **expertise diversificada** e nomeie os tipos de funções que o sistema requer. Seus exemplos são instrutivos:

### run 30w, coverage 0.91

| | |
|---|---|
| **EN before** | Data scientists. Roles related to human oversight of AI systems. Experts on trustworthiness topics such as safety, security and privacy. AI researchers and specialists, and domain experts relevant to the systems in question. |
| **EN after** | Domain experts for the systems in question. Data scientists. AI researchers and specialists. Experts on trustworthiness topics such as security, privacy and safety. Roles carrying human oversight of AI systems. |

**live es-419**  —  Expertos en el dominio de los sistemas en cuestión. Científicos de datos. Investigadores y especialistas en IA. Expertos en temas de confiabilidad como seguridad, privacidad y protección. Roles que llevan a cabo la supervisión humana de sistemas de IA.

**live pt-BR**  —  Especialistas de domínio para os sistemas em questão. Cientistas de dados. Pesquisadores e especialistas em IA. Especialistas em tópicos de confiabilidade, como segurança, privacidade e proteção. Funções que exercem supervisão humana de sistemas de IA.

### run 11w, coverage 1

| | |
|---|---|
| **EN before** | that different resources can be necessary at different stages of the |
| **EN after** | that different resources may be needed at different points in the |

**live es-419**  —  La guía añade que pueden ser necesarios diferentes recursos en distintos puntos del ciclo de vida. La competencia necesaria para especificar un sistema no es la misma que se necesita para monitorearlo en producción, y una organización que contrató personal para la primera descubrirá la brecha durante la segunda.

**live pt-BR**  —  A orientação acrescenta que diferentes recursos podem ser necessários em diferentes pontos do ciclo de vida. A competência necessária para especificar um sistema não é a competência necessária para monitorá-lo em produção, e uma organização que contratou pessoal para a primeira descobrirá a lacuna durante a segunda.

### run 10w, coverage 1

| | |
|---|---|
| **EN before** | and understand the instructions and other documentation associated with the |
| **EN after** | and understand whatever instructions and documentation accompany the |

**live es-419**  —  La guía sobre uso responsable es directa al respecto. El personal involucrado en actividades de supervisión debería estar informado, capacitado y comprender las instrucciones y la documentación que acompañan al sistema, así como las funciones que desempeña para satisfacer los objetivos de supervisión.

**live pt-BR**  —  A orientação sobre uso responsável é direta a esse respeito. Convém que o pessoal envolvido em atividades de supervisão seja informado, treinado e compreenda quaisquer instruções e documentações que acompanhem o sistema, bem como as responsabilidades que desempenha para satisfazer os objetivos de supervisão.

## 03-02-awareness-and-communication

`42001 clauses 7.3, 7.4, A.3.3`  —  6 span(s)  —  _6 runs; the clause 7.4 four-way list is an ordering_

### run 11w, coverage 1  [27001:2022, 42001:2023]

| | |
|---|---|
| **EN before** | Persons doing work under the organization's control shall be aware of: |
| **EN after** | Anyone working under the organization's control must be aware of: |

**live es-419**  —  ::concept title="Qué exige la conciencia" La cláusula 7.3 tiene tres puntos. Cualquier persona que trabaje bajo el control de la organización debe ser consciente de:

**live pt-BR**  —  ::concept title="O que a conscientização exige" A Cláusula 7.3 tem três marcadores. Qualquer pessoa que trabalhe sob o controle da organização deve estar ciente de:

### run 17w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | **Their contribution to the effectiveness of the AI management system**, including the benefits of improved AI performance |
| **EN after** | **What they contribute to making the AI management system effective**, including what better AI performance buys |

**live es-419**  —  **Su contribución a la eficacia del sistema de gestión de IA**, incluidos los beneficios que brinda un mejor desempeño de la IA. Esta es la parte positiva y se omite de manera sistemática. Los programas de conciencia que consisten únicamente en lo que no se debe hacer generan cumplimiento sin compromiso.

**live pt-BR**  —  **Sua contribuição para tornar o sistema de gestão de IA eficaz**, incluindo o que uma melhor performance da IA proporciona. Esta é a metade positiva e é rotineiramente omitida. Programas de conscientização compostos inteiramente por proibições geram conformidade sem engajamento.

### run 13w, coverage 1

| | |
|---|---|
| **EN before** | determine the internal and external communications relevant to the AI management system, and |
| **EN after** | work out which internal and external communications bear on the AI management system, and |

**live es-419**  —  ::concept title="La comunicación es un conjunto de decisiones" La cláusula 7.4 exige que la organización determine qué comunicaciones internas y externas son pertinentes para el sistema de gestión de IA, y nombra cuatro cosas que debe decidir:

**live pt-BR**  —  ::concept title="Comunicação é um conjunto de decisões" A Cláusula 7.4 exige que a organização determine quais comunicações internas e externas são relevantes para o sistema de gestão de IA, e nomeia quatro coisas que ela deve decidir:

### run 14w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | **What** it will communicate. **When** to communicate. **With whom** to communicate. **How** to communicate. |
| **EN after** | **What** it will communicate. **With whom**. **When**. And **how**. |

**live es-419**  —  **Qué** comunicará. **Con quién**. **Cuándo**. Y **cómo**.

**live pt-BR**  —  **O quê** comunicar. **Com quem**. **Quando**. E **como**.

### run 8w, coverage 0.8

| | |
|---|---|
| **EN before** | their contribution to the effectiveness of the management system, including |
| **EN after** | what they contribute to making the management system effective, including |

**live es-419**  —  ::interactive widget="highlight-mistake" id="awareness-or-communication" concept_slugs="communication-planning" { "scenario_title": "Cuatro situaciones. ¿Cuáles dos corresponden a la conciencia del apartado 7.3 y no a la comunicación del apartado 7.4?", "text": "Una organización revisa sus disposiciones. Un contratista sabe qué ocurre si utiliza un modelo no aprobado con datos de clientes. La organización ha decidido quién informa a los usuarios cuando cambia una función de IA, y cómo. Todas las personas que operan un sistema desplegado saben cómo su trabajo afecta el desempeño de la IA. Existe una ruta y un plazo definidos para notificar a un regulador sobre un incidente grave.", "highlights": [ { "id": "contractor", "span": "Un contratista sabe qué ocurre si utiliza un modelo no aprobado con datos de clientes", "is_correct": true, "feedback": "Conciencia según el apartado 7.3: las implicaciones de no conformar. Nótese que abarca a las personas que realizan trabajo bajo el control de la organización, lo que incluye a los contratistas y no solo a los empleados." }, { "id": "operators", "span": "Todas las personas que operan un sistema desplegado saben cómo su trabajo afecta el desempeño de la IA", "is_correct": true, "feedback": "Conciencia según el apartado 7.3: su contribución a la eficacia del sistema de gestión, incluidos los beneficios de un mejor desempeño." }, { "id": "userchange", "span": "La organización ha decidido quién informa a los usuarios cuando cambia una función de IA, y cómo", "is_correct": false, "feedback": "Comunicación según el apartado 7.4: qué se comunicará, cuándo, con quién y cómo. Es una decisión sobre un canal, no un estado de conocimiento en la mente de una persona." }, { "id": "regulator", "span": "Existe una ruta y un plazo definidos para notificar a un regulador sobre un incidente grave", "is_correct": false, "feedback": "Comunicación según el apartado 7.4, externa. La conciencia se refiere a lo que las personas saben; la comunicación se refiere a las disposiciones para informarles." } ], "minimum_correct": 2 } ::

**live pt-BR**  —  ::interactive widget="highlight-mistake" id="awareness-or-communication" concept_slugs="communication-planning" { "scenario_title": "Quatro situações. Quais duas correspondem à conscientização da Seção 7.3 e não à comunicação da Seção 7.4?", "text": "Uma organização revisa seus arranjos. Um prestador de serviço sabe o que acontece se usar um modelo não aprovado com dados de clientes. A organização decidiu quem informa os usuários quando uma funcionalidade de IA muda e como isso é feito. Todos que operam um sistema implantado sabem como seu trabalho afeta o desempenho da IA. Há uma rota definida e um prazo para notificar um regulador sobre um incidente grave.", "highlights": [ { "id": "contractor", "span": "Um prestador de serviço sabe o que acontece se usar um modelo não aprovado com dados de clientes", "is_correct": true, "feedback": "Conscientização da Seção 7.3 — as implicações de não estar em conformidade. Observe que abrange pessoas que realizam trabalho sob o controle da organização, o que inclui prestadores de serviço e não apenas funcionários." }, { "id": "operators", "span": "Todos que operam um sistema implantado sabem como seu trabalho afeta o desempenho da IA", "is_correct": true, "feedback": "Conscientização da Seção 7.3 — sua contribuição para a eficácia do sistema de gestão, incluindo os benefícios da melhoria do desempenho." }, { "id": "userchange", "span": "A organização decidiu quem informa os usuários quando uma funcionalidade de IA muda e como isso é feito", "is_correct": false, "feedback": "Comunicação da Seção 7.4 — o quê será comunicado, quando, com quem e como. Uma decisão sobre um canal, não um estado de conhecimento na cabeça de uma pessoa." }, { "id": "regulator", "span": "Há uma rota definida e um prazo para notificar um regulador sobre um incidente grave", "is_correct": false, "feedback": "Comunicação da Seção 7.4, externa. Conscientização diz respeito ao que as pessoas sabem; comunicação diz respeito aos arranjos para informá-las." } ], "minimum_correct": 2 } ::

### run 17w, coverage 0.81

| | |
|---|---|
| **EN before** | a process for people to report concerns about the organization's role with respect to an AI system throughout its life cycle |
| **EN after** | a route for people to raise concerns about whatever role the organization holds around an AI system, at any point in its life |

**live es-419**  —  **Reporte de inquietudes.** Uno de los controles del Anexo A exige una vía para que las personas planteen inquietudes sobre cualquier papel que la organización desempeñe en relación con un sistema de IA, en cualquier momento de su ciclo de vida. La guía de implementación es específica: opciones de confidencialidad o anonimato, disponibilidad y promoción para personas empleadas y contratadas, personal calificado, poderes de investigación y resolución, escalamiento, **protección efectiva contra represalias** y respuesta en un plazo apropiado.

**live pt-BR**  —  **Relato de preocupações.** Um dos controles do Anexo A exige um canal para que as pessoas levantem preocupações sobre qualquer papel que a organização desempenhe em relação a um sistema de IA, em qualquer momento de seu ciclo de vida. A orientação de implementação é específica: opções de confidencialidade ou anonimato, disponibilidade e divulgação para pessoas empregadas e contratadas, equipe qualificada, poderes de investigação e resolução, escalonamento, **proteção efetiva contra represálias** e resposta dentro de um prazo adequado.

## 03-03-documented-information

`42001 clause 7.5.3`  —  4 span(s)  —  _4 runs_

### run 13w, coverage 1  [27001:2022]

| | |
|---|---|
| **EN before** | is available and suitable for use where and when it is needed, and |
| **EN after** | is on hand and fit to use wherever and whenever it is needed, and |

**live es-419**  —  La cláusula 7.5.3 regula el [control]{glossary="control-of-documented-information"} y exige dos resultados: que la información esté disponible y sea adecuada para su uso donde y cuando se necesite, y que esté protegida de manera suficiente —frente a pérdida de confidencialidad, uso indebido o pérdida de integridad—.

**live pt-BR**  —  A Seção 7.5.3 governa o [controle]{glossary="control-of-documented-information"} e solicita dois resultados: a informação está disponível e adequada para uso onde e quando necessário, e está adequadamente protegida — contra perda de confidencialidade, uso indevido ou perda de integridade.

### run 10w, coverage 1  [27001:2022, 42001:2023]

| | |
|---|---|
| **EN before** | from loss of confidentiality, improper use, or loss of integrity |
| **EN after** | against lost confidentiality, misuse, or lost integrity |

**live es-419**  —  La cláusula 7.5.3 regula el [control]{glossary="control-of-documented-information"} y exige dos resultados: que la información esté disponible y sea adecuada para su uso donde y cuando se necesite, y que esté protegida de manera suficiente —frente a pérdida de confidencialidad, uso indebido o pérdida de integridad—.

**live pt-BR**  —  A Seção 7.5.3 governa o [controle]{glossary="control-of-documented-information"} e solicita dois resultados: a informação está disponível e adequada para uso onde e quando necessário, e está adequadamente protegida — contra perda de confidencialidade, uso indevido ou perda de integridade.

### run 11w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | as applicable: distribution, access, retrieval and use; storage and preservation, including |
| **EN after** | so far as each applies: access, retrieval, distribution and use; storage and preservation, including |

**live es-419**  —  A continuación se nombran cuatro actividades, en la medida en que cada una aplique: acceso, recuperación, distribución y uso; almacenamiento y conservación, incluida la preservación de la legibilidad; control de cambios, como el control de versiones; y retención y disposición.

**live pt-BR**  —  Quatro atividades são então nomeadas, na medida em que cada uma se aplica: acesso, recuperação, distribuição e uso; armazenamento e preservação, incluindo a preservação da legibilidade; controle de alterações, como controle de versão; e retenção e descarte.

### run 22w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | Documented information of external origin, determined by the organization to be necessary for the planning and operation of the AI management system |
| **EN after** | Documented information that came from outside, where the organization has decided it is needed to plan and run the AI management system |

**live es-419**  —  La información documentada de origen externo, en los casos en que la organización haya decidido que es necesaria para planificar y ejecutar el sistema de gestión de IA, debe identificarse según corresponda y controlarse.

**live pt-BR**  —  A informação documentada de origem externa, onde a organização decidiu que é necessária para planejar e executar o sistema de gestão de IA, deve ser identificada conforme apropriado e controlada.

## 03-04-operational-planning-and-control

`42001 clause 8.1`  —  5 span(s)  —  _5 runs; two carry `shall` and both hold it_

### run 19w, coverage 1  [27001:2022, 42001:2023]

| | |
|---|---|
| **EN before** | plan, implement and control the processes needed to meet requirements and to implement the actions determined in clause 6 |
| **EN after** | plan, put in place and control whatever processes are needed to meet requirements and to carry out the actions clause 6 determined |

**live es-419**  —  ::concept title="Primero los criterios, luego el control" La cláusula 8.1 exige que la organización planifique, implemente y controle los procesos necesarios para cumplir los requisitos y para llevar a cabo las acciones que la cláusula 6 determinó, e indica cómo hacerlo: estableciendo [criterios para los procesos]{glossary="process-criteria"} e implementando el control de los procesos de acuerdo con esos criterios.

**live pt-BR**  —  ::concept title="Critérios primeiro, depois controle" A Seção 8.1 exige que a organização planeje, implemente e controle quaisquer processos necessários para atender aos requisitos e para executar as ações determinadas pela Seção 6, e indica como fazê-lo: estabelecendo [critérios para os processos]{glossary="process-criteria"} e implementando o controle dos processos de acordo com esses critérios.

### run 21w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | **the effectiveness of these controls shall be monitored, and corrective actions shall be considered if the intended results are not achieved.** |
| **EN after** | **how well these controls work shall be monitored, and corrective action shall be considered where the intended results do not follow.** |

**live es-419**  —  E inmediatamente después: **se deberá monitorear qué tan bien funcionan estos controles, y se deberán considerar acciones correctivas cuando los resultados previstos no se obtengan.**

**live pt-BR**  —  E imediatamente após: **a eficácia desses controles deve ser monitorada, e ações corretivas devem ser consideradas caso os resultados pretendidos não sejam alcançados.**

### run 12w, coverage 1  [27001:2022, 42001:2023]

| | |
|---|---|
| **EN before** | be available to the extent necessary to have confidence that the processes |
| **EN after** | be kept to whatever extent gives confidence that the processes |

**live es-419**  —  La información documentada debe conservarse en la medida en que genere confianza en que los procesos se llevaron a cabo según lo planificado. Nótese la formulación: *en la medida necesaria para tener confianza.* La prueba es si la evidencia respalda la afirmación, no si se completó un formulario. ::

**live pt-BR**  —  A informação documentada deve ser mantida na medida em que isso proporcione confiança de que os processos foram executados conforme planejado. Observe a redação: *na medida necessária para ter confiança.* O teste é se as evidências sustentam a afirmação, não se um formulário foi preenchido. ::

### run 10w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | operations, new or modified intended uses, or other changes in |
| **EN after** | operations, intended uses that are new or altered, or other shifts in |

**live es-419**  —  **El cambio puede no ser suyo.** Una organización que opera un modelo que no construyó está sujeta a los cambios realizados por quien lo hizo. La orientación sobre operación y monitoreo señala que las actualizaciones del sistema pueden incluir cambios en las operaciones, usos previstos nuevos o modificados, u otros cambios en la funcionalidad, y que deberían existir procedimientos para abordar los cambios operacionales, incluida la comunicación a los usuarios. Cuando el cambio se origina en un proveedor, la organización sigue siendo propietaria de las consecuencias.

**live pt-BR**  —  **A mudança pode não ser sua.** Uma organização que opera um modelo que não construiu está sujeita a mudanças feitas por quem o construiu. A orientação sobre operação e monitoramento indica que atualizações de sistema podem incluir mudanças nas operações, usos pretendidos novos ou alterados, ou outras mudanças de funcionalidade, e que devem existir procedimentos para tratar mudanças operacionais, incluindo comunicação aos usuários. Quando a mudança se origina em um fornecedor, a organização ainda é responsável pela consequência.

### run 21w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | the organization shall ensure that externally provided processes, products or services that are relevant to the AI management system are controlled |
| **EN after** | the organization shall make sure that any externally provided process, product or service bearing on the AI management system is controlled |

**live es-419**  —  ::deep-dive title="Procesos que no ejecuta usted mismo" La cláusula 8.1 termina con una frase breve: la organización debe asegurarse de que todo proceso, producto o servicio proporcionado externamente que incida en el sistema de gestión de IA esté controlado.

**live pt-BR**  —  ::deep-dive title="Processos que você não executa internamente" A Cláusula 8.1 termina com uma frase curta: a organização deve garantir que qualquer processo, produto ou serviço fornecido externamente que influencie o sistema de gestão de IA seja controlado.

## 03-05-third-party-ai-supply

`42001 A.10 supplier and allocation controls`  —  7 span(s)  —  _7 runs; three reuse earlier recasts_

### run 11w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | for use on its own or as part of another product |
| **EN after** | whether used standalone or embedded in another product |

**live es-419**  —  ::concept title="Qué puede ser un proveedor" La orientación sobre proveedores es inusualmente concreta respecto al alcance. Las organizaciones que desarrollan o utilizan IA pueden recurrir a proveedores de diversas maneras: obteniendo conjuntos de datos, algoritmos o modelos de aprendizaje automático, otros componentes como bibliotecas de software, o un sistema de IA completo — ya sea utilizado de forma independiente o integrado en otro producto, siendo un vehículo el ejemplo proporcionado.

**live pt-BR**  —  ::concept title="O que pode ser um fornecedor" A orientação sobre fornecedores é incomumente concreta quanto ao escopo. Organizações que desenvolvem ou utilizam IA podem recorrer a fornecedores de diversas formas: aquisição de conjuntos de dados, algoritmos ou modelos de aprendizado de máquina, outros componentes como bibliotecas de software, ou um sistema de IA completo — seja utilizado de forma isolada ou embutido em outro produto, sendo um veículo o exemplo citado.

### run 16w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | what they supply, and **the varying level of risk this can pose to the system and |
| **EN after** | what each supplies, and **how much risk that can carry for the system and |

**live es-419**  —  La orientación pide a la organización que considere los diferentes tipos de proveedores, qué suministra cada uno y **cuánto riesgo puede esto conllevar para el sistema y para la organización en su conjunto** — y que eso oriente tres aspectos: qué proveedores se seleccionan, qué requisitos se les imponen y cuánto seguimiento y evaluación continua reciben.

**live pt-BR**  —  A orientação pede que a organização considere os diferentes tipos de fornecedor, o que cada um fornece e **o quanto de risco isso pode representar para o sistema e para a organização como um todo** — e que isso oriente três aspectos: quais fornecedores são selecionados, quais requisitos lhes são impostos e qual o nível de monitoramento e avaliação contínuos que recebem.

### run 10w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | of services, products or materials provided by suppliers aligns with |
| **EN after** | of supplier-provided services, products or materials lines up with |

**live es-419**  —  **Establecer un proceso** que garantice que el uso por parte de la organización de servicios, productos o materiales proporcionados por proveedores esté alineado con su propio enfoque de desarrollo y uso responsable de sistemas de IA. Nótese el encuadre — alineación con *su propio* enfoque, lo que presupone que se tiene uno.

**live pt-BR**  —  **Estabelecer um processo** que garanta que o uso de serviços, produtos ou materiais fornecidos por fornecedores esteja alinhado com a própria abordagem da organização para o desenvolvimento e uso responsável de sistemas de IA. Observe o enquadramento — alinhamento com *sua* abordagem, o que pressupõe que você tenha uma.

### run 12w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | the organization can decide to work with the supplier to achieve this |
| **EN after** | the organization may choose to work with the supplier to get there |

**live es-419**  —  **Requerir acciones correctivas** cuando un sistema o componente suministrado no funcione según lo previsto, o produzca impactos en individuos, grupos o sociedades que no estén alineados con el enfoque responsable de la organización. La orientación añade que la organización puede decidir trabajar con el proveedor para lograrlo.

**live pt-BR**  —  **Exigir ação corretiva** quando um sistema ou componente fornecido não funcionar conforme o esperado ou produzir impactos sobre indivíduos, grupos ou sociedades que não estejam alinhados com a abordagem responsável da organização. A orientação acrescenta que a organização pode decidir trabalhar com o fornecedor para alcançar esse resultado.

### run 17w, coverage 0.89

| | |
|---|---|
| **EN before** | Responsibilities within the AI system life cycle are allocated between the organization, its partners, suppliers, customers and third parties |
| **EN after** | Responsibilities across the life of an AI system are allocated between the organization and its suppliers, partners, customers and other third parties |

**live es-419**  —  El control de asignación añade el marco alrededor de estos aspectos. Las responsabilidades a lo largo del ciclo de vida de un sistema de IA se asignan entre la organización y sus proveedores, socios, clientes y otros terceros — y la orientación señala que en un ciclo de vida, las responsabilidades pueden dividirse entre quienes suministran los datos, quienes suministran algoritmos y modelos, y las partes que desarrollan o utilizan el sistema mientras siguen siendo responsables ante las partes interesadas.

**live pt-BR**  —  O controle de alocação adiciona o enquadramento em torno desses pontos. As responsabilidades ao longo da vida de um sistema de IA são alocadas entre a organização e seus fornecedores, parceiros, clientes e outros terceiros — e a orientação observa que, em um ciclo de vida, as responsabilidades podem ser divididas entre quem fornece os dados, quem fornece algoritmos e modelos, e as partes que desenvolvem ou utilizam o sistema, permanecendo responsáveis perante as partes interessadas.

### run 15w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | life cycle, responsibilities can be split between parties providing data, parties providing algorithms and models |
| **EN after** | life cycle, responsibilities may be split between whoever supplies the data, whoever supplies algorithms and models |

**live es-419**  —  El control de asignación añade el marco alrededor de estos aspectos. Las responsabilidades a lo largo del ciclo de vida de un sistema de IA se asignan entre la organización y sus proveedores, socios, clientes y otros terceros — y la orientación señala que en un ciclo de vida, las responsabilidades pueden dividirse entre quienes suministran los datos, quienes suministran algoritmos y modelos, y las partes que desarrollan o utilizan el sistema mientras siguen siendo responsables ante las partes interesadas.

**live pt-BR**  —  O controle de alocação adiciona o enquadramento em torno desses pontos. As responsabilidades ao longo da vida de um sistema de IA são alocadas entre a organização e seus fornecedores, parceiros, clientes e outros terceiros — e a orientação observa que, em um ciclo de vida, as responsabilidades podem ser divididas entre quem fornece os dados, quem fornece algoritmos e modelos, e as partes que desenvolvem ou utilizam o sistema, permanecendo responsáveis perante as partes interessadas.

### run 12w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | Where the organization supplies an AI system to a third party, the |
| **EN after** | Where the organization is itself the supplier of an AI system, the |

**live es-419**  —  ::callout type="pitfall" Cuando la organización es en sí misma el proveedor de un sistema de IA, la obligación también corre en sentido contrario: debería adoptar un enfoque responsable en el desarrollo del sistema y ser capaz de proporcionar la documentación necesaria tanto a las partes interesadas pertinentes como al tercero al que suministra. Una organización que es cliente de un sistema y proveedora de otro tiene ambos conjuntos de obligaciones simultáneamente — lo cual es la determinación de roles de la lección 1.2 cumpliendo su función nuevamente. ::

**live pt-BR**  —  ::callout type="pitfall" Quando a organização é ela própria a fornecedora de um sistema de IA, a obrigação também corre no sentido inverso: ela deveria adotar uma abordagem responsável no desenvolvimento do sistema e ser capaz de fornecer a documentação necessária tanto às partes interessadas relevantes quanto ao terceiro para o qual está fornecendo. Uma organização que é cliente de um sistema e fornecedora de outro detém simultaneamente ambos os conjuntos de obrigações — o que remete à determinação de papéis da lição 1.2, cumprindo novamente o seu papel. ::

## 03-06-data-for-ai-systems

`42001 A.7 data controls`  —  6 span(s)  —  _6 runs; two are inside the acquisition enumeration_

### run 12w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | the organization understands the role and impacts of data in AI systems |
| **EN after** | the organization grasps what data does, and does to people, across its AI systems |

**live es-419**  —  ::concept title="Por qué los datos tienen su propia categoría" El Anexo A otorga a los [datos para sistemas de IA]{glossary="data-for-ai-systems"} una categoría propia, con el objetivo de garantizar que la organización comprenda qué hacen los datos, y qué hacen a las personas, en sus sistemas de IA a lo largo de sus ciclos de vida.

**live pt-BR**  —  ::concept title="Por que os dados têm sua própria categoria" O Anexo A atribui aos [dados para sistemas de IA]{glossary="data-for-ai-systems"} uma categoria própria, com o objetivo de garantir que a organização compreenda o que os dados fazem, e fazem às pessoas, em seus sistemas de IA ao longo de seus ciclos de vida.

### run 17w, coverage 1

| | |
|---|---|
| **EN before** | determine and document details about the acquisition and selection of the data used in its AI systems |
| **EN after** | settle and record how the data used in its AI systems was acquired and chosen |

**live es-419**  —  ::concept title="Adquisición y lo que registra" El control de [adquisición]{glossary="data-acquisition"} solicita a la organización que establezca y registre cómo se adquirieron y seleccionaron los datos utilizados en sus sistemas de IA. La guía enumera qué registrar, y la lista es un buen diagnóstico de si una organización ha reflexionado realmente sobre sus datos:

**live pt-BR**  —  ::concept title="Aquisição e o que ela registra" O controle de [aquisição]{glossary="data-acquisition"} solicita que a organização estabeleça e registre como os dados utilizados em seus sistemas de IA foram adquiridos e selecionados. As diretrizes listam o que deve ser registrado, e essa lista é um bom diagnóstico para verificar se a organização realmente refletiu sobre seus dados:

### run 10w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | static, streamed, gathered, machine generated. Data subject demographics and characteristics |
| **EN after** | static, streamed, gathered or machine generated. The demographics and characteristics of data subjects |

**live es-419**  —  Categorías de datos necesarios. Cantidad necesaria. Fuentes — internas, adquiridas, compartidas, abiertas, sintéticas. Características de la fuente — estática, en flujo continuo, recopilada o generada por máquina. Demografía y características de los sujetos de datos, **incluidos los sesgos conocidos o sospechados, y otros errores sistemáticos**. Manejo previo, incluidos usos anteriores y conformidad con los requisitos de privacidad y seguridad. Derechos sobre los datos, incluida la información personal y los derechos de autor. Metadatos asociados, incluidos los detalles de etiquetado. Y procedencia.

**live pt-BR**  —  Categorias de dados necessários. Quantidade necessária. Fontes — internas, adquiridas, compartilhadas, abertas, sintéticas. Características da fonte — estática, transmitida em fluxo, coletada ou gerada por máquina. Dados demográficos e características dos titulares dos dados, **incluindo vieses conhecidos ou suspeitos e outros erros sistemáticos**. Tratamento anterior, incluindo usos anteriores e conformidade com requisitos de privacidade e segurança. Direitos sobre os dados, incluindo informações pessoais e direitos autorais. Metadados associados, incluindo detalhes de rotulagem. E proveniência.

### run 10w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | known or potential biases or other systematic errors**. Prior handling |
| **EN after** | biases known or suspected, and other systematic errors**. Prior handling |

**live es-419**  —  Categorías de datos necesarios. Cantidad necesaria. Fuentes — internas, adquiridas, compartidas, abiertas, sintéticas. Características de la fuente — estática, en flujo continuo, recopilada o generada por máquina. Demografía y características de los sujetos de datos, **incluidos los sesgos conocidos o sospechados, y otros errores sistemáticos**. Manejo previo, incluidos usos anteriores y conformidad con los requisitos de privacidad y seguridad. Derechos sobre los datos, incluida la información personal y los derechos de autor. Metadatos asociados, incluidos los detalles de etiquetado. Y procedencia.

**live pt-BR**  —  Categorias de dados necessários. Quantidade necessária. Fontes — internas, adquiridas, compartilhadas, abertas, sintéticas. Características da fonte — estática, transmitida em fluxo, coletada ou gerada por máquina. Dados demográficos e características dos titulares dos dados, **incluindo vieses conhecidos ou suspeitos e outros erros sistemáticos**. Tratamento anterior, incluindo usos anteriores e conformidade com requisitos de privacidade e segurança. Direitos sobre os dados, incluindo informações pessoais e direitos autorais. Metadados associados, incluindo detalhes de rotulagem. E proveniência.

### run 10w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | that the quality of training, validation, test and production data |
| **EN after** | that the quality of the training, validation, test and production sets |

**live es-419**  —  **[Calidad]{glossary="data-quality"}.** La organización define y documenta los requisitos de calidad de los datos y garantiza que los datos utilizados para desarrollar y operar el sistema los cumplan. La guía señala que la calidad tiene un impacto significativo en la validez de los resultados del sistema, que para el aprendizaje supervisado y semisupervisado es importante que la calidad de los conjuntos de entrenamiento, validación, prueba y producción se defina, mida y mejore en la medida de lo posible, y que la organización debe considerar **qué hace el sesgo al rendimiento y la equidad del sistema** y ajustar el modelo y los datos según sea necesario para el caso de uso.

**live pt-BR**  —  **[Qualidade]{glossary="data-quality"}.** A organização define e documenta os requisitos de qualidade dos dados e garante que os dados utilizados para desenvolver e operar o sistema os atendam. As diretrizes observam que a qualidade tem impacto significativo na validade dos resultados do sistema, que para aprendizado supervisionado e semissupervisionado é importante que a qualidade dos conjuntos de treinamento, validação, teste e produção seja definida, medida e aprimorada na medida do possível, e que a organização deve considerar **o que o viés causa ao desempenho e à equidade do sistema** e ajustar o modelo e os dados conforme necessário para o caso de uso.

### run 13w, coverage 1

| | |
|---|---|
| **EN before** | that the organization should consider **the impact of bias on system performance and |
| **EN after** | that the organization should weigh **what bias does to system performance and |

**live es-419**  —  **[Calidad]{glossary="data-quality"}.** La organización define y documenta los requisitos de calidad de los datos y garantiza que los datos utilizados para desarrollar y operar el sistema los cumplan. La guía señala que la calidad tiene un impacto significativo en la validez de los resultados del sistema, que para el aprendizaje supervisado y semisupervisado es importante que la calidad de los conjuntos de entrenamiento, validación, prueba y producción se defina, mida y mejore en la medida de lo posible, y que la organización debe considerar **qué hace el sesgo al rendimiento y la equidad del sistema** y ajustar el modelo y los datos según sea necesario para el caso de uso.

**live pt-BR**  —  **[Qualidade]{glossary="data-quality"}.** A organização define e documenta os requisitos de qualidade dos dados e garante que os dados utilizados para desenvolver e operar o sistema os atendam. As diretrizes observam que a qualidade tem impacto significativo na validade dos resultados do sistema, que para aprendizado supervisionado e semissupervisionado é importante que a qualidade dos conjuntos de treinamento, validação, teste e produção seja definida, medida e aprimorada na medida do possível, e que a organização deve considerar **o que o viés causa ao desempenho e à equidade do sistema** e ajustar o modelo e os dados conforme necessário para o caso de uso.

## 03-07-what-carries-over-from-an-isms

`42001 Annex D.2`  —  3 span(s)  —  _3 runs, all three already recast elsewhere_

### run 14w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | integration of the AI management system with generic or sector-specific management system standards |
| **EN after** | bringing the AI management system together with generic or sector-specific standards |

**live es-419**  —  ::concept title="Lo que la norma realmente avala" El Anexo D.2 no solo permite la integración. Establece que reunir el sistema de gestión de IA junto con normas genéricas o sectoriales es **esencial** para desarrollar y utilizar un sistema de IA de manera responsable, y nombra a ISO/IEC 27001 como la primera norma con la que integrarse.

**live pt-BR**  —  ::concept title="O que a norma realmente endossa" O Anexo D.2 não apenas permite a integração. Ele afirma que reunir o sistema de gestão de IA com normas genéricas ou específicas de setor é **essencial** para o desenvolvimento e uso responsável de um sistema de IA, e nomeia a ISO/IEC 27001 como a primeira norma com a qual integrar.

### run 11w, coverage 1

| | |
|---|---|
| **EN before** | **essential** for responsible development and use of an AI system, and |
| **EN after** | **essential** to developing and using an AI system responsibly, and |

**live es-419**  —  ::concept title="Lo que la norma realmente avala" El Anexo D.2 no solo permite la integración. Establece que reunir el sistema de gestión de IA junto con normas genéricas o sectoriales es **esencial** para desarrollar y utilizar un sistema de IA de manera responsable, y nombra a ISO/IEC 27001 como la primera norma con la que integrarse.

**live pt-BR**  —  ::concept title="O que a norma realmente endossa" O Anexo D.2 não apenas permite a integração. Ele afirma que reunir o sistema de gestão de IA com normas genéricas ou específicas de setor é **essencial** para o desenvolvimento e uso responsável de um sistema de IA, e nomeia a ISO/IEC 27001 como a primeira norma com a qual integrar.

### run 12w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | be aware of unique requirements related to AI systems or individual components |
| **EN after** | stay alert to requirements unique to AI systems or to individual components |

**live es-419**  —  ::checkpoint [ { "id": "q1", "question": "Una organización reutiliza sin cambios su marco de competencias del SGSI para su sistema de gestión de IA. ¿En qué categoría cae realmente la competencia?", "type": "single_choice", "options": [ { "id": "a", "text": "Se extiende sin cambios, ya que el apartado 7.2 es idéntico en ambas normas" }, { "id": "b", "text": "Debe construirse desde cero, porque la competencia requerida es un cuerpo de conocimiento diferente" }, { "id": "c", "text": "Se extiende con modificaciones, ya que solo cambia el formato de la evidencia" }, { "id": "d", "text": "Queda fuera del sistema de gestión de IA cuando ya existe un SGSI certificado" } ], "correct": ["b"], "explanation": "El apartado es idéntico; la competencia no lo es. Los registros de competencia en seguridad evidencian conocimiento en seguridad. La guía de esta norma nombra científicos de datos, roles de supervisión, especialistas en confiabilidad y expertos en el dominio — ninguno de los cuales fue diseñado para ser evaluado por un marco de SGSI.", "concept_slugs": ["competence-does-not-carry"], "bloom_level": "4_analyze", "difficulty": 3 }, { "id": "q2", "question": "¿Qué dice específicamente el Anexo D.2 sobre ISO/IEC 27001 y la implementación de controles?", "type": "single_choice", "options": [ { "id": "a", "text": "Que poseer la certificación 27001 satisface los requisitos de controles del sistema de gestión de IA" }, { "id": "b", "text": "Que los controles relacionados en parte con la seguridad de la información pueden implementarse a través de la implementación 27001 existente de la organización" }, { "id": "c", "text": "Que los dos conjuntos de controles tienen una correspondencia uno a uno" }, { "id": "d", "text": "Que los controles de IA tienen precedencia cuando los dos entran en conflicto" } ], "correct": ["b"], "explanation": "El anexo avala la integración a nivel de controles, con 'relacionados en parte con la seguridad de la información' como calificador. No dice que las certificaciones se transfieran, ni que los conjuntos de controles se correspondan — las dos estructuras del Anexo A están organizadas de manera diferente.", "concept_slugs": ["iso-42001-27001-integration"], "bloom_level": "4_analyze", "difficulty": 3 }, { "id": "q3", "question": "¿Por qué 'se hereda en forma pero no en contenido' es la categoría más peligrosa?", "type": "single_choice", "options": [ { "id": "a", "text": "Porque esos requisitos son opcionales en ISO/IEC 42001" }, { "id": "b", "text": "Porque el proceso existe, está documentado y se está siguiendo, por lo que nada parece incorrecto" }, { "id": "c", "text": "Porque los auditores no examinan el capítulo 8" }, { "id": "d", "text": "Porque esos procesos no pueden integrarse en absoluto" } ], "correct": ["b"], "explanation": "Todo es visible y correcto — el proceso existe, está documentado, se está siguiendo. Lo que nadie verificó es si sus supuestos siguen siendo válidos para lo que ahora gobierna. Esa es una pregunta diferente a si se está siguiendo, y ninguna verificación ordinaria de conformidad la plantea.", "concept_slugs": ["carry-over-limits", "shared-clause-seven-eight"], "bloom_level": "4_analyze", "difficulty": 3 }, { "id": "q4", "question": "¿Qué dice la guía sobre la integración de la respuesta a incidentes de IA en la gestión de incidentes más amplia?", "type": "single_choice", "options": [ { "id": "a", "text": "Que los incidentes de IA requieren un proceso completamente separado" }, { "id": "b", "text": "Que la integración está permitida, siendo consciente de los requisitos únicos relacionados con los sistemas de IA o sus componentes" }, { "id": "c", "text": "Que los incidentes de IA se gestionan bajo ISO/IEC 27001 en lugar de esta norma" }, { "id": "d", "text": "Que la respuesta a incidentes está fuera del alcance de un sistema de gestión de IA" } ], "correct": ["b"], "explanation": "La guía permite la integración y la califica — ser consciente de los requisitos únicos relacionados con los sistemas de IA o sus componentes individuales, poniendo como ejemplo que una brecha de información personal en datos de entrenamiento puede conllevar requisitos de notificación diferentes. Integrar, y ser consciente de lo que es diferente.", "concept_slugs": ["carry-over-limits"], "bloom_level": "4_analyze", "difficulty": 3 } ] ::

**live pt-BR**  —  ::checkpoint [ { "id": "q1", "question": "Uma organização reutiliza seu framework de competência do SGSI sem alterações para seu sistema de gestão de IA. Em qual categoria a competência realmente se enquadra?", "type": "single_choice", "options": [ { "id": "a", "text": "Aproveita sem alteração, pois a Seção 7.2 é idêntica em ambas as normas" }, { "id": "b", "text": "Deve ser construída do zero, porque a competência exigida é um corpo de conhecimento diferente" }, { "id": "c", "text": "Aproveita com modificação, pois apenas o formato das evidências muda" }, { "id": "d", "text": "Está fora do escopo do sistema de gestão de IA quando um SGSI já está certificado" } ], "correct": ["b"], "explanation": "A seção é idêntica; a competência não é. Os registros de competência em segurança evidenciam conhecimento em segurança. O guia desta norma nomeia cientistas de dados, funções de supervisão, especialistas em confiabilidade e especialistas de domínio — nenhum dos quais um framework de SGSI foi construído para avaliar.", "concept_slugs": ["competence-does-not-carry"], "bloom_level": "4_analyze", "difficulty": 3 }, { "id": "q2", "question": "O que o Anexo D.2 afirma especificamente sobre a ISO/IEC 27001 e a implementação de controles?", "type": "single_choice", "options": [ { "id": "a", "text": "Que a certificação 27001 satisfaz os requisitos de controle do sistema de gestão de IA" }, { "id": "b", "text": "Que os controles parcialmente relacionados à segurança da informação podem ser implementados por meio da implementação 27001 existente da organização" }, { "id": "c", "text": "Que os dois conjuntos de controles se mapeiam um a um" }, { "id": "d", "text": "Que os controles de IA têm precedência onde os dois conflitam" } ], "correct": ["b"], "explanation": "O anexo endossa a integração no nível de controles, com 'parcialmente relacionados à segurança da informação' como qualificador. Ele não afirma que as certificações se transferem, nem que os conjuntos de controles se mapeiam — as duas estruturas do Anexo A são organizadas de forma diferente.", "concept_slugs": ["iso-42001-27001-integration"], "bloom_level": "4_analyze", "difficulty": 3 }, { "id": "q3", "question": "Por que 'aproveita a forma, mas não o conteúdo' é a categoria mais perigosa?", "type": "single_choice", "options": [ { "id": "a", "text": "Porque esses requisitos são opcionais na ISO/IEC 42001" }, { "id": "b", "text": "Porque o processo existe, está documentado e está sendo seguido, portanto nada parece errado" }, { "id": "c", "text": "Porque os auditores não examinam a Seção 8" }, { "id": "d", "text": "Porque esses processos não podem ser integrados de forma alguma" } ], "correct": ["b"], "explanation": "Tudo é visível e correto — o processo existe, está documentado, está sendo seguido. O que ninguém verificou é se suas premissas ainda se sustentam para o que agora governa. Essa é uma pergunta diferente de saber se ele está sendo seguido, e nenhuma verificação de conformidade ordinária a faz.", "concept_slugs": ["carry-over-limits", "shared-clause-seven-eight"], "bloom_level": "4_analyze", "difficulty": 3 }, { "id": "q4", "question": "O que o guia afirma sobre a integração da resposta a incidentes de IA na gestão de incidentes mais ampla?", "type": "single_choice", "options": [ { "id": "a", "text": "Que incidentes de IA exigem um processo totalmente separado" }, { "id": "b", "text": "Que a integração é permitida, estando ciente dos requisitos exclusivos relacionados aos sistemas de IA ou seus componentes" }, { "id": "c", "text": "Que incidentes de IA são tratados sob a ISO/IEC 27001 em vez desta norma" }, { "id": "d", "text": "Que a resposta a incidentes está fora do escopo de um sistema de gestão de IA" } ], "correct": ["b"], "explanation": "O guia permite a integração e a qualifica — esteja ciente dos requisitos exclusivos relacionados aos sistemas de IA ou componentes individuais, dando como exemplo que uma violação de informações pessoais em dados de treinamento pode ter requisitos de notificação diferentes. Integre e esteja ciente do que é diferente.", "concept_slugs": ["carry-over-limits"], "bloom_level": "4_analyze", "difficulty": 3 } ] ::

## 03-08-clause-8-operational-duties

`42001 clause 8.4`  —  1 span(s)  —  _the same recast as tasks.knowledge 3.8 span 2_

### run 14w, coverage 0.74

| | |
|---|---|
| **EN before** | Performed in accordance with clause 6.1.4, at planned intervals or when significant changes are proposed to occur. |
| **EN after** | Performed in accordance with clause 6.1.4, on the same trigger as the risk assessment: planned intervals, plus any significant change that is proposed. |

**live es-419**  —  **Apartado 8.4 — Evaluación de impacto del sistema de IA.** Se realiza de acuerdo con el apartado 6.1.4, con los mismos desencadenantes que la evaluación de riesgos: intervalos planificados, más cualquier cambio significativo que se proponga. Se conserva información documentada sobre los resultados de todas las evaluaciones de impacto.

**live pt-BR**  —  **Cláusula 8.4 — Avaliação de impacto do sistema de IA.** Realizada em conformidade com a cláusula 6.1.4, com o mesmo gatilho que a avaliação de riscos: intervalos planejados, além de qualquer mudança significativa que seja proposta. A informação documentada sobre os resultados de todas as avaliações de impacto é retida.

## 04-01-annex-a-structure

`42001 Annex A intro, Annex B general clause`  —  3 span(s)  —  _3 runs; two reuse blueprint 4.1's recasts_

### run 17w, coverage 0.77

| | |
|---|---|
| **EN before** | provides a reference set of controls for meeting organizational objectives and addressing risks related to the design and operation of AI systems |
| **EN after** | provides a reference set of controls that serve organizational objectives and address the risks arising in how AI systems are designed and run |

**live es-419**  —  ::concept title="La forma del anexo" [El Anexo A]{glossary="annex-a-structure"} es normativo y proporciona un conjunto de referencia de controles que sirven a los objetivos organizacionales y abordan los riesgos que surgen en la forma en que los sistemas de IA son diseñados y operados.

**live pt-BR**  —  ::concept title="A forma do anexo" O [Anexo A]{glossary="annex-a-structure"} é normativo e fornece um conjunto de referência de controles que atendem aos objetivos organizacionais e tratam os riscos decorrentes da forma como os sistemas de IA são projetados e operados.

### run 12w, coverage 0.6

| | |
|---|---|
| **EN before** | organizations **do not have to document or justify inclusion or exclusion of the implementation guidance** in the Statement of Applicability |
| **EN after** | an organization is **not required to document or justify which parts of that guidance it adopted** in the Statement of Applicability |

**live es-419**  —  Lo que genera confusión es una sutileza genuina. El apartado general del Anexo B establece que las organizaciones **no tienen que documentar ni justificar la inclusión o exclusión de la orientación para la implementación** en la Declaración de Aplicabilidad. Por lo tanto, la orientación en sí no está sujeta a la disciplina de la Declaración de Aplicabilidad que aplica a los controles.

**live pt-BR**  —  O que confunde as pessoas é uma sutileza genuína. A seção geral do Anexo B estabelece que as organizações **não precisam documentar nem justificar a inclusão ou exclusão das orientações de implementação** na Declaração de Aplicabilidade. Portanto, as orientações em si não estão sujeitas à disciplina da Declaração de Aplicabilidade que se aplica aos controles.

### run 12w, coverage 0.52

| | |
|---|---|
| **EN before** | **Not all the control objectives and controls listed are required to be used**, and the organization can design and implement its own controls. |
| **EN after** | **Not every listed control objective and control must be used**, and an organization may design and implement its own. |

**live es-419**  —  **No es necesario utilizar todos los objetivos de control y controles listados**, y una organización puede diseñar e implementar los propios.

**live pt-BR**  —  **Não é necessário utilizar todos os objetivos de controle e controles listados**, e uma organização pode projetar e implementar os seus próprios.

## 04-02-annex-a-and-the-soa

`42001 Annex A note and SoA justifications`  —  2 span(s)  —  _second span is inside a ::checkpoint explanation_

### run 12w, coverage 0.71

| | |
|---|---|
| **EN before** | organizations may not require all the controls listed in Annex A, **or may even exceed the list** |
| **EN after** | an organization may need only some of the Annex A controls, **or may go beyond the list** |

**live es-419**  —  ::deep-dive title="Ir más allá de la lista" La primera nota de la definición indica que una organización puede necesitar solo algunos de los controles del Anexo A, **o puede ir más allá de la lista** con controles adicionales establecidos por la propia organización.

**live pt-BR**  —  ::deep-dive title="Ir além da lista" A primeira nota da definição diz que uma organização pode precisar apenas de alguns dos controles do Anexo A, **ou pode ir além da lista** com controles adicionais estabelecidos pela própria organização.

### run 20w, coverage 0.91

| | |
|---|---|
| **EN before** | for excluding control objectives in general or for specific AI systems, whether those listed in Annex A or established by the organization. |
| **EN after** | for excluding control objectives across the board or for particular AI systems, whether they come from Annex A or from the organization itself. |

**live es-419**  —  ::checkpoint [ { "id": "q1", "question": "¿Qué debe reflejar la Declaración de Aplicabilidad, más allá de los controles necesarios?", "type": "single_choice", "options": [ { "id": "a", "text": "El estado de implementación de cada control" }, { "id": "b", "text": "Todos los riesgos identificados y las medidas de gestión del riesgo establecidas para abordarlos" }, { "id": "c", "text": "Los hallazgos de auditoría del organismo de certificación" }, { "id": "d", "text": "Los objetivos de IA del apartado 6.2" } ], "correct": ["b"], "explanation": "Esa nota es lo que convierte al documento en un registro de razonamiento en lugar de un registro de controles. El estado se registra habitualmente y es útil, pero no es lo que la norma requiere que refleje la Declaración de Aplicabilidad.", "concept_slugs": ["statement-of-applicability"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q2", "question": "Un control del Anexo A no aparece en ningún lugar de la Declaración de Aplicabilidad de una organización. ¿Cuál es la situación?", "type": "single_choice", "options": [ { "id": "a", "text": "Aceptable, ya que evidentemente el control no era necesario" }, { "id": "b", "text": "Cada control debe ser abordado: incluido con justificación o excluido con justificación" }, { "id": "c", "text": "Aceptable, siempre que la evaluación del riesgo no haya identificado ningún riesgo relevante" }, { "id": "d", "text": "Aceptable si la organización documentó controles adicionales en su lugar" } ], "correct": ["b"], "explanation": "La ausencia no es ni inclusión ni exclusión. Incluso cuando la evaluación del riesgo no identificó nada relevante, ese razonamiento es la justificación de exclusión y pertenece al documento. Agregar otros controles no exime de la obligación de abordar el anexo.", "concept_slugs": ["soa-completeness"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q3", "question": "¿Qué alcance de exclusión permite explícitamente la norma?", "type": "single_choice", "options": [ { "id": "a", "text": "Exclusión de objetivos de control en general, o para sistemas de IA específicos" }, { "id": "b", "text": "Exclusión solo de controles individuales, nunca de objetivos completos" }, { "id": "c", "text": "Exclusión solo cuando el organismo de certificación lo aprueba de antemano" }, { "id": "d", "text": "Exclusión solo para sistemas fuera del alcance del sistema de gestión de IA" } ], "correct": ["a"], "explanation": "Las notas permiten justificaciones documentadas para excluir objetivos de control en general o para sistemas de IA específicos, ya sean los listados en el Anexo A o los establecidos por la organización. Por lo tanto, la exclusión puede tener un alcance definido por sistema en lugar de forzar una respuesta de todo o nada.", "concept_slugs": ["soa-annex-a-relationship"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q4", "question": "La Declaración de Aplicabilidad de una organización contiene exactamente los 38 controles del Anexo A y ninguno más. ¿Qué indica esto con mayor probabilidad?", "type": "single_choice", "options": [ { "id": "a", "text": "Una implementación exhaustiva, ya que se abordó cada control" }, { "id": "b", "text": "Que el anexo se utilizó como punto de partida en lugar de como comparación frente a los controles determinados" }, { "id": "c", "text": "Una no conformidad, ya que los controles adicionales son obligatorios" }, { "id": "d", "text": "Que la evaluación del riesgo de la organización identificó exactamente 38 riesgos" } ], "correct": ["b"], "explanation": "Es posible para un entorno simple e inusual para uno complejo. El anexo es ampliamente aplicable en distintos sectores, por lo que una organización específica frecuentemente tendrá riesgos que no alcanza a cubrir. Los controles adicionales están permitidos, no son obligatorios: la señal tiene que ver con el orden en que se realizó el trabajo.", "concept_slugs": ["exceeding-annex-a"], "bloom_level": "2_understand", "difficulty": 3 } ] ::

**live pt-BR**  —  ::checkpoint [ { "id": "q1", "question": "O que a Declaração de Aplicabilidade deve refletir, além dos controles necessários?", "type": "single_choice", "options": [ { "id": "a", "text": "O status de implementação de cada controle" }, { "id": "b", "text": "Todos os riscos identificados e as medidas de gestão de riscos estabelecidas para tratá-los" }, { "id": "c", "text": "As constatações de auditoria do organismo de certificação" }, { "id": "d", "text": "Os objetivos de IA da Seção 6.2" } ], "correct": ["b"], "explanation": "Essa nota é o que torna o documento um registro de raciocínio em vez de um registro de controles. O status é comumente registrado e é útil, mas não é o que a norma exige que a Declaração de Aplicabilidade reflita.", "concept_slugs": ["statement-of-applicability"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q2", "question": "Um controle do Anexo A não aparece em nenhum lugar na Declaração de Aplicabilidade de uma organização. Qual é a situação?", "type": "single_choice", "options": [ { "id": "a", "text": "Aceitável, pois o controle evidentemente não era necessário" }, { "id": "b", "text": "Todo controle deve ser tratado — incluído com justificativa ou excluído com justificativa" }, { "id": "c", "text": "Aceitável, desde que o processo de avaliação de riscos não tenha identificado nenhum risco relevante" }, { "id": "d", "text": "Aceitável se a organização tiver documentado controles adicionais em seu lugar" } ], "correct": ["b"], "explanation": "Ausência não é nem inclusão nem exclusão. Mesmo quando o processo de avaliação de riscos não identificou nada relevante, esse raciocínio é a justificativa de exclusão e pertence ao documento. Adicionar outros controles não cumpre a obrigação de tratar o anexo.", "concept_slugs": ["soa-completeness"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q3", "question": "Qual escopo de exclusão a norma permite explicitamente?", "type": "single_choice", "options": [ { "id": "a", "text": "Exclusão de objetivos de controle em geral, ou para sistemas de IA específicos" }, { "id": "b", "text": "Exclusão apenas de controles individuais, nunca de objetivos inteiros" }, { "id": "c", "text": "Exclusão apenas quando o organismo de certificação concordar antecipadamente" }, { "id": "d", "text": "Exclusão apenas para sistemas fora do escopo do sistema de gestão de IA" } ], "correct": ["a"], "explanation": "As notas permitem justificativas documentadas para excluir objetivos de controle em geral ou para sistemas de IA específicos, sejam aqueles listados no Anexo A ou estabelecidos pela organização. Portanto, a exclusão pode ter escopo definido por sistema, em vez de ser forçada a uma resposta de tudo ou nada.", "concept_slugs": ["soa-annex-a-relationship"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q4", "question": "A Declaração de Aplicabilidade de uma organização contém exatamente os 38 controles do Anexo A e nenhum outro. O que isso mais provavelmente indica?", "type": "single_choice", "options": [ { "id": "a", "text": "Uma implementação completa, pois todos os controles foram tratados" }, { "id": "b", "text": "Que o anexo foi usado como ponto de partida em vez de como comparação em relação aos controles determinados" }, { "id": "c", "text": "Uma não conformidade, pois controles adicionais são obrigatórios" }, { "id": "d", "text": "Que o processo de avaliação de riscos da organização identificou exatamente 38 riscos" } ], "correct": ["b"], "explanation": "É possível para um conjunto simples e incomum para um complexo. O anexo é amplamente aplicável em setores, portanto uma organização específica frequentemente terá riscos que ele não alcança. Controles adicionais são permitidos, não obrigatórios — o sinal diz respeito à ordem em que o trabalho foi realizado.", "concept_slugs": ["exceeding-annex-a"], "bloom_level": "2_understand", "difficulty": 3 } ] ::

## 04-03-governing-apparatus-controls

`42001 A.2, A.3.3`  —  3 span(s)  —  _3 runs, two of them already recast in module 3_

### run 10w, coverage 0.91

| | |
|---|---|
| **EN before** | **Documenting a policy** for the development or use of AI systems. |
| **EN after** | **Documenting a policy** covering how AI systems get developed or used. |

**live es-419**  —  **Documentar una política** que contemple cómo se desarrollan o utilizan los sistemas de IA. Este es el complemento del Anexo A a la cláusula 5.2, y la guía agrega lo que la cláusula no incluye: la política debe estar informada por la estrategia de negocio, por los valores y la cultura organizacional, por la cantidad de riesgo que la organización está dispuesta a asumir, por el nivel de riesgo que los propios sistemas representan, por los requisitos legales incluidos los contratos, y por el impacto en las partes interesadas relevantes.

**live pt-BR**  —  **Documentar uma política** que abranja como os sistemas de IA são desenvolvidos ou utilizados. Este é o complemento do Anexo A à cláusula 5.2, e a orientação acrescenta o que a cláusula não diz: a política deve ser informada pela estratégia de negócios, pelos valores e pela cultura organizacional, pelo nível de risco que a organização está disposta a assumir, pelo nível de risco que os próprios sistemas representam, pelos requisitos legais incluindo contratos, e pelo impacto sobre as partes interessadas relevantes.

### run 14w, coverage 0.88

| | |
|---|---|
| **EN before** | by organizational values and culture and the amount of risk the organization is willing to carry |
| **EN after** | by organizational values and culture, by how much risk the organization is prepared to carry |

**live es-419**  —  **Documentar una política** que contemple cómo se desarrollan o utilizan los sistemas de IA. Este es el complemento del Anexo A a la cláusula 5.2, y la guía agrega lo que la cláusula no incluye: la política debe estar informada por la estrategia de negocio, por los valores y la cultura organizacional, por la cantidad de riesgo que la organización está dispuesta a asumir, por el nivel de riesgo que los propios sistemas representan, por los requisitos legales incluidos los contratos, y por el impacto en las partes interesadas relevantes.

**live pt-BR**  —  **Documentar uma política** que abranja como os sistemas de IA são desenvolvidos ou utilizados. Este é o complemento do Anexo A à cláusula 5.2, e a orientação acrescenta o que a cláusula não diz: a política deve ser informada pela estratégia de negócios, pelos valores e pela cultura organizacional, pelo nível de risco que a organização está disposta a assumir, pelo nível de risco que os próprios sistemas representam, pelos requisitos legais incluindo contratos, e pelo impacto sobre as partes interessadas relevantes.

### run 17w, coverage 0.81

| | |
|---|---|
| **EN before** | a process for people to report concerns about the organization's role with respect to an AI system, throughout its life cycle. |
| **EN after** | a route for people to raise concerns about whatever role the organization holds around an AI system, at any point in its life. |

**live es-419**  —  **[Reporte de inquietudes]{glossary="reporting-of-concerns"}.** La organización define e implementa un canal para que las personas planteen inquietudes sobre cualquier rol que la organización desempeñe en relación con un sistema de IA, en cualquier momento de su ciclo de vida.

**live pt-BR**  —  **[Reporte de preocupações]{glossary="reporting-of-concerns"}.** A organização define e implementa um canal para que as pessoas possam levantar preocupações sobre qualquer papel que a organização desempenhe em relação a um sistema de IA, em qualquer momento de seu ciclo de vida.

## 04-04-impact-and-life-cycle-controls

`42001 A.5, A.6`  —  3 span(s)  —  _3 runs; the event-log one is the `should` that must stay a `should`_

### run 12w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | **Establish a process** to assess the potential consequences for individuals or groups |
| **EN after** | **Establish a process** for working out what a system could do to individuals or to groups |

**live es-419**  —  **Establecer un proceso** para determinar qué podría hacerle un sistema a individuos o a grupos, y a las sociedades, como resultado del sistema de IA a lo largo de su ciclo de vida.

**live pt-BR**  —  **Estabelecer um processo** para determinar o que um sistema poderia fazer a indivíduos ou a grupos, e a sociedades, que pode resultar do sistema de IA ao longo de seu ciclo de vida.

### run 12w, coverage 0.86

| | |
|---|---|
| **EN before** | **Documentation of design and development**, based on organizational objectives, documented requirements and specification criteria. |
| **EN after** | **Documentation of design and development**, grounded in organizational objectives, the documented requirements and the specification criteria. |

**live es-419**  —  **Documentación del diseño y desarrollo**, fundamentada en los objetivos organizacionales, los requisitos documentados y los criterios de especificación.

**live pt-BR**  —  **Documentação do design e desenvolvimento**, fundamentada nos objetivos organizacionais, nos requisitos documentados e nos critérios de especificação.

### run 16w, coverage 1

| | |
|---|---|
| **EN before** | **determine at which phases of the life cycle record keeping of event logs should be enabled** |
| **EN after** | **determine at which life-cycle phases event logs should be kept** |

**live es-419**  —  ::callout type="pitfall" El [control de registro de eventos]{glossary="event-log-controls"} pide a la organización **determinar en qué fases del ciclo de vida deben conservarse los registros de eventos**, siendo el uso en producción el mínimo establecido. Se trata de un deber de determinación con un umbral mínimo, no de un mandato de registro indiscriminado. Una organización que registra todo no lo ha satisfecho mejor que una que no registra nada — el requisito es que se haya tomado una decisión, por fase, y que pueda explicarse. ::

**live pt-BR**  —  ::callout type="pitfall" O [controle de registro de eventos]{glossary="event-log-controls"} pede que a organização **determine em quais fases do ciclo de vida os registros de eventos devem ser mantidos**, sendo o uso em operação o mínimo declarado. Trata-se de um dever de determinação com um piso, não de um mandato de registro irrestrito. Uma organização que registra tudo não satisfaz esse requisito mais do que uma que não registra nada — o que se exige é que uma decisão tenha sido tomada, por fase, e possa ser explicada. ::

## 04-05-data-and-information-controls

`42001 A.7, A.8`  —  8 span(s)  —  _EIGHT runs -- the densest lesson in the module, because A.7 and A.8 are both enumerations_

### run 13w, coverage 0.65

| | |
|---|---|
| **EN before** | whose objective is that the organization understands the role and impacts of data in AI systems across their life cycles |
| **EN after** | whose objective is that the organization grasps what data does, and does to people, across its AI systems and their life cycles |

**live es-419**  —  ::concept title="Cinco controles de datos" La lección 3.6 cubrió el contenido; aquí se presenta la estructura. La categoría A.7 contiene cinco [controles de datos]{glossary="data-controls"} cuyo objetivo es que la organización comprenda qué hacen los datos, y qué hacen a las personas, en sus sistemas de IA y a lo largo de sus ciclos de vida.

**live pt-BR**  —  ::concept title="Cinco controles de dados" A Lição 3.6 cobriu a substância; aqui está a forma. A categoria A.7 contém cinco [controles de dados]{glossary="data-controls"} cujo objetivo é que a organização compreenda o que os dados fazem, e fazem às pessoas, nos seus sistemas de IA e em seus ciclos de vida.

### run 10w, coverage 0.77

| | |
|---|---|
| **EN before** | determining and documenting details about the acquisition and selection of the data used |
| **EN after** | settling and recording how the data it uses was acquired and chosen |

**live es-419**  —  **Adquisición de datos** — establecer y registrar cómo se adquirieron y seleccionaron los datos que utiliza.

**live pt-BR**  —  **Aquisição de dados** — estabelecer e registrar como os dados utilizados foram adquiridos e escolhidos.

### run 13w, coverage 0.76

| | |
|---|---|
| **EN before** | the information they need to understand and assess the risks and their impacts, **both positive and negative.** |
| **EN after** | the information they need to grasp and weigh the risks and what those risks do, **good and bad alike.** |

**live es-419**  —  ::concept title="Cuatro controles de información" El objetivo de la categoría A.8 es que las partes interesadas relevantes tengan la información que necesitan para comprender y sopesar los riesgos y lo que esos riesgos implican, **tanto los buenos como los malos.**

**live pt-BR**  —  ::concept title="Quatro controles de informação" O objetivo da categoria A.8 é que as partes interessadas relevantes tenham as informações de que precisam para compreender e avaliar os riscos e o que esses riscos fazem, **tanto os bons quanto os ruins.**

### run 13w, coverage 0.93

| | |
|---|---|
| **EN before** | **that the user is interacting with an AI system**; how to interact with it |
| **EN after** | **that they are dealing with an AI system at all**; how to work with it |

**live es-419**  —  **[Documentación del sistema e información para los usuarios]{glossary="information-for-users"}.** La lista de la guía es extensa y gran parte de ella se corresponde con las expectativas regulatorias: el propósito del sistema; **que están interactuando con un sistema de IA en absoluto**; cómo trabajar con él y cómo anularlo; requisitos técnicos, limitaciones y vida útil esperada; necesidades de supervisión; exactitud y rendimiento; hallazgos relevantes de la evaluación de impacto, incluidos beneficios y daños en contextos específicos o grupos demográficos; revisiones a las afirmaciones de beneficios; actualizaciones y mantenimiento; información de contacto; y materiales educativos.

**live pt-BR**  —  **[Documentação do sistema e informações para usuários]{glossary="information-for-users"}.** A lista do guia é longa e grande parte dela corresponde às expectativas regulatórias: a finalidade do sistema; **que estão interagindo com um sistema de IA**; como interagir com ele e como substituí-lo; requisitos técnicos, limitações e vida útil esperada; necessidades de supervisão; precisão e desempenho; resultados relevantes de avaliação de impacto, incluindo benefícios e danos em contextos específicos ou grupos demográficos; revisões de alegações de benefícios; atualizações e manutenção; informações de contato; e materiais educacionais.

### run 11w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | Capabilities for interested parties to report adverse impacts of the system. |
| **EN after** | Ways for interested parties to flag harm the system has done. |

**live es-419**  —  **[Reporte externo]{glossary="external-reporting-control"}.** Formas para que las partes interesadas señalen el daño que el sistema ha causado. Nótese el destinatario: partes interesadas, no solo usuarios. El punto de la lección 2.1 sobre los sujetos de la IA aplica aquí: una persona sobre la que el sistema actuó puede no tener cuenta, contrato ni una forma obvia de comunicarse con la organización.

**live pt-BR**  —  **[Reporte externo]{glossary="external-reporting-control"}.** Formas para que partes interessadas sinalizem danos causados pelo sistema. Observe o público — partes interessadas, não apenas usuários. O ponto da Lição 2.1 sobre sujeitos de IA se aplica aqui: uma pessoa sobre a qual o sistema agiu pode não ter conta, contrato ou forma óbvia de contatar a organização.

### run 11w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | the timeline for notification, whether and which authorities must be notified |
| **EN after** | how quickly notification must happen, and which authorities if any must hear of it |

**live es-419**  —  Los requisitos legales y la actividad regulatoria pueden especificar los tipos de incidentes que deben comunicarse, con qué rapidez debe producirse la notificación, qué autoridades, si las hay, deben ser informadas, y los detalles requeridos.

**live pt-BR**  —  Requisitos legais e atividade regulatória podem especificar os tipos de incidente que devem ser comunicados, com que rapidez a notificação deve ocorrer, quais autoridades, se houver, devem ser informadas e os detalhes exigidos.

### run 15w, coverage 0.83

| | |
|---|---|
| **EN before** | incident management activities, **but should be aware of unique requirements** related to AI systems or their individual components |
| **EN after** | incident management activities, **but should stay alert to requirements unique** to AI systems or to their individual components |

**live es-419**  —  Y la guía práctica: la organización puede integrar la respuesta a incidentes de IA en sus actividades más amplias de gestión de incidentes, **pero debe mantenerse alerta a los requisitos únicos** de los sistemas de IA o de sus componentes individuales — el ejemplo dado es una filtración de información personal en datos de entrenamiento, que puede conllevar requisitos de reporte de privacidad diferentes a los de una filtración en otro contexto.

**live pt-BR**  —  E o guia prático: a organização pode integrar a resposta a incidentes de IA em suas atividades mais amplas de gestão de incidentes, **mas deve permanecer atenta aos requisitos exclusivos** de sistemas de IA ou de seus componentes individuais — o exemplo dado é uma violação de informações pessoais em dados de treinamento, que pode ter requisitos de reporte de privacidade diferentes de uma violação em outro contexto.

### run 11w, coverage 0.92

| | |
|---|---|
| **EN before** | although AI systems can be complex, it is critical that users understand |
| **EN after** | AI systems may be complex, but it matters greatly that users understand |

**live es-419**  —  El propio enfoque de la guía es que los sistemas de IA pueden ser complejos, pero importa enormemente que los usuarios comprendan cuándo están interactuando con uno, cómo funciona, su propósito e usos previstos, y su potencial de causar daño o beneficio. **La comprensibilidad es el objetivo, y la guía señala que la organización debería entender qué significa la comprensibilidad para cada parte interesada** — lo cual es un estándar más exigente que la exhaustividad, y uno mejor. ::

**live pt-BR**  —  O próprio enquadramento do guia é que os sistemas de IA podem ser complexos, mas é fundamental que os usuários entendam quando estão interagindo com um, como ele funciona, sua finalidade e usos pretendidos e seu potencial de causar danos ou benefícios. **A compreensibilidade é o objetivo, e o guia afirma que a organização deve entender o que compreensibilidade significa para cada parte interessada** — o que é um padrão mais exigente do que completude, e melhor. ::

## 04-06-use-and-third-party-controls

`42001 A.9, A.10`  —  5 span(s)  —  _6 runs in 5 spans -- two of them sit in ONE sentence and are repaired together_

### run 13w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | fairness, accountability, transparency, explainability, reliability, safety, robustness and redundancy, privacy and security, accessibility |
| **EN after** | fairness, accountability, transparency and explainability, reliability, safety, robustness, redundancy, privacy, security and accessibility |

**live es-419**  —  ::callout type="pitfall" El vocabulario familiar de IA responsable — equidad, responsabilidad, transparencia y explicabilidad, confiabilidad, seguridad, robustez, redundancia, privacidad, seguridad y accesibilidad — se encuentra en la **orientación** del control de objetivos de uso responsable, presentado como ejemplos que una organización podría identificar. El Anexo B es normativo, por lo que no es lectura opcional. Pero *debería* y *algunos objetivos incluyen* no equivalen a *debe* y *debe comprender*. Enseñar esa lista como un conjunto requerido exagera lo que dice la norma. ::

**live pt-BR**  —  ::callout type="pitfall" O vocabulário familiar de IA responsável — justiça, responsabilização, transparência e explicabilidade, confiabilidade, segurança, robustez e redundância, privacidade e segurança, acessibilidade — está na **orientação** do controle de objetivos de uso responsável, apresentado como exemplos que uma organização pode identificar. O Anexo B é normativo, portanto não é leitura opcional. Mas *deve* e *alguns objetivos incluem* não são *deve obrigatoriamente* e *deve compreender*. Ensinar essa lista como um conjunto obrigatório exagera o que a norma estabelece. ::

### run 12w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | **including having authority to override decisions made by the AI system**. Ensuring |
| **EN after** | **including the authority to overturn what the AI system decided**. Ensuring |

**live es-419**  —  Involucrar a revisores humanos para verificar los resultados del sistema, **incluyendo la autoridad para anular lo que el sistema de IA decidió**. Garantizar que la supervisión se incluya donde sea necesaria para un uso aceptable según las instrucciones o documentación del sistema. Monitorear el rendimiento, incluida la precisión de los resultados. Reportar preocupaciones sobre los resultados y su impacto en las partes interesadas pertinentes. Reportar preocupaciones sobre cambios en el rendimiento del sistema o su capacidad para producir resultados correctos con datos de producción. Y considerar si la toma de decisiones automatizada es apropiada para el uso previsto.

**live pt-BR**  —  Envolver revisores humanos para verificar as saídas do sistema, **incluindo a autoridade para substituir o que o sistema de IA decidiu**. Garantir que a supervisão seja incluída onde necessária para uso aceitável de acordo com as instruções ou documentação do sistema. Monitorar o desempenho, incluindo a precisão das saídas. Reportar preocupações sobre as saídas e seu impacto sobre as partes interessadas relevantes. Reportar preocupações sobre mudanças no desempenho do sistema ou em sua capacidade de produzir saídas corretas sobre dados de produção. E considerar se a tomada de decisão automatizada é adequada para o uso pretendido.

### run 14w, coverage 0.44

| | |
|---|---|
| **EN before** | Category A.10's objective is that the organization understands its responsibilities and remains accountable, and that risks are appropriately apportioned when third parties are involved at any stage of the life cycle. |
| **EN after** | Category A.10's objective is that the organization knows what it is responsible for and stays accountable, and that risk is shared out properly wherever third parties take part at any point in the life cycle. |

**live es-419**  —  ::concept title="Relaciones con terceros y clientes — tres controles" El objetivo de la categoría A.10 es que la organización sepa de qué es responsable y continúe siendo accountable, y que el riesgo se distribuya adecuadamente en todos los casos en que terceros participen en cualquier punto del ciclo de vida.

**live pt-BR**  —  ::concept title="Relacionamentos com terceiros e clientes — três controles" O objetivo da categoria A.10 é que a organização saiba pelo que é responsável e permaneça accountable, e que o risco seja adequadamente distribuído sempre que terceiros participem em qualquer ponto do ciclo de vida.

### run 13w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | responsibilities can be split between parties providing data, parties providing algorithms and models |
| **EN after** | responsibilities may be split between whoever supplies the data, whoever supplies algorithms and models |

**live es-419**  —  **Asignación de responsabilidades** en toda la organización, sus socios, proveedores, clientes y terceros. La orientación señala que las responsabilidades pueden dividirse entre quienes suministran los datos, quienes suministran los algoritmos y modelos, y las partes que desarrollan o utilizan el sistema mientras siguen siendo responsables ante las partes interesadas — y que la organización debe documentar todas las partes que intervienen en el ciclo de vida, sus roles y sus responsabilidades.

**live pt-BR**  —  **Alocação de responsabilidades** entre a organização, seus parceiros, fornecedores, clientes e terceiros. As notas de orientação observam que as responsabilidades podem ser divididas entre quem fornece os dados, quem fornece algoritmos e modelos, e as partes que desenvolvem ou utilizam o sistema enquanto permanecem responsáveis perante as partes interessadas — e que a organização deve documentar todas as partes que intervêm no ciclo de vida, seus papéis e suas responsabilidades.

### run 19w, coverage 0.86

| | |
|---|---|
| **EN before** | consider whether automated decision-making is appropriate for a responsible approach to the use of an AI system and its intended use |
| **EN after** | consider whether automating a decision at all fits a responsible approach to using the system for its intended purpose |

**live es-419**  —  ::deep-dive title="La pregunta cuya respuesta puede ser no" Enterrada en una lista de ejemplos de supervisión se encuentra la oración más consecuente de la categoría A.9: considerar si automatizar una decisión en absoluto se ajusta a un enfoque responsable del uso del sistema para su propósito previsto.

**live pt-BR**  —  ::deep-dive title="A pergunta cuja resposta pode ser não" Enterrada em uma lista de exemplos de supervisão está a frase mais consequente da categoria A.9: considerar se automatizar uma decisão é adequado a uma abordagem responsável ao uso do sistema para sua finalidade pretendida.

## 04-07-control-overlap-with-27001

`42001 Annex B, holistic management`  —  1 span(s)  —  _reorder plus one verb; `should` is held as `should`_

### run 10w, coverage 0.83

| | |
|---|---|
| **EN before** | Safety, security, privacy and environmental impact should be managed holistically rather than |
| **EN after** | Security, privacy, safety and environmental impact should be handled as one whole rather than |

**live es-419**  —  El razonamiento detrás del permiso indica dónde se encuentra la superposición. Un sistema de IA no se compone únicamente de sus componentes de IA y, como tecnología de procesamiento de información, la seguridad de la información le aplica de manera general. La seguridad, la privacidad, la protección y el impacto ambiental deberían gestionarse como un todo integrado, y no de manera separada para las partes de IA y todo lo demás.

**live pt-BR**  —  O raciocínio por trás da permissão indica onde a sobreposição existe. Um sistema de IA não é composto apenas de seus componentes de IA e, como tecnologia de processamento de informações, a segurança da informação se aplica a ele de forma geral. Convém que segurança, privacidade, proteção e impacto ambiental sejam tratados como um todo integrado, e não separadamente para as partes de IA e para todo o restante.

## 05-01-aims-monitoring-and-measurement

`42001 clause 9.1, A.6.2.6`  —  7 span(s)  —  _7 runs; the four determinations of clause 9.1 are a list and are reordered as one_

### run 26w, coverage 0.93

| | |
|---|---|
| **EN before** | **What needs to be monitored and measured.** **The methods** for monitoring, measurement, analysis and evaluation, as applicable, to ensure valid results. **When** the monitoring and measuring is performed. |
| **EN after** | **What to monitor and measure.** **Which methods** to use for monitoring, measurement, analysis and evaluation, so far as each applies, so that the results are valid. **When** monitoring and measurement happens. |

**live es-419**  —  **Qué debe ser objeto de seguimiento y medición.** **Qué métodos** utilizar para el seguimiento, la medición, el análisis y la evaluación, en la medida en que cada uno aplique, de modo que los resultados sean válidos. **Cuándo** se realizan el seguimiento y la medición. Y **cuándo** se analizan y evalúan los resultados.

**live pt-BR**  —  **O que monitorar e medir.** **Quais métodos** usar para monitoramento, medição, análise e avaliação, na medida em que cada um se aplica, para que os resultados sejam válidos. **Quando** o monitoramento e a medição ocorrem. E **quando** os resultados são analisados e avaliados.

### run 14w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | the organization shall **evaluate the performance and the effectiveness of the AI management system.** |
| **EN after** | the organization shall **evaluate how well the AI management system performs and how effective it is.** |

**live es-419**  —  Luego viene el requisito al que sirven las cuatro determinaciones: la organización debe **evaluar qué tan bien funciona el sistema de gestión de IA y qué tan eficaz es.**

**live pt-BR**  —  Em seguida, o requisito ao qual as quatro determinações servem: a organização deve **avaliar quão bem o sistema de gestão de IA performa e quão eficaz ele é.**

### run 14w, coverage 0.61

| | |
|---|---|
| **EN before** | in this document, performance refers **both to results achieved by using AI systems and to results related to the AI management system itself.** |
| **EN after** | in this document, performance covers **two things at once: what using the AI systems achieves, and how the management system itself is doing.** |

**live es-419**  —  ::concept title="Desempeño tiene dos significados" La definición de desempeño de la norma incluye una nota que resuelve una ambigüedad en la que las personas suelen tropezar: en este documento, el desempeño abarca **dos cosas a la vez: lo que se logra mediante el uso de los sistemas de IA, y cómo está funcionando el propio sistema de gestión.** La lectura correcta se desprende del contexto.

**live pt-BR**  —  ::concept title="Desempenho tem dois significados" A definição de desempenho da norma traz uma nota que resolve uma ambiguidade em que as pessoas costumam tropeçar: neste documento, desempenho abrange **duas coisas ao mesmo tempo: o que o uso dos sistemas de IA alcança e como o próprio sistema de gestão está se saindo.** A leitura correta fica clara pelo contexto.

### run 12w, coverage 0.92

| | |
|---|---|
| **EN before** | Where production data and output data are used to further train the model |
| **EN after** | Where output and production data are fed back to train the model further |

**live es-419**  —  **Aprendizaje continuo.** Cuando los datos de salida y de producción se retroalimentan para seguir entrenando el modelo, la organización debería monitorear el desempeño para confirmar que el sistema continúa cumpliendo los objetivos para los que fue diseñado y que sigue comportándose según lo previsto con los datos de producción. El comportamiento cambia por diseño, y la pregunta de seguimiento es si sigue cambiando en direcciones aceptables.

**live pt-BR**  —  **Aprendizado contínuo.** Quando dados de saída e dados de produção são realimentados para treinar ainda mais o modelo, convém que a organização monitore o desempenho para confirmar que o sistema continua atendendo aos objetivos para os quais foi projetado e ainda se comporta conforme pretendido sobre os dados de produção. O comportamento muda por design, e a questão de monitoramento é se ele ainda está mudando em direções aceitáveis.

### run 14w, coverage 0.88

| | |
|---|---|
| **EN before** | confirm the system continues to meet its design goals and operates on production data as intended |
| **EN after** | confirm the system still meets the goals it was designed for and still behaves as intended on production data |

**live es-419**  —  **Aprendizaje continuo.** Cuando los datos de salida y de producción se retroalimentan para seguir entrenando el modelo, la organización debería monitorear el desempeño para confirmar que el sistema continúa cumpliendo los objetivos para los que fue diseñado y que sigue comportándose según lo previsto con los datos de producción. El comportamiento cambia por diseño, y la pregunta de seguimiento es si sigue cambiando en direcciones aceptables.

**live pt-BR**  —  **Aprendizado contínuo.** Quando dados de saída e dados de produção são realimentados para treinar ainda mais o modelo, convém que a organização monitore o desempenho para confirmar que o sistema continua atendendo aos objetivos para os quais foi projetado e ainda se comporta conforme pretendido sobre os dados de produção. O comportamento muda por design, e a questão de monitoramento é se ele ainda está mudando em direções aceitáveis.

### run 10w, coverage 0.77

| | |
|---|---|
| **EN before** | or in ways not anticipated, the appropriateness of such uses should be considered |
| **EN after** | or in ways nobody anticipated, whether those uses are appropriate should be considered |

**live es-419**  —  La guía añade un elemento relacionado que es fácil pasar por alto: cuando los sistemas se utilizan para propósitos distintos a aquellos para los que fueron diseñados, o de maneras que nadie anticipó, debe considerarse si dichos usos son apropiados. Esa es una obligación de seguimiento sobre el **uso**, no sobre el modelo, y ninguna métrica técnica la hace visible. ::

**live pt-BR**  —  A orientação acrescenta um item relacionado que é fácil de ignorar: onde sistemas estão sendo usados para finalidades diferentes daquelas para as quais foram projetados, ou de maneiras que ninguém antecipou, a adequação de tais usos deve ser considerada. Isso é uma obrigação de monitoramento sobre o **uso**, não sobre o modelo, e nenhuma métrica técnica a revela. ::

### run 11w, coverage 0.69

| | |
|---|---|
| **EN before** | "text": "Both results achieved by using AI systems and results related to the management system itself" |
| **EN after** | "text": "Both what using the AI systems achieves and how the management system itself is doing" |

**live es-419**  —  ::checkpoint [ { "id": "q1", "question": "¿Qué dice la norma que el término desempeño significa en este documento?", "type": "single_choice", "options": [ { "id": "a", "text": "Solo los resultados obtenidos mediante el uso de sistemas de IA" }, { "id": "b", "text": "Tanto los resultados obtenidos mediante el uso de sistemas de IA como los resultados relacionados con el propio sistema de gestión" }, { "id": "c", "text": "La conformidad con los controles del Anexo A" }, { "id": "d", "text": "El resultado de las auditorías internas" } ], "correct": ["b"], "explanation": "Una nota a la definición lo hace explícito, y la lectura correcta se desprende del contexto. Importa porque una organización que mide únicamente las métricas del modelo tiene seguimiento para sus sistemas y ninguno para su sistema de gestión.", "concept_slugs": ["aims-effectiveness-vs-system-performance"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q2", "question": "Un modelo no ha cambiado desde su validación y no han ocurrido errores, pero sus resultados se alejan cada vez más de la realidad. ¿Qué está ocurriendo y qué lo hace visible?", "type": "single_choice", "options": [ { "id": "a", "text": "Aprendizaje continuo; visible mediante el control de versiones" }, { "id": "b", "text": "Deriva; visible midiendo la exactitud frente a datos de referencia actualizados a lo largo del tiempo" }, { "id": "c", "text": "Un incidente de disponibilidad; visible mediante el seguimiento del tiempo de actividad" }, { "id": "d", "text": "Un compromiso de seguridad; visible mediante el registro de accesos" } ], "correct": ["b"], "explanation": "La deriva de concepto o de datos cambia el desempeño sin ningún aprendizaje y sin ningún evento. El seguimiento basado en fallos nunca se activará, porque nada falló. Solo la medición frente a la realidad actual, comparada a lo largo del tiempo, lo revela.", "concept_slugs": ["what-to-monitor", "monitoring-and-measurement"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q3", "question": "¿Qué requiere el capítulo 9.1 que la organización determine?", "type": "single_choice", "options": [ { "id": "a", "text": "Qué monitorear, los métodos, cuándo se realiza y cuándo se analizan y evalúan los resultados" }, { "id": "b", "text": "La frecuencia de las auditorías internas" }, { "id": "c", "text": "La competencia de quienes realizan la medición" }, { "id": "d", "text": "El período de retención de los registros de seguimiento" } ], "correct": ["a"], "explanation": "Esas cuatro, con los métodos calificados como necesarios para garantizar resultados válidos. Medir y evaluar son determinaciones separadas: los datos recopilados de forma continua y revisados anualmente están siendo recopilados, no monitoreados. La frecuencia de las auditorías corresponde al capítulo 9.2 y la competencia al apartado 7.2.", "concept_slugs": ["monitoring-and-measurement"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q4", "question": "¿Por qué la guía sugiere considerar el desempeño de los procesos no basados en IA que ya están en operación?", "type": "single_choice", "options": [ { "id": "a", "text": "Porque los sistemas de IA deben superar a los procesos manuales para poder desplegarse" }, { "id": "b", "text": "Porque los números de desempeño absolutos inducen a error sin una línea de base para la comparación" }, { "id": "c", "text": "Porque los procesos no basados en IA están fuera del alcance del sistema de gestión de IA" }, { "id": "d", "text": "Porque la norma requiere una comparación documentada para cada sistema" } ], "correct": ["b"], "explanation": "La guía lo señala como contexto relevante para los criterios de desempeño. Una cifra de exactitud que parece mediocre puede representar una mejora sustancial respecto a lo que reemplazó, y una que parece sólida puede ser peor. No se impone ningún requisito de superación.", "concept_slugs": ["aims-effectiveness-vs-system-performance"], "bloom_level": "2_understand", "difficulty": 3 } ] ::

**live pt-BR**  —  ::checkpoint [ { "id": "q1", "question": "O que a norma diz que o termo desempenho se refere neste documento?", "type": "single_choice", "options": [ { "id": "a", "text": "Apenas aos resultados obtidos pelo uso de sistemas de IA" }, { "id": "b", "text": "Tanto aos resultados obtidos pelo uso de sistemas de IA quanto aos resultados relacionados ao próprio sistema de gestão" }, { "id": "c", "text": "À conformidade com os controles do Anexo A" }, { "id": "d", "text": "Ao resultado de auditorias internas" } ], "correct": ["b"], "explanation": "Uma nota à definição torna isso explícito, com a leitura correta ficando clara pelo contexto. Isso importa porque uma organização que mede apenas métricas de modelos tem monitoramento para seus sistemas e nenhum para seu sistema de gestão.", "concept_slugs": ["aims-effectiveness-vs-system-performance"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q2", "question": "Um modelo está inalterado desde a validação e nenhum erro ocorreu, mas suas saídas divergem cada vez mais da realidade. O que está acontecendo e o que revela isso?", "type": "single_choice", "options": [ { "id": "a", "text": "Aprendizado contínuo; revelado pelo controle de versão" }, { "id": "b", "text": "Deriva; revelada pela medição da acurácia em relação a novos dados de referência ao longo do tempo" }, { "id": "c", "text": "Um incidente de disponibilidade; revelado pelo monitoramento de uptime" }, { "id": "d", "text": "Um comprometimento de segurança; revelado pelo registro de acessos" } ], "correct": ["b"], "explanation": "A deriva de conceito ou de dados altera o desempenho sem nenhum aprendizado e sem nenhum evento. O monitoramento construído em torno de falhas nunca será acionado, porque nada falhou. Apenas a medição em relação à realidade atual, comparada ao longo do tempo, a revela.", "concept_slugs": ["what-to-monitor", "monitoring-and-measurement"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q3", "question": "O que a Seção 9.1 exige que a organização determine?", "type": "single_choice", "options": [ { "id": "a", "text": "O que monitorar, os métodos, quando é realizado e quando os resultados são analisados e avaliados" }, { "id": "b", "text": "A frequência das auditorias internas" }, { "id": "c", "text": "A competência de quem realiza as medições" }, { "id": "d", "text": "O período de retenção dos registros de monitoramento" } ], "correct": ["a"], "explanation": "Esses quatro, com os métodos qualificados como precisando garantir resultados válidos. Medir e avaliar são determinações separadas — dados coletados continuamente e revisados anualmente estão sendo coletados, não monitorados. A frequência de auditorias pertence à Seção 9.2 e a competência à Seção 7.2.", "concept_slugs": ["monitoring-and-measurement"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q4", "question": "Por que a orientação sugere considerar o desempenho de processos não baseados em IA já em operação?", "type": "single_choice", "options": [ { "id": "a", "text": "Porque os sistemas de IA devem superar os processos manuais para serem implantados" }, { "id": "b", "text": "Porque números absolutos de desempenho induzem ao erro sem uma linha de base para comparação" }, { "id": "c", "text": "Porque os processos não baseados em IA estão fora do escopo do sistema de gestão de IA" }, { "id": "d", "text": "Porque a norma exige uma comparação documentada para cada sistema" } ], "correct": ["b"], "explanation": "A orientação o nomeia como contexto relevante para os critérios de desempenho. Um número de acurácia que parece medíocre pode representar uma melhoria substancial em relação ao que foi substituído, e um que parece forte pode ser pior. Nenhum requisito de superação é imposto.", "concept_slugs": ["aims-effectiveness-vs-system-performance"], "bloom_level": "2_understand", "difficulty": 3 } ] ::

## 05-03-aims-management-review

`42001 clause 9.3.3`  —  3 span(s)  —  _THREE runs. Spans two and three are the same clause at different cuts; the third is inside a ::checkpoint block._

### run 17w, coverage 0.94

| | |
|---|---|
| **EN before** | to include **decisions related to continual improvement opportunities and any need for changes to the AI management system.** |
| **EN after** | to record **what was decided about improvement opportunities and about any changes the AI management system needs.** |

**live es-419**  —  ::concept title="Dos tipos de salida" La cláusula 9.3.3 exige que los [resultados]{glossary="review-results"} de la revisión registren **qué se decidió sobre las oportunidades de mejora y sobre cualquier cambio que el sistema de gestión de IA necesite.**

**live pt-BR**  —  ::concept title="Dois tipos de saída" A Seção 9.3.3 exige que os [resultados]{glossary="review-results"} da análise crítica registrem **o que foi decidido sobre oportunidades de melhoria e sobre quaisquer mudanças que o sistema de gestão de IA necessite.**

### run 10w, coverage 0.77

| | |
|---|---|
| **EN before** | Documented information must be available as evidence of the results of management reviews. |
| **EN after** | Documented information must be kept as evidence of what management reviews produced. |

**live es-419**  —  La información documentada debe conservarse como evidencia de lo que produjeron las revisiones por la dirección. **Evidencia de los resultados** — las decisiones, no la discusión. Las actas que registran lo que se dijo satisfacen una convención de gobernanza; los [registros]{glossary="review-records"} de lo que se decidió satisfacen el apartado.

**live pt-BR**  —  A informação documentada deve ser mantida como evidência do que as análises críticas pela direção produziram. **Evidência dos resultados** — as decisões, não a discussão. Atas que registram o que foi dito satisfazem uma convenção de governança; [registros]{glossary="review-records"} do que foi decidido satisfazem a cláusula.

### run 13w, coverage 0.87

| | |
|---|---|
| **EN before** | "text": "Decisions related to continual improvement opportunities and any need for changes to the AIMS" |
| **EN after** | "text": "What was decided about improvement opportunities and about any changes the AIMS needs" |

**live es-419**  —  ::checkpoint [ { "id": "q1", "question": "¿Qué palabra en la entrada de desempeño cambia lo que debe prepararse para la revisión?", "type": "single_choice", "options": [ { "id": "a", "text": "Información" }, { "id": "b", "text": "Tendencias" }, { "id": "c", "text": "Resultados" }, { "id": "d", "text": "No conformidades" } ], "correct": ["b"], "explanation": "El apartado pide tendencias en no conformidades y acciones correctivas, resultados de seguimiento y medición, y resultados de auditoría. Las cifras de un solo período no pueden mostrar movimiento, y el movimiento es lo que determina si se necesita acción, lo que requiere datos comparables entre períodos.", "concept_slugs": ["review-inputs"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q2", "question": "¿Qué deben incluir los resultados de una revisión por la dirección?", "type": "single_choice", "options": [ { "id": "a", "text": "Un resumen de la información presentada" }, { "id": "b", "text": "Decisiones relacionadas con oportunidades de mejora continua y cualquier necesidad de cambios en el sistema de gestión de IA" }, { "id": "c", "text": "Una Declaración de Aplicabilidad actualizada" }, { "id": "d", "text": "Confirmación de que el sistema cumple con la norma" } ], "correct": ["b"], "explanation": "Ambas son decisiones. La información documentada debe evidenciar los resultados — las decisiones, no la discusión. Las actas que narran lo que se presentó satisfacen una convención de gobernanza, pero no este apartado.", "concept_slugs": ["review-results", "review-records"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q3", "question": "Una revisión determina que el alcance del sistema de gestión de IA debe ampliarse. ¿Qué apartado rige cómo se lleva a cabo ese cambio?", "type": "single_choice", "options": [ { "id": "a", "text": "Apartado 8.1, planificación y control operacional" }, { "id": "b", "text": "Apartado 6.3, planificación de los cambios" }, { "id": "c", "text": "Apartado 10.2, no conformidad y acción correctiva" }, { "id": "d", "text": "Apartado 9.3.3, resultados de la revisión por la dirección" } ], "correct": ["b"], "explanation": "Un cambio en el sistema de gestión se lleva a cabo de manera planificada conforme al apartado 6.3. Los dos apartados forman un ciclo: la revisión identifica la necesidad, el apartado 6.3 rige la ejecución, y la siguiente revisión verifica el estado de las acciones de la anterior.", "concept_slugs": ["management-review"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q4", "question": "¿Qué tres cualidades debe confirmar la revisión que el sistema de gestión de IA sigue teniendo?", "type": "single_choice", "options": [ { "id": "a", "text": "Adecuación, suficiencia y eficacia" }, { "id": "b", "text": "Conformidad, integridad y vigencia" }, { "id": "c", "text": "Eficiencia, economía y eficacia" }, { "id": "d", "text": "Disponibilidad, integridad y confidencialidad" } ], "correct": ["a"], "explanation": "Tres preguntas distintas: ¿sigue teniendo el sistema la forma correcta?, ¿hay suficiente de todo?, y ¿está logrando lo que se propuso? Una revisión que concluye que todo está bien sin separarlas generalmente solo ha respondido a una.", "concept_slugs": ["management-review"], "bloom_level": "2_understand", "difficulty": 2 } ] ::

**live pt-BR**  —  ::checkpoint [ { "id": "q1", "question": "Qual palavra na entrada de desempenho muda o que precisa ser preparado para a análise crítica?", "type": "single_choice", "options": [ { "id": "a", "text": "Informações" }, { "id": "b", "text": "Tendências" }, { "id": "c", "text": "Resultados" }, { "id": "d", "text": "Não conformidades" } ], "correct": ["b"], "explanation": "A Seção pede tendências em não conformidades e ações corretivas, resultados de monitoramento e medição, e resultados de auditorias. Os dados de um único período não mostram movimento, e o movimento é o que determina se uma ação é necessária — o que exige dados comparáveis entre períodos.", "concept_slugs": ["review-inputs"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q2", "question": "O que os resultados de uma análise crítica pela direção devem incluir?", "type": "single_choice", "options": [ { "id": "a", "text": "Um resumo das informações apresentadas" }, { "id": "b", "text": "Decisões relacionadas a oportunidades de melhoria contínua e a qualquer necessidade de mudanças no sistema de gestão de IA" }, { "id": "c", "text": "Uma Declaração de Aplicabilidade atualizada" }, { "id": "d", "text": "Confirmação de que o sistema está em conformidade com a norma" } ], "correct": ["b"], "explanation": "Ambos são decisões. A informação documentada deve evidenciar os resultados — as decisões, não a discussão. Atas que narram o que foi apresentado satisfazem uma convenção de governança, não esta Seção.", "concept_slugs": ["review-results", "review-records"], "bloom_level": "2_understand", "difficulty": 2 }, { "id": "q3", "question": "Uma análise crítica determina que o escopo do sistema de gestão de IA deve ser ampliado. Qual Seção governa como essa mudança é realizada?", "type": "single_choice", "options": [ { "id": "a", "text": "Seção 8.1, planejamento e controle operacional" }, { "id": "b", "text": "Seção 6.3, planejamento de mudanças" }, { "id": "c", "text": "Seção 10.2, não conformidade e ação corretiva" }, { "id": "d", "text": "Seção 9.3.3, resultados da análise crítica pela direção" } ], "correct": ["b"], "explanation": "Uma mudança no sistema de gestão é realizada de forma planejada conforme a Seção 6.3. As duas Seções formam um ciclo: a análise crítica identifica a necessidade, a 6.3 governa a execução, e a próxima análise crítica verifica o status das ações da anterior.", "concept_slugs": ["management-review"], "bloom_level": "2_understand", "difficulty": 3 }, { "id": "q4", "question": "Quais três qualidades a análise crítica deve confirmar que o sistema de gestão de IA continua a ter?", "type": "single_choice", "options": [ { "id": "a", "text": "Adequação, suficiência e eficácia" }, { "id": "b", "text": "Conformidade, completude e atualidade" }, { "id": "c", "text": "Eficiência, economicidade e eficácia" }, { "id": "d", "text": "Disponibilidade, integridade e confidencialidade" } ], "correct": ["a"], "explanation": "Três perguntas distintas: o sistema ainda tem o formato certo, há o suficiente dele e está alcançando o que pretendia. Uma análise crítica que conclui que tudo está bem sem separá-las geralmente respondeu apenas a uma.", "concept_slugs": ["management-review"], "bloom_level": "2_understand", "difficulty": 2 } ] ::

## 05-04-nonconformity-and-corrective-action

`42001 clauses 10.1 and 10.2`  —  4 span(s)  —  _4 runs, all reusing blueprint recasts for tasks.knowledge 5.4_

### run 17w, coverage 1  [19011:2026, 27000:2018]

| | |
|---|---|
| **EN before** | it is custom or common practice for the organization and interested parties that the need or expectation |
| **EN after** | the organization and its interested parties customarily take it as read that the need or expectation |

**live es-419**  —  **Los requisitos generalmente implícitos cuentan.** La nota de la definición explica que "generalmente implícito" significa que la organización y sus partes interesadas habitualmente dan por sentado que la necesidad o expectativa está implícita. Por lo tanto, una no conformidad no requiere que se haya infringido una regla escrita.

**live pt-BR**  —  **Contagens geralmente implícitas.** A nota da definição explica que geralmente implícito significa que a organização e suas partes interessadas costumam considerar como subentendida a necessidade ou expectativa. Portanto, uma não conformidade não exige que uma regra escrita tenha sido violada.

### run 9w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | so that it does not recur **or occur elsewhere** — |
| **EN after** | so the same failure does not come back **or turn up elsewhere** — |

**live es-419**  —  **Luego determinar si es necesario hacer algo con respecto a lo que la causó**, para que el mismo fallo no se repita **ni aparezca en otro lugar** — revisando la no conformidad, determinando sus causas y determinando si existen o podrían ocurrir no conformidades similares.

**live pt-BR**  —  **Em seguida, verificar se é necessário agir sobre o que a causou**, para que a mesma falha não se repita **ou apareça em outro lugar** — revisando a não conformidade, determinando suas causas e verificando se não conformidades semelhantes existem ou poderiam ocorrer.

### run 10w, coverage 1  [27001:2022, 42001:2023]

| | |
|---|---|
| **EN before** | **the nature of the nonconformities and any subsequent actions taken** |
| **EN after** | **what the nonconformities were and what was done about them** |

**live es-419**  —  La información documentada debe estar disponible como evidencia de dos cosas: **cuáles fueron las no conformidades y qué se hizo al respecto**, y **los resultados de cualquier acción correctiva.** Ambas — el fallo y el resultado de la respuesta.

**live pt-BR**  —  Informação documentada deve estar disponível como evidência de duas coisas: **quais foram as não conformidades e o que foi feito a respeito delas**, e **os resultados de qualquer ação corretiva.** Ambas — a falha e o resultado da resposta.

### run 10w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | the suitability, adequacy and effectiveness of the AI management system |
| **EN after** | how well the AI management system fits, whether it is adequate, and whether it works |

**live es-419**  —  Y la cláusula 10.1 está por encima de todo ello: la organización debe **[mejorar continuamente]{glossary="continual-improvement"}** qué tan bien se ajusta el sistema de gestión de IA, si es adecuado y si funciona. Esa es una obligación permanente, no una respuesta ante un fallo. La acción correctiva es una vía hacia la mejora; las decisiones de la revisión por la dirección y las oportunidades identificadas en ella son otra. ::

**live pt-BR**  —  E a cláusula 10.1 está acima de tudo isso: a organização deve **[melhorar continuamente]{glossary="continual-improvement"}** o quanto o sistema de gestão de IA é adequado, suficiente e se funciona. Essa é uma obrigação permanente, não uma resposta a falhas. A ação corretiva é um caminho para a melhoria; as decisões da análise crítica pela direção e as oportunidades identificadas nela são outro. ::

## 05-05-the-certification-route

`42001 clause 1, scope`  —  1 span(s)  —  _the same sentence as 01-05 and tasks.knowledge 1.5 / 5.5_

### run 16w, coverage 1  [42001:2023]

| | |
|---|---|
| **EN before** | can generate evidence of its responsibility and accountability regarding its role with respect to AI systems. |
| **EN after** | can produce evidence that it is responsible and accountable for whatever role it holds around AI systems. |

**live es-419**  —  **Lo que ISO/IEC 42001 sí dice** sobre el resultado merece leerse con precisión: una organización que cumple sus requisitos puede producir evidencia de que es responsable y rinde cuentas por cualquier rol que desempeñe en torno a los sistemas de IA. Eso es una afirmación sobre evidencia, acotada al rol de la organización — más estrecha de lo que la mayoría de los certificados se interpretan, y la lección 1.5 explicó por qué esa distinción importa. ::

**live pt-BR**  —  **O que a ISO/IEC 42001 de fato diz** sobre o resultado merece ser lido com precisão: uma organização em conformidade com seus requisitos pode produzir evidências de que é responsável e presta contas pelo papel que desempenha em relação aos sistemas de IA. Trata-se de uma afirmação sobre evidências, delimitada ao papel da organização — mais restrita do que a maioria dos certificados é interpretada como dizendo, e a Lição 1.5 explicou por que essa distinção importa. ::

## 05-06-integrated-audit-programme

`42001 definition of audit, note`  —  1 span(s)

### run 8w, coverage 0.67

| | |
|---|---|
| **EN before** | an audit can be a **combined audit, combining two or more disciplines.** |
| **EN after** | a single audit may cover two or more disciplines at once -- what the standard calls a **combined audit.** |

**live es-419**  —  ::concept title="La maquinaria se comparte" La definición de auditoría de la norma contiene una nota que resuelve la cuestión directamente: una sola auditoría puede cubrir dos o más disciplinas a la vez; a esto la norma lo denomina **auditoría combinada.**

**live pt-BR**  —  ::concept title="A estrutura se compartilha" A definição de auditoria da norma contém uma nota que resolve a questão diretamente: uma única auditoria pode cobrir duas ou mais disciplinas ao mesmo tempo — o que a norma chama de **auditoria combinada.**
