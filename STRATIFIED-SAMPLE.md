# Stratified read -- paired sample

Four ADVERSARIAL passages (from the lessons the checks flagged most) and four RANDOM passages (from lessons the checks passed) per stratum and language. The random half is the one that can tell us what the checks miss; the adversarial half only measures the checks.

Selection is deterministic (FNV-1a over the slug), so this sample can be re-derived.
Sampled strata: **AIMS-F 2026-08-07, ISMS-IA 2026-08-12, AIMS-IA 2026-09-12**. The checks above cover all 14 strata and 917 rows; this document samples the named ones.


**Nothing here has been changed.**

---

## AIMS-F 2026-08-07 / es-419

35 row(s) in this stratum; 4 adversarial, 4 random.

### 1. ADVERSARIAL -- `05-06-integrated-audit-programme` / es-419

flags: accent (formula); modal (should x1, no weak modal, 3 obligations vs 2 en)

**EN**

```
**Clause 8 records do not transfer.** The AI risk assessment, treatment and impact assessment records required at planned intervals or on significant change are AI records. An ISMS produces its own risk records on its own cycle, and neither set answers the other's question.

**Data and life cycle evidence has no counterpart.** Provenance records, representativeness assessments, preparation criteria, verification and validation against evaluation criteria, event logging determinations — an ISMS auditor has no clause to match these against, and an AI auditor will not accept information security evidence in their place.

[This category]{glossary="evidence-that-cannot-be-shared"} is where an integrated programme goes wrong quietly. The programme is shared, the plan is shared, the audit is combined — and the evidence pack contains one risk assessment where two were needed, because at the point of collection they looked like the same artifact.
::
```

**es-419**

```
**Los registros del capítulo 8 no son transferibles.** Los registros de evaluación del riesgo de IA, tratamiento y evaluación de impacto requeridos a intervalos planificados o ante cambios significativos son registros de IA. Un SGSI produce sus propios registros de riesgo en su propio ciclo, y ninguno de los dos conjuntos responde a la pregunta del otro.

**La evidencia de datos y del ciclo de vida no tiene contraparte.** Registros de procedencia, evaluaciones de representatividad, criterios de preparación, verificación y validación frente a criterios de evaluación, determinaciones de registro de eventos: un auditor de SGSI no tiene ningún apartado con el que contrastar estos elementos, y un auditor de IA no aceptará evidencia de seguridad de la información en su lugar.

[Esta categoría]{glossary="evidence-that-cannot-be-shared"} es donde un programa integrado falla silenciosamente. El programa es compartido, el plan es compartido, la auditoría es combinada, y el paquete de evidencias contiene una sola evaluación del riesgo donde se necesitaban dos, porque en el momento de la recopilación parecían el mismo artefacto.
::
```

### 2. ADVERSARIAL -- `04-03-governing-apparatus-controls` / es-419

flags: accent (confiaran)

**EN**

```
It should also carry the principles guiding AI-related activity and — most often absent — **processes for handling deviations and exceptions.** A policy without an exception route gets ignored the first time it meets a deadline.

**Alignment with other policies.** The organization determines where other policies are affected by or apply to its AI objectives. The guidance is direct about why: many domains intersect AI, including quality, security, safety and privacy, and the organization should analyse where current policies necessarily intersect and either update them or bring provisions into the AI policy.

**Review of the policy** at planned intervals or as needed, to keep it suitable, adequate and effective. The guidance asks for a management-approved role responsible for developing, reviewing and evaluating it, and says the review should take management review results into account.
```

**es-419**

```
También debería incluir los principios que guían las actividades relacionadas con la IA y — lo que más frecuentemente está ausente — **procesos para gestionar desviaciones y excepciones.** Una política sin una vía de excepción se ignora la primera vez que se enfrenta a un plazo.

**Alineación con otras políticas.** La organización determina dónde otras políticas se ven afectadas por sus objetivos de IA o son aplicables a ellos. La guía es directa sobre el motivo: muchos dominios se intersectan con la IA, incluidos la calidad, la seguridad, la protección y la privacidad, y la organización debería analizar dónde las políticas actuales se intersectan necesariamente y actualizarlas o incorporar disposiciones en la política de IA.

**Revisión de la política** a intervalos planificados o cuando sea necesario, para mantenerla adecuada, suficiente y eficaz. La guía solicita un rol aprobado por la dirección responsable de desarrollarla, revisarla y evaluarla, y señala que la revisión debería tener en cuenta los resultados de la revisión por la dirección.
```

### 3. ADVERSARIAL -- `03-06-data-for-ai-systems` / es-419

flags: modal (should x1, no weak modal, 2 obligations vs 0 en)

**EN**

```
**Synthetic data.** Generated by a model, from data the generating model was trained on. Its provenance is not a chain of custody but a lineage through a system whose own inputs may be undocumented. The organization can record the generation process, the model used and its version, and the seed data it had rights to — which is meaningfully better than nothing and is not the same assurance as a traceable source.

**Model outputs used as inputs.** A system's outputs become another system's training data, sometimes deliberately and sometimes because a dataset was assembled from sources that included generated content. The provenance record has to reach back through a system rather than through a set of hands.

The standard does not resolve either case, and it would be wrong to imply that it does. What it requires is a documented **process** for recording provenance over the life cycles of the data and the system, and a judgement about whether measures to verify provenance are needed given the source, content and context of use.
```

**es-419**

```
**Datos sintéticos.** Generados por un modelo, a partir de datos con los que fue entrenado el modelo generador. Su procedencia no es una cadena de custodia sino un linaje a través de un sistema cuyos propios insumos pueden estar indocumentados. La organización puede registrar el proceso de generación, el modelo utilizado y su versión, y los datos semilla sobre los que tenía derechos — lo cual es significativamente mejor que nada y no equivale a la misma garantía que una fuente rastreable.

**Resultados de modelos usados como insumos.** Los resultados de un sistema se convierten en datos de entrenamiento de otro sistema, a veces de forma deliberada y a veces porque un conjunto de datos fue ensamblado a partir de fuentes que incluían contenido generado. El registro de procedencia debe remontarse a través de un sistema en lugar de a través de un conjunto de manos.

La norma no resuelve ninguno de los dos casos, y sería incorrecto insinuar que lo hace. Lo que requiere es un **proceso** documentado para registrar la procedencia a lo largo de los ciclos de vida de los datos y del sistema, y un juicio sobre si se necesitan medidas para verificar la procedencia dado el origen, el contenido y el contexto de uso.
```

### 4. ADVERSARIAL -- `02-06-the-ai-system-impact-assessment` / es-419

flags: accent (formula)

**EN**

```
::concept title="Impacts on societies"
The societal half is where organizations tend to run out of vocabulary, so the guidance supplies categories: economic, including access to financial services, employment, taxes, trade and commerce; environmental sustainability, including natural resources and greenhouse gas emissions; government, including legislative processes, national security, criminal justice and misinformation for political gain; health and safety, including access to healthcare, diagnosis and treatment, and potential physical and psychological harm; and norms, traditions, culture and values, including misinformation leading to bias or harm.

The guidance is explicit that [societal impacts]{glossary="impact-on-societies"} can be **beneficial as well as detrimental** — AI can improve access to services as readily as restrict it, and can reduce environmental impact as well as add to it. An assessment that only catalogues harms is not doing what the clause asks.

It also directs a specific kind of thinking: consider how these systems might be **misused** in ways that harm society, and how they might instead **help undo historical harms**. Both directions.
```

**es-419**

```
::concept title="Impactos en las sociedades"
La parte societal es donde las organizaciones suelen quedarse sin vocabulario, por lo que la orientación proporciona categorías: económica, incluido el acceso a servicios financieros, el empleo, los impuestos, el comercio y los negocios; sostenibilidad ambiental, incluidos los recursos naturales y las emisiones de gases de efecto invernadero; gobierno, incluidos los procesos legislativos, la seguridad nacional, la justicia penal y la desinformación con fines políticos; salud y seguridad, incluido el acceso a la atención sanitaria, el diagnóstico y tratamiento, y el posible daño físico y psicológico; y normas, tradiciones, cultura y valores, incluida la desinformación que conduce a sesgos o daños.

La orientación es explícita en que los [impactos sociales]{glossary="impact-on-societies"} pueden ser **beneficiosos además de perjudiciales**: la IA puede mejorar el acceso a los servicios con la misma facilidad con que puede restringirlo, y puede reducir el impacto ambiental además de incrementarlo. Una evaluación que solo cataloga daños no está haciendo lo que el apartado solicita.

También orienta hacia un tipo específico de reflexión: considerar cómo estos sistemas podrían ser **utilizados indebidamente** de maneras que dañen a la sociedad, y cómo podrían en cambio **ayudar a revertir daños históricos**. Ambas direcciones.
```

### 5. RANDOM -- `04-01-annex-a-structure` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
**[Annex B is normative]{glossary="annex-b-normative"}**, not informative. It is marked as such in the standard's own contents, and it provides implementation guidance for every control listed in Annex A.

What confuses people is a genuine subtlety. Annex B's general clause states that an organization is **not required to document or justify which parts of that guidance it adopted** in the Statement of Applicability. So the guidance itself is not subject to the SoA discipline that applies to the controls.

That produces a useful distinction. The annex carries normative status, but its contents are guidance about how to implement, expressed with *should* rather than *shall*, and an organization can extend or modify the guidance or define its own implementation to suit its requirements and treatment needs.
```

**es-419**

```
**[El Anexo B es normativo]{glossary="annex-b-normative"}**, no informativo. Así está indicado en el índice de la propia norma, y proporciona orientación para la implementación de cada control listado en el Anexo A.

Lo que genera confusión es una sutileza genuina. El apartado general del Anexo B establece que las organizaciones **no tienen que documentar ni justificar la inclusión o exclusión de la orientación para la implementación** en la Declaración de Aplicabilidad. Por lo tanto, la orientación en sí no está sujeta a la disciplina de la Declaración de Aplicabilidad que aplica a los controles.

Esto produce una distinción útil. El anexo tiene carácter normativo, pero su contenido es orientación sobre cómo implementar, expresada con *debería* en lugar de *debe*, y una organización puede ampliar o modificar la orientación o definir su propia implementación según sus requisitos y necesidades de tratamiento.
```

### 6. RANDOM -- `03-04-operational-planning-and-control` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
It means selecting a control in the Statement of Applicability is not the end of the obligation. The control has to be implemented, its effectiveness monitored, and where it is not producing the intended result, corrective action considered. A control that was chosen, deployed, and never looked at again has satisfied clause 6.1.3 and failed clause 8.1.

It also means the loop from clause 10.2 — nonconformity and corrective action — is reachable from operations rather than only from audit findings. An organization waiting for internal audit to tell it a control is ineffective is using the slowest available instrument.

Documented information must be **available** to the extent **necessary** for confidence that the processes were carried out as planned. Note the phrasing: *to the extent necessary to have confidence.* The test is whether the evidence supports the claim, not whether a form was completed.
::
```

**es-419**

```
Significa que seleccionar un control en la Declaración de Aplicabilidad no es el fin de la obligación. El control debe implementarse, monitorearse su eficacia y, cuando no produce el resultado previsto, considerarse una acción correctiva. Un control que fue elegido, desplegado y nunca revisado ha cumplido el apartado 6.1.3 y ha incumplido el capítulo 8.1.

También significa que el ciclo del apartado 10.2 —no conformidad y acción correctiva— es alcanzable desde las operaciones y no solo desde los hallazgos de auditoría. Una organización que espera a que la auditoría interna le informe que un control es ineficaz está utilizando el instrumento más lento disponible.

La información documentada debe conservarse en la medida en que genere confianza en que los procesos se llevaron a cabo según lo planificado. Nótese la formulación: *en la medida necesaria para tener confianza.* La prueba es si la evidencia respalda la afirmación, no si se completó un formulario.
::
```

### 7. RANDOM -- `04-06-use-and-third-party-controls` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
The customer control is most often skipped, because it points outward in a direction organizations do not habitually think about. The guidance asks the organization to understand customer expectations when supplying — arriving as design requirements, contractual terms or usage agreements — and to know where responsibility sits with provider and where with customer.

Its example is instructive: risks arising from a customer's use can be treated by **giving the customer appropriate information**, so they can treat the corresponding risks. Where a system is valid only for a certain domain, those limits should be communicated.

**That is risk treatment by disclosure**, and it only works if the disclosure actually reaches someone who can act on it.
::
```

**es-419**

```
El control de clientes es el que se omite con mayor frecuencia, porque apunta hacia afuera en una dirección en la que las organizaciones no suelen pensar. La orientación pide a la organización que comprenda las expectativas de los clientes al suministrar — que llegan como requisitos de diseño, términos contractuales o acuerdos de uso — y que sepa dónde recae la responsabilidad en el proveedor y dónde en el cliente.

Su ejemplo es ilustrativo: los riesgos derivados del uso por parte de un cliente pueden tratarse **dando al cliente información apropiada**, para que pueda tratar los riesgos correspondientes. Cuando un sistema es válido solo para un determinado dominio, esos límites deben comunicarse.

**Eso es tratamiento del riesgo mediante divulgación**, y solo funciona si la divulgación llega efectivamente a alguien que pueda actuar en consecuencia.
::
```

### 8. RANDOM -- `05-03-aims-management-review` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
Documented information must be kept as evidence of what management reviews produced. **Evidence of the results** — the decisions, not the discussion. Minutes recording what was said satisfy a governance convention; [records]{glossary="review-records"} of what was decided satisfy the clause.

The distinction shows up immediately at audit. An auditor asking what the review decided, and being handed a narrative of what was presented, has found something.
::

::interactive widget="highlight-mistake" id="review-output-review" concept_slugs="review-results"
{
  "scenario_title": "Four items from a management review record. Which one is not a review result as the clause requires?",
  "text": "A. Agreed: the AIMS scope will be extended to cover AI features in purchased software; change to be planned under clause 6.3, owner named, target end of Q3. B. Agreed: additional competence required in domain review of model outputs; two roles to be recruited or contracted. C. Noted: the monitoring dashboard was presented and showed a rising trend in override rates in the claims function. D. Agreed: impact assessment cadence to move from annual to on-change for the three systems classed as high impact.",
  "highlights": [
    {
      "id": "c",
      "span": "Noted: the monitoring dashboard was presented and showed a rising trend in override rates in the claims function.",
      "is_correct": true,
      "feedback": "An input recorded as though it were a result. It is not useless - a rising override trend is exactly the signal the review exists to surface - but the clause requires the results to include decisions, and noting a trend without deciding anything about it leaves the loop open."
    },
    {
      "id": "a",
      "span": "the AIMS scope will be extended to cover AI features in purchased software; change to be planned under clause 6.3, owner named, target end of Q3.",
      "is_correct": false,
      "feedback": "A decision with a consequence, and it explicitly routes the change through clause 6.3 - which is where a change to the management system belongs."
    },
    {
      "id": "b",
      "span": "additional competence required in domain review of model outputs; two roles to be recruited or contracted.",
      "is_correct": false,
      "feedback": "A decision. It names a need and an action, which is what makes it reportable at the next review as a prior action."
    },
    {
      "id": "d",
      "span": "impact assessment cadence to move from annual to on-change for the three systems classed as high impact.",
      "is_correct": false,
      "feedback": "A decision, and a substantive one - it changes when a required process runs, for a named set of systems."
    }
  ],
  "minimum_correct": 1
}
::
```

**es-419**

```
La segunda se conecta directamente con el apartado 6.3 de la lección 2.3. Cuando una revisión determina que el sistema de gestión necesita cambiar, el apartado 6.3 exige que ese cambio se lleve a cabo de manera planificada. Los dos forman un ciclo: la revisión identifica la necesidad, el apartado 6.3 rige la ejecución, y la siguiente revisión verifica el estado de las acciones de la anterior.

La información documentada debe conservarse como evidencia de lo que produjeron las revisiones por la dirección. **Evidencia de los resultados** — las decisiones, no la discusión. Las actas que registran lo que se dijo satisfacen una convención de gobernanza; los [registros]{glossary="review-records"} de lo que se decidió satisfacen el apartado.

La distinción aparece de inmediato en una auditoría. Un auditor que pregunta qué decidió la revisión y recibe un relato narrativo de lo que se presentó ha encontrado algo.
::
```

---

## AIMS-F 2026-08-07 / pt-BR

35 row(s) in this stratum; 4 adversarial, 4 random.

### 9. ADVERSARIAL -- `04-03-governing-apparatus-controls` / pt-BR

flags: accent (analise); convem (convem-que not clause-initial); convem (convem-que not clause-initial); convem (convem-que not clause-initial)

**EN**

```
It should also carry the principles guiding AI-related activity and — most often absent — **processes for handling deviations and exceptions.** A policy without an exception route gets ignored the first time it meets a deadline.

**Alignment with other policies.** The organization determines where other policies are affected by or apply to its AI objectives. The guidance is direct about why: many domains intersect AI, including quality, security, safety and privacy, and the organization should analyse where current policies necessarily intersect and either update them or bring provisions into the AI policy.

**Review of the policy** at planned intervals or as needed, to keep it suitable, adequate and effective. The guidance asks for a management-approved role responsible for developing, reviewing and evaluating it, and says the review should take management review results into account.
```

**pt-BR**

```
Convém que ela também contenha os princípios que orientam as atividades relacionadas à IA e — o que mais frequentemente está ausente — **processos para tratar desvios e exceções.** Uma política sem uma rota de exceção é ignorada na primeira vez que encontra um prazo.

**Alinhamento com outras políticas.** A organização determina onde outras políticas são afetadas pelos seus objetivos de IA ou se aplicam a eles. A orientação é direta quanto ao motivo: muitos domínios se intersectam com a IA, incluindo qualidade, segurança, proteção e privacidade, e convém que a organização analise onde as políticas vigentes necessariamente se cruzam e as atualize ou incorpore disposições à política de IA.

**Revisão da política** em intervalos planejados ou conforme necessário, para mantê-la adequada, suficiente e eficaz. A orientação solicita um papel aprovado pela direção responsável por desenvolver, revisar e avaliá-la, e indica que a revisão convém que leve em conta os resultados da análise crítica pela direção.
```

### 10. ADVERSARIAL -- `04-05-data-and-information-controls` / pt-BR

flags: convem (convem-que not clause-initial); convem (convem-que not clause-initial)

**EN**

```
The guidance answers this itself, and the answer is a criterion rather than a list: whether and what information is provided should be determined by the **intended use and reasonably foreseeable misuse**, the **expertise of the user**, and the **specific impact** of the system.

Three users of the same system illustrate the point.

**A system administrator** needs the technical requirements, the limitations, the monitoring capabilities and the functions that let them influence system operation. They do not need to be told they are interacting with AI.
```

**pt-BR**

```
O próprio guia responde a isso, e a resposta é um critério, não uma lista: se e quais informações são fornecidas deveriam ser determinadas pelo **uso pretendido e pelo uso indevido razoavelmente previsível**, pela **expertise do usuário** e pelo **impacto específico** do sistema.

Três usuários do mesmo sistema ilustram o ponto.

**Um administrador de sistema** precisa dos requisitos técnicos, das limitações, das capacidades de monitoramento e das funções que permitem influenciar a operação do sistema. Ele não precisa ser informado de que está interagindo com IA.
```

### 11. ADVERSARIAL -- `01-06-what-an-aims-is-not` / pt-BR

flags: accent (referencia); modal (should x4, no weak modal, 2 obligations vs 0 en)

**EN**

```
What the standard adds is the machinery around the principles: that they be documented, carried into specific life cycle stages, assessed against, monitored, and improved when they fail. Principles without that machinery are a statement of intent. That is the gap an AIMS closes, and it is worth saying plainly to any organization that believes it has already done this work.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "An organization asks which fairness metric ISO/IEC 42001 mandates for classification systems. What is the accurate answer?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "The metric named in Annex B for the relevant system type" },
      { "id": "b", "text": "None; the organization names its own objectives and builds their pursuit into the work" },
      { "id": "c", "text": "Whichever metric the certification body specifies during stage 2" },
      { "id": "d", "text": "The metric required by the applicable sector standard" }
    ],
    "correct": ["b"],
    "explanation": "The standard specifies no metrics or testing methods. Where fairness is an objective, the guidance expects it to be carried into specification, data acquisition, conditioning, training and validation — with the choice of measure left to the organization and open to justification.",
    "concept_slugs": ["aims-vs-model-assurance"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "How does the standard treat the NIST AI Risk Management Framework?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "As an alternative that organizations may adopt in place of this standard" },
      { "id": "b", "text": "As a complementary reference, cited for its description of roles and their relationship to the life cycle" },
      { "id": "c", "text": "As a normative reference whose requirements carry into this standard" },
      { "id": "d", "text": "It is not referenced" }
    ],
    "correct": ["b"],
    "explanation": "It is cited in the context clause for role types and their relationship to the life cycle, and appears in the bibliography. The only normative reference is ISO/IEC 22989, whose terms carry into this standard.",
    "concept_slugs": ["nist-ai-rmf-relationship"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "An organization with an established AI ethics board and published principles asks what an AIMS adds. What is the most accurate answer?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "A standard-mandated set of principles replacing its own" },
      { "id": "b", "text": "The machinery around the principles: documentation, integration into life cycle stages, assessment, monitoring and improvement" },
      { "id": "c", "text": "Nothing; an ethics programme satisfies the standard's requirements" },
      { "id": "d", "text": "An obligation to appoint an independent ethics officer" }
    ],
    "correct": ["b"],
    "explanation": "The standard endorses no principle set and requires no ethics function. It requires that objectives be identified, carried into specific stages, assessed against and improved. An existing ethics programme is a plausible source of those objectives; what it usually lacks is the machinery.",
    "concept_slugs": ["aims-vs-ethics-framework"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "Why does the standard describe itself as taking an AI technology specific view?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "To indicate it applies only to organizations that develop AI systems" },
      { "id": "b", "text": "To distinguish it from sector and discipline standards that address their objectives from a technology neutral view" },
      { "id": "c", "text": "To signal that its controls are technical rather than organizational" },
      { "id": "d", "text": "To limit its application to the sectors named in Annex D" }
    ],
    "correct": ["b"],
    "explanation": "Annex D contrasts the two views: existing standards address objectives such as safety or quality technology-neutrally, while this one adds the AI-specific considerations. That contrast is the reasoning behind the conclusion that integration is essential. Annex D names sectors as examples, not as limits.",
    "concept_slugs": ["sector-application-annex-d"],
    "bloom_level": "2_understand",
    "difficulty": 3
  }
]
::

::summary
- The standard governs technical practice without specifying it — no metrics, methods or architectures.
- It requires objectives to be identified, integrated into life cycle stages, and evaluated against.
- NIST AI RMF, ISO/IEC 23894, 22989, 5338 and 42005 are referenced as complements, not competitors.
- Annex C lists candidate objectives and risk sources; it is informative.
- The standard takes an AI-specific view alongside technology-neutral sector and discipline standards.
- An existing ethics programme supplies objectives; the AIMS supplies the machinery around them.
::

```

**pt-BR**

```
O que a norma acrescenta é a estrutura em torno dos princípios: que sejam documentados, incorporados a estágios específicos do ciclo de vida, avaliados, monitorados e aprimorados quando falham. Princípios sem essa estrutura são uma declaração de intenção. Essa é a lacuna que um sistema de gestão de IA fecha, e vale a pena dizer claramente a qualquer organização que acredita já ter feito esse trabalho.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Uma organização pergunta qual métrica de equidade a ISO/IEC 42001 exige para sistemas de classificação. Qual é a resposta correta?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "A métrica indicada no Anexo B para o tipo de sistema relevante" },
      { "id": "b", "text": "Nenhuma; a organização define seus próprios objetivos e incorpora sua busca ao trabalho" },
      { "id": "c", "text": "Qualquer métrica que o organismo de certificação especifique durante o estágio 2" },
      { "id": "d", "text": "A métrica exigida pela norma setorial aplicável" }
    ],
    "correct": ["b"],
    "explanation": "A norma não especifica métricas nem métodos de teste. Quando a equidade é um objetivo, a orientação espera que ela seja incorporada à especificação, aquisição de dados, condicionamento, treinamento e validação — com a escolha da medida deixada para a organização e aberta à justificativa.",
    "concept_slugs": ["aims-vs-model-assurance"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "Como a norma trata o NIST AI Risk Management Framework?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Como uma alternativa que as organizações podem adotar no lugar desta norma" },
      { "id": "b", "text": "Como uma referência complementar, citada por sua descrição de papéis e sua relação com o ciclo de vida" },
      { "id": "c", "text": "Como uma referência normativa cujos requisitos se incorporam a esta norma" },
      { "id": "d", "text": "Ele não é referenciado" }
    ],
    "correct": ["b"],
    "explanation": "Ele é citado na Seção de contexto pelos tipos de papéis e sua relação com o ciclo de vida, e aparece na bibliografia. A única referência normativa é a ISO/IEC 22989, cujos termos se incorporam a esta norma.",
    "concept_slugs": ["nist-ai-rmf-relationship"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "Uma organização com um conselho de ética em IA estabelecido e princípios publicados pergunta o que um sistema de gestão de IA acrescenta. Qual é a resposta mais precisa?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Um conjunto de princípios definido pela norma que substitui os seus próprios" },
      { "id": "b", "text": "A estrutura em torno dos princípios: documentação, integração nos estágios do ciclo de vida, avaliação, monitoramento e melhoria" },
      { "id": "c", "text": "Nada; um programa de ética satisfaz os requisitos da norma" },
      { "id": "d", "text": "A obrigação de nomear um responsável de ética independente" }
    ],
    "correct": ["b"],
    "explanation": "A norma não endossa nenhum conjunto de princípios nem exige uma função de ética. Ela exige que os objetivos sejam identificados, incorporados a estágios específicos, avaliados e aprimorados. Um programa de ética existente é uma fonte plausível desses objetivos; o que geralmente falta é a estrutura.",
    "concept_slugs": ["aims-vs-ethics-framework"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "Por que a norma se descreve como adotando uma visão específica da tecnologia de IA?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Para indicar que se aplica apenas a organizações que desenvolvem sistemas de IA" },
      { "id": "b", "text": "Para distingui-la das normas setoriais e disciplinares que abordam seus objetivos a partir de uma visão tecnologicamente neutra" },
      { "id": "c", "text": "Para sinalizar que seus controles são técnicos em vez de organizacionais" },
      { "id": "d", "text": "Para limitar sua aplicação aos setores mencionados no Anexo D" }
    ],
    "correct": ["b"],
    "explanation": "O Anexo D contrasta as duas visões: as normas existentes abordam objetivos como segurança ou qualidade de forma tecnologicamente neutra, enquanto esta acrescenta as considerações específicas de IA. Esse contraste é o raciocínio por trás da conclusão de que a integração é essencial. O Anexo D cita setores como exemplos, não como limites.",
    "concept_slugs": ["sector-application-annex-d"],
    "bloom_level": "2_understand",
    "difficulty": 3
  }
]
::

::summary
- A norma rege a prática técnica sem especificá-la — sem métricas, métodos ou arquiteturas.
- Ela exige que os objetivos sejam identificados, integrados nos estágios do ciclo de vida e avaliados.
- NIST AI RMF, ISO/IEC 23894, 22989, 5338 e 42005 são referenciados como complementos, não concorrentes.
- O Anexo C lista objetivos candidatos e fontes de risco; é informativo.
- A norma adota uma visão específica de IA ao lado das normas setoriais e disciplinares tecnologicamente neutras.
- Um programa de ética existente fornece os objetivos; o sistema de gestão de IA fornece a estrutura em torno deles.
::

```

### 12. ADVERSARIAL -- `05-03-aims-management-review` / pt-BR

flags: accent (analise); convem (convem-que not clause-initial)

**EN**

```
Documented information must be kept as evidence of what management reviews produced. **Evidence of the results** — the decisions, not the discussion. Minutes recording what was said satisfy a governance convention; [records]{glossary="review-records"} of what was decided satisfy the clause.

The distinction shows up immediately at audit. An auditor asking what the review decided, and being handed a narrative of what was presented, has found something.
::

::interactive widget="highlight-mistake" id="review-output-review" concept_slugs="review-results"
{
  "scenario_title": "Four items from a management review record. Which one is not a review result as the clause requires?",
  "text": "A. Agreed: the AIMS scope will be extended to cover AI features in purchased software; change to be planned under clause 6.3, owner named, target end of Q3. B. Agreed: additional competence required in domain review of model outputs; two roles to be recruited or contracted. C. Noted: the monitoring dashboard was presented and showed a rising trend in override rates in the claims function. D. Agreed: impact assessment cadence to move from annual to on-change for the three systems classed as high impact.",
  "highlights": [
    {
      "id": "c",
      "span": "Noted: the monitoring dashboard was presented and showed a rising trend in override rates in the claims function.",
      "is_correct": true,
      "feedback": "An input recorded as though it were a result. It is not useless - a rising override trend is exactly the signal the review exists to surface - but the clause requires the results to include decisions, and noting a trend without deciding anything about it leaves the loop open."
    },
    {
      "id": "a",
      "span": "the AIMS scope will be extended to cover AI features in purchased software; change to be planned under clause 6.3, owner named, target end of Q3.",
      "is_correct": false,
      "feedback": "A decision with a consequence, and it explicitly routes the change through clause 6.3 - which is where a change to the management system belongs."
    },
    {
      "id": "b",
      "span": "additional competence required in domain review of model outputs; two roles to be recruited or contracted.",
      "is_correct": false,
      "feedback": "A decision. It names a need and an action, which is what makes it reportable at the next review as a prior action."
    },
    {
      "id": "d",
      "span": "impact assessment cadence to move from annual to on-change for the three systems classed as high impact.",
      "is_correct": false,
      "feedback": "A decision, and a substantive one - it changes when a required process runs, for a named set of systems."
    }
  ],
  "minimum_correct": 1
}
::
```

**pt-BR**

```
O segundo conecta-se diretamente à Seção 6.3 da lição 2.3. Quando uma análise crítica determina que o sistema de gestão precisa mudar, a Seção 6.3 exige que essa mudança seja realizada de forma planejada. As duas formam um ciclo: a análise crítica identifica a necessidade, a 6.3 governa a execução, e a próxima análise crítica verifica o status das ações da anterior.

A informação documentada deve ser mantida como evidência do que as análises críticas pela direção produziram. **Evidência dos resultados** — as decisões, não a discussão. Atas que registram o que foi dito satisfazem uma convenção de governança; [registros]{glossary="review-records"} do que foi decidido satisfazem a cláusula.

Essa distinção aparece imediatamente em uma auditoria. Um auditor que pergunta o que a análise crítica decidiu e recebe uma narrativa do que foi apresentado encontrou algo.
::
```

### 13. RANDOM -- `03-03-documented-information` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
**From Annex A:** documented AI system impact assessments retained for a defined period; resource documentation; system design and development documentation; verification and validation records; deployment plans; technical documentation; event logs.

Two observations. The clause 8 items accumulate rather than replace, which means an organization needs a retention decision for a growing series, not just a current file. And the Annex A items are the ones most likely to live in engineering tooling rather than a document management system — which is fine, provided clause 7.5.3's control requirements are actually met wherever they live.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "An organization receives a model card from a provider and files it. The provider updates the model six months later. What does clause 7.5.3 require?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Nothing; documents produced by third parties are outside the AIMS" },
      { "id": "b", "text": "That documented information of external origin necessary for planning and operation be identified and controlled" },
      { "id": "c", "text": "That the provider be required to hold its own certification" },
      { "id": "d", "text": "That the model card be reproduced in the organization's own template" }
    ],
    "correct": ["b"],
    "explanation": "External-origin information that the organization determines is necessary for planning and operation must be identified as appropriate and controlled. A model card filed once and never checked against the version in production is uncontrolled, whatever its original quality.",
    "concept_slugs": ["external-origin-documents"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "Which requirement applies when documented information is created or updated?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Approval by top management" },
      { "id": "b", "text": "Identification and description, appropriate format and media, and review and approval for suitability and adequacy" },
      { "id": "c", "text": "Translation into every language the organization operates in" },
      { "id": "d", "text": "Publication to interested parties" }
    ],
    "correct": ["b"],
    "explanation": "Those three are the clause 7.5.2 requirements. Top management approval is required for specific artifacts elsewhere, not for documented information generally, and neither translation nor publication is a creation requirement.",
    "concept_slugs": ["creating-and-updating"],
    "bloom_level": "3_apply",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "An organization documents extensively, reasoning that more records mean a stronger management system. What does the standard suggest?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Extent varies with organization size, process complexity and the competence of people" },
      { "id": "b", "text": "A minimum page count is specified per clause" },
      { "id": "c", "text": "Documentation volume is a measure of AIMS maturity" },
      { "id": "d", "text": "All processes must be documented to the same level of detail" }
    ],
    "correct": ["a"],
    "explanation": "A note to clause 7.5.1 names those three factors. The requirement is what the standard demands plus what the organization determines is necessary for effectiveness — a judgement, not a volume target.",
    "concept_slugs": ["documented-information"],
    "bloom_level": "3_apply",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "Why do the clause 8 records require a retention decision rather than only a current version?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Because certification bodies require three years of history" },
      { "id": "b", "text": "Because the clause requires results of all risk assessments, treatments and impact assessments to be retained" },
      { "id": "c", "text": "Because superseded records must be published to interested parties" },
      { "id": "d", "text": "Because impact assessments cannot be updated once documented" }
    ],
    "correct": ["b"],
    "explanation": "Clause 8 uses the word 'all' for each of the three, so the records accumulate as a series across reassessments rather than replacing each other. That makes retention and disposition a live decision under clause 7.5.3 rather than an afterthought.",
    "concept_slugs": ["control-of-documented-information", "documented-information"],
    "bloom_level": "3_apply",
    "difficulty": 3
  }
]
::
```

**pt-BR**

```
**Do Anexo A:** avaliações de impacto do sistema de IA documentadas e retidas por um período definido; documentação de recursos; documentação de projeto e desenvolvimento do sistema; registros de verificação e validação; planos de implantação; documentação técnica; logs de eventos.

Duas observações. Os itens da Seção 8 se acumulam em vez de se substituírem, o que significa que a organização precisa de uma decisão de retenção para uma série crescente, não apenas para um arquivo atual. E os itens do Anexo A são os que mais provavelmente residem em ferramentas de engenharia em vez de em um sistema de gestão de documentos — o que é aceitável, desde que os requisitos de controle da Seção 7.5.3 sejam efetivamente atendidos onde quer que estejam.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Uma organização recebe um cartão de modelo de um fornecedor e o arquiva. O fornecedor atualiza o modelo seis meses depois. O que a Seção 7.5.3 exige?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Nada; documentos produzidos por terceiros estão fora do sistema de gestão de IA" },
      { "id": "b", "text": "Que a informação documentada de origem externa necessária para o planejamento e a operação seja identificada e controlada" },
      { "id": "c", "text": "Que o fornecedor seja obrigado a obter sua própria certificação" },
      { "id": "d", "text": "Que o cartão de modelo seja reproduzido no modelo próprio da organização" }
    ],
    "correct": ["b"],
    "explanation": "A informação de origem externa que a organização determina ser necessária para o planejamento e a operação deve ser identificada conforme apropriado e controlada. Um cartão de modelo arquivado uma vez e nunca verificado em relação à versão em produção está sem controle, independentemente de sua qualidade original.",
    "concept_slugs": ["external-origin-documents"],
    "bloom_level": "3_apply",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "Qual requisito se aplica quando uma informação documentada é criada ou atualizada?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Aprovação pela alta direção" },
      { "id": "b", "text": "Identificação e descrição, formato e mídia adequados, e análise crítica e aprovação quanto à pertinência e adequação" },
      { "id": "c", "text": "Tradução para todos os idiomas em que a organização opera" },
      { "id": "d", "text": "Publicação para as partes interessadas" }
    ],
    "correct": ["b"],
    "explanation": "Esses três são os requisitos da Seção 7.5.2. A aprovação pela alta direção é exigida para artefatos específicos em outros pontos, não para a informação documentada em geral, e nem a tradução nem a publicação são requisitos de criação.",
    "concept_slugs": ["creating-and-updating"],
    "bloom_level": "3_apply",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "Uma organização documenta extensivamente, argumentando que mais registros significam um sistema de gestão mais robusto. O que a norma sugere?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "A extensão varia com o porte da organização, a complexidade dos processos e a competência das pessoas" },
      { "id": "b", "text": "Um número mínimo de páginas é especificado por seção" },
      { "id": "c", "text": "O volume de documentação é uma medida de maturidade do sistema de gestão de IA" },
      { "id": "d", "text": "Todos os processos devem ser documentados com o mesmo nível de detalhe" }
    ],
    "correct": ["a"],
    "explanation": "Uma nota à Seção 7.5.1 menciona esses três fatores. O requisito é o que a norma exige mais o que a organização determina ser necessário para a eficácia — um julgamento, não uma meta de volume.",
    "concept_slugs": ["documented-information"],
    "bloom_level": "3_apply",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "Por que os registros da Seção 8 exigem uma decisão de retenção em vez de apenas uma versão atual?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Porque os organismos de certificação exigem três anos de histórico" },
      { "id": "b", "text": "Porque a seção exige que os resultados de todas as avaliações de riscos, tratamentos e avaliações de impacto sejam retidos" },
      { "id": "c", "text": "Porque os registros substituídos devem ser publicados para as partes interessadas" },
      { "id": "d", "text": "Porque as avaliações de impacto não podem ser atualizadas após serem documentadas" }
    ],
    "correct": ["b"],
    "explanation": "A Seção 8 usa a palavra 'todas' para cada um dos três casos, portanto os registros se acumulam como uma série ao longo das reavaliações em vez de se substituírem. Isso torna a retenção e o descarte uma decisão ativa sob a Seção 7.5.3, e não uma reflexão tardia.",
    "concept_slugs": ["control-of-documented-information", "documented-information"],
    "bloom_level": "3_apply",
    "difficulty": 3
  }
]
::
```

### 14. RANDOM -- `03-05-third-party-ai-supply` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
So supplier treatment is risk-differentiated by design. A library that formats dates and a foundation model that generates customer-facing text are both supplied components, and treating them identically means one is over-managed or the other is under-managed.
::

::concept title="What the organization must do"
Three [obligations]{glossary="supplier-obligations"} sit in the supplier control and its guidance.

**Establish a process** ensuring that the organization's use of supplier-provided services, products or materials lines up with its own approach to responsible development and use of AI systems. Note the framing — alignment with *your* approach, which presupposes you have one.
```

**pt-BR**

```
Portanto, o tratamento de fornecedores é diferenciado por risco por design. Uma biblioteca que formata datas e um modelo de base que gera texto voltado ao cliente são ambos componentes fornecidos, e tratá-los de forma idêntica significa que um será gerenciado em excesso ou o outro será gerenciado de forma insuficiente.
::

::concept title="O que a organização deve fazer"
Três [obrigações]{glossary="supplier-obligations"} constam no controle de fornecedores e em sua orientação.

**Estabelecer um processo** que garanta que o uso de serviços, produtos ou materiais fornecidos por fornecedores esteja alinhado com a própria abordagem da organização para o desenvolvimento e uso responsável de sistemas de IA. Observe o enquadramento — alinhamento com *sua* abordagem, o que pressupõe que você tenha uma.
```

### 15. RANDOM -- `03-02-awareness-and-communication` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
The practical implication is that AI awareness content probably needs a different segmentation from security awareness content — organized by **what people do with AI** rather than by system access level. A support agent overriding suggestions needs to know what an override is for and when it matters. Someone pasting into a generative tool needs to know what the policy says about that specific act.

Neither of them needs the full policy. Both need the part of it that governs the thing they do daily, and the standard's requirement is that they be aware — which is a claim about what they know, not about what was sent to them.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Which of the three awareness items is most often omitted from awareness material?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "The AI policy" },
      { "id": "b", "text": "Their contribution to the effectiveness of the AIMS, including the benefits of improved AI performance" },
      { "id": "c", "text": "The implications of not conforming with AIMS requirements" },
      { "id": "d", "text": "The organization's certification status" }
    ],
    "correct": ["b"],
    "explanation": "Awareness material tends to cover the policy and the consequences of breaching it, and to skip the positive half — what a person's own work contributes and what improved performance is worth. Certification status is not among the three items.",
    "concept_slugs": ["awareness-requirement"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "An organization holds an annual AI training session and records completion. Has it satisfied clause 7.3?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Yes; training satisfies the awareness requirement" },
      { "id": "b", "text": "Not necessarily; awareness concerns what people know, and training is a clause 7.2 competence action" },
      { "id": "c", "text": "Only if the session is repeated for contractors separately" },
      { "id": "d", "text": "Only if attendance exceeds a stated threshold" }
    ],
    "correct": ["b"],
    "explanation": "The two clauses address different things. Training builds competence under 7.2, where effectiveness must be evaluated. Awareness under 7.3 is a claim about what people are aware of. A session may serve both, but completion records evidence attendance rather than either outcome.",
    "concept_slugs": ["awareness-requirement", "work-under-organizational-control"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "What four things does clause 7.4 require the organization to determine?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "What, when, with whom, and how" },
      { "id": "b", "text": "Who, why, how much, and how often" },
      { "id": "c", "text": "Audience, channel, budget, and approval" },
      { "id": "d", "text": "Internal, external, routine, and incident" }
    ],
    "correct": ["a"],
    "explanation": "Those four decisions, for both internal and external communications relevant to the AIMS. Their absence is what distinguishes planned communication from reacting to events as they arise.",
    "concept_slugs": ["communication-planning"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "A concerns-reporting process exists but few people know about it. Which requirements are engaged?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Only the Annex A control, since the process exists" },
      { "id": "b", "text": "The control, plus communication and awareness — a channel nobody knows about does not function" },
      { "id": "c", "text": "Only clause 7.4, since promotion is a communication activity" },
      { "id": "d", "text": "None; promotion of internal processes is outside the standard" }
    ],
    "correct": ["b"],
    "explanation": "The guidance expects the reporting mechanism to be available and promoted to employed and contracted persons, with protection from reprisals. Existence is the control, promotion is communication, and people knowing it is safe to use is awareness. All three have to work.",
    "concept_slugs": ["communication-planning", "work-under-organizational-control"],
    "bloom_level": "2_understand",
    "difficulty": 3
  }
]
::
```

**pt-BR**

```
A implicação prática é que o conteúdo de conscientização sobre IA provavelmente precisa de uma segmentação diferente do conteúdo de conscientização sobre segurança — organizado pelo **que as pessoas fazem com a IA** e não pelo nível de acesso ao sistema. Um agente de suporte que substitui sugestões precisa saber para que serve uma substituição e quando ela importa. Alguém que cola em uma ferramenta generativa precisa saber o que a política diz sobre esse ato específico.

Nenhum deles precisa da política completa. Ambos precisam da parte que rege o que fazem diariamente, e o requisito da norma é que estejam cientes — o que é uma afirmação sobre o que sabem, não sobre o que lhes foi enviado.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Qual dos três itens de conscientização é mais frequentemente omitido dos materiais de conscientização?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "A política de IA" },
      { "id": "b", "text": "Sua contribuição para a eficácia do sistema de gestão de IA, incluindo os benefícios da melhoria do desempenho da IA" },
      { "id": "c", "text": "As implicações de não estar em conformidade com os requisitos do sistema de gestão de IA" },
      { "id": "d", "text": "O status de certificação da organização" }
    ],
    "correct": ["b"],
    "explanation": "Os materiais de conscientização tendem a cobrir a política e as consequências de violá-la, e a omitir a metade positiva — o que o próprio trabalho de uma pessoa contribui e o que a melhoria do desempenho representa. O status de certificação não está entre os três itens.",
    "concept_slugs": ["awareness-requirement"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "Uma organização realiza um treinamento anual de IA e registra a conclusão. Ela satisfez a Seção 7.3?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Sim; o treinamento satisfaz o requisito de conscientização" },
      { "id": "b", "text": "Não necessariamente; conscientização diz respeito ao que as pessoas sabem, e treinamento é uma ação de competência prevista na Seção 7.2" },
      { "id": "c", "text": "Somente se a sessão for repetida separadamente para prestadores de serviço" },
      { "id": "d", "text": "Somente se a participação superar um limite estabelecido" }
    ],
    "correct": ["b"],
    "explanation": "As duas seções tratam de coisas diferentes. O treinamento desenvolve competência na 7.2, onde a eficácia deve ser avaliada. A conscientização na 7.3 é uma afirmação sobre o que as pessoas estão cientes. Uma sessão pode servir a ambas, mas os registros de conclusão evidenciam presença, não nenhum dos dois resultados.",
    "concept_slugs": ["awareness-requirement", "work-under-organizational-control"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "Quais são as quatro coisas que a Seção 7.4 exige que a organização determine?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "O quê, quando, com quem e como" },
      { "id": "b", "text": "Quem, por quê, quanto e com que frequência" },
      { "id": "c", "text": "Público, canal, orçamento e aprovação" },
      { "id": "d", "text": "Interno, externo, rotineiro e de incidente" }
    ],
    "correct": ["a"],
    "explanation": "Essas quatro decisões, para comunicações internas e externas relevantes para o sistema de gestão de IA. A ausência delas é o que distingue a comunicação planejada de reagir a eventos conforme surgem.",
    "concept_slugs": ["communication-planning"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q4",
    "question": "Existe um processo de relato de preocupações, mas poucas pessoas sabem sobre ele. Quais requisitos estão envolvidos?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Apenas o controle do Anexo A, já que o processo existe" },
      { "id": "b", "text": "O controle, mais comunicação e conscientização — um canal que ninguém conhece não funciona" },
      { "id": "c", "text": "Apenas a Seção 7.4, já que a divulgação é uma atividade de comunicação" },
      { "id": "d", "text": "Nenhum; a divulgação de processos internos está fora do escopo da norma" }
    ],
    "correct": ["b"],
    "explanation": "A orientação espera que o mecanismo de relato esteja disponível e seja divulgado para pessoas empregadas e contratadas, com proteção contra represálias. A existência é o controle, a divulgação é comunicação, e as pessoas saberem que é seguro usá-lo é conscientização. Os três precisam funcionar.",
    "concept_slugs": ["communication-planning", "work-under-organizational-control"],
    "bloom_level": "2_understand",
    "difficulty": 3
  }
]
::
```

### 16. RANDOM -- `05-05-the-certification-route` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
::callout type="terminology"
Do not state specific durations for the certification cycle from memory. The cycle length and surveillance frequency are set by ISO/IEC 17021-1 and by accreditation body requirements, and they are the kind of detail that varies and gets amended. What is durable is the shape: two initial stages, periodic surveillance, and periodic recertification.
::

::concept title="What ISO/IEC 42006 adds"
Certification bodies auditing an AI management system need something a generic standard cannot give them, and [ISO/IEC 42006]{glossary="iso-42006-role"} is where it comes from.

**Competence requirements for auditors.** Auditing an AIMS requires understanding of AI systems, their life cycle and this standard's obligations. A body competent in information security is not thereby competent here — lesson 3.7's point, applied to the certifier.
```

**pt-BR**

```
::concept title="O caminho em si"
Da ISO/IEC 17021-1, aplicável à certificação de sistemas de gestão em geral:

**[Estágio 1]{glossary="stage-one-stage-two"}** tem foco na documentação. O organismo de certificação examina se o sistema de gestão foi projetado para atender aos requisitos — o escopo, a política, o processo de avaliação de riscos e o tratamento de riscos, a Declaração de Aplicabilidade, o programa de auditoria interna e a análise crítica pela direção — e avalia se a organização está pronta para o Estágio 2. As constatações nesta fase geralmente dizem respeito à prontidão, e não à conformidade.

**O Estágio 2** tem foco na implementação. O organismo examina se o sistema está efetivamente em operação: evidências de processos em execução, registros produzidos, decisões tomadas. É aqui que o material da Seção 8 da Lição 3.8 é testado, e onde uma organização com excelente documentação mas sem histórico operacional enfrenta dificuldades.
```

---

## AIMS-IA 2026-09-12 / es-419

30 row(s) in this stratum; 4 adversarial, 4 random.

### 17. ADVERSARIAL -- `aims-ia-03-05-the-question-that-finds-evidence` / es-419

flags: accent (formula); accent (incomoda)

**EN**

```
**Posturing.** The auditor, wanting to appear competent, uses terminology imprecisely and asks questions that reveal the gap. The interviewee then adjusts - simplifying, filling in what they assume was meant, and sometimes correcting the auditor rather than answering. The evidence degrades because the conversation is now about the auditor.

The way through is to be plain about the role. *I am not going to be able to evaluate the methodology, so I want to understand what records this produces and see the last three.* Nobody is embarrassed, the specialist knows what is useful, and the audit gets artifacts instead of an argument.

This is also where a technical expert on the audit team earns their place, per clause 3.15. The expert can interrogate methodology; the auditor takes what the expert establishes and tests it against the criteria. Two competences, two people, and clause 4.2 b) satisfied for each.
::
```

**es-419**

```
**Postura.** El auditor, queriendo parecer competente, usa terminología de forma imprecisa y hace preguntas que revelan la brecha. El entrevistado entonces se ajusta: simplifica, completa lo que supone que se quiso decir y a veces corrige al auditor en lugar de responder. La evidencia se deteriora porque la conversación ahora trata sobre el auditor.

La salida es ser directo sobre el rol. *No voy a poder evaluar la metodología, así que quiero entender qué registros produce esto y ver los últimos tres.* Nadie se incomoda, el especialista sabe qué es útil y la auditoría obtiene artefactos en lugar de un debate.

Aquí es también donde un experto técnico en el equipo de auditoría cumple su función, conforme al apartado 3.15. El experto puede interrogar la metodología; el auditor toma lo que el experto establece y lo contrasta con los criterios. Dos competencias, dos personas, y el apartado 4.2 b) satisfecho para cada una.
::
```

### 18. ADVERSARIAL -- `aims-ia-04-08-defined-versus-running` / es-419

flags: accent (clausula)

**EN**

```
Two obligations. Monitor effectiveness. Consider corrective action where intended results are not achieved.

This is not clause 9.1, which addresses monitoring, measurement, analysis and evaluation of the AI management system's performance and effectiveness. Clause 8.1's monitoring is narrower and more specific: the controls the organization determined under 6.1.3 and implemented.

The evidence gap in most organizations is that controls are implemented and then assumed to work. What would evidence monitoring:
```

**es-419**

```
Dos obligaciones. Monitorear la eficacia. Considerar acciones correctivas donde no se logren los resultados previstos.

Esto no es el apartado 9.1, que aborda el monitoreo, la medición, el análisis y la evaluación del desempeño y la eficacia del sistema de gestión de IA. El monitoreo del apartado 8.1 es más acotado y específico: los controles que la organización determinó conforme al apartado 6.1.3 e implementó.

La brecha de evidencia en la mayoría de las organizaciones es que los controles se implementan y luego se asume que funcionan. ¿Qué evidenciaría el monitoreo?
```

### 19. ADVERSARIAL -- `aims-ia-05-06-correction-is-not-corrective-action` / es-419

flags: accent (clausula)

**EN**

```
The same logic runs through most AIMS findings:

- A **data provenance record** incomplete for one dataset - are the others complete, and were they produced the same way?
- A **declared control** not operated in one team - do other teams operate it?
- A **model card** missing its version identifier - is that one model or the template?
- A **competence determination** covering engineering and not operations - does the same omission run through every role family?

The distinguishing question is whether the cause is **local or systemic**, and the organization is required to determine which. An auditor can test whether they did: the corrective action record either addresses the question or it does not.
```

**es-419**

```
La misma lógica se aplica a la mayoría de los hallazgos del sistema de gestión de IA:

- Un **registro de procedencia de datos** incompleto para un conjunto de datos: ¿los demás están completos y se produjeron de la misma manera?
- Un **control declarado** no operado en un equipo: ¿otros equipos lo operan?
- Una **tarjeta de modelo** sin identificador de versión: ¿es un modelo o la plantilla?
- Una **determinación de competencia** que cubre ingeniería pero no operaciones: ¿la misma omisión se repite en todas las familias de roles?

La pregunta que distingue es si la causa es **local o sistémica**, y la organización está obligada a determinarlo. Un auditor puede verificar si lo hizo: el registro de acción correctiva aborda la pregunta o no la aborda.
```

### 20. ADVERSARIAL -- `aims-ia-03-04-demonstrated-not-described` / es-419

flags: accent (formula)

**EN**

```
Which gives a practical test for any finding before it is written: **could a second auditor, given the audit record, reach this conclusion without having been in the room?** If not, the finding is resting on something that was not evidence.
::

::interactive widget="toggle-and-observe" id="turning-an-interview-into-evidence" concept_slugs="aia-evidence-vs-assertion,aia-collecting-verifying-information,aia-verifying-information,aia-evidence-based-approach"
{
  "scenario_title": "A convincing explanation",
  "intro": "An engineer explains the pre-deployment evaluation process fluently and appears entirely credible. The auditor wants to conclude that the control operates. Switch each step on.",
  "toggles": [
    {
      "id": "record",
      "label": "The auditor records the statement as a statement of fact, attributed and dated",
      "off_consequence": "An impression, held by the auditor. Clause 6.4.7 says evidence leading to audit findings should be recorded, and there is nothing to record from.",
      "on_consequence": "A statement of fact, which clause 3.10 includes in audit evidence. Low on the verification scale, and on it."
    },
    {
      "id": "corroborate",
      "label": "The auditor obtains evaluation records and deployment history for three named models",
      "off_consequence": "The conclusion rests on one person's account. Clause 4.6 asks that findings and conclusions be based only on the audit evidence, and a single unverified account is thin support for a statement about a control.",
      "on_consequence": "Records that can be re-examined. The statement is now corroborated or contradicted by something independent of the speaker.",
      "depends_on": ["record"]
    },
    {
      "id": "test",
      "label": "The records are tested against Annex A.5 - complete, correct, consistent, current",
      "off_consequence": "The records exist and nobody asked whether they say what they need to say. An evaluation dated after its deployment passes an existence check and fails the control.",
      "on_consequence": "Completeness against the organization's own template, consistency between evaluation dates and deployment dates, currency against the pipeline as rebuilt. This is where the real finding usually appears.",
      "depends_on": ["corroborate"]
    },
    {
      "id": "reproduce",
      "label": "The auditor asks whether a second auditor could reach this conclusion from the record alone",
      "off_consequence": "The conclusion is the auditor's, and defensible only while they are in the room to defend it.",
      "on_consequence": "Clause 4.7's reliable and reproducible conclusions, and clause 4.1's claim that auditors working independently reach similar conclusions in similar circumstances.",
      "depends_on": ["test"]
    }
  ],
  "reflection_prompt": "Was the engineer's explanation wasted?",
  "reflection_answer": "No - it did the job an interview does. It told the auditor what to go and look for, which records would exist, and where a gap would show. What it could not do is carry the conclusion, because clause 3.10 requires audit evidence to be verifiable and clause 4.6 asks that conclusions rest only on the audit evidence. The interview directed the audit; the records supported it. An auditor who skips the interview works blind, and one who stops there has an impression rather than a finding."
}
::

::deep-dive title="Evidence you are shown and evidence you find"
There is a distinction Annex A.5 gestures at that is worth making explicit for AIMS work, because so much of the evidence is mediated by someone with access.
```

**es-419**

```
Lo que ofrece una prueba práctica para cualquier hallazgo antes de redactarlo: **¿podría un segundo auditor, a partir del registro de auditoría, llegar a esta conclusión sin haber estado en la sala?** Si no, el hallazgo se apoya en algo que no era evidencia.
::

::interactive widget="toggle-and-observe" id="turning-an-interview-into-evidence" concept_slugs="aia-evidence-vs-assertion,aia-collecting-verifying-information,aia-verifying-information,aia-evidence-based-approach"
{
  "scenario_title": "Una explicación convincente",
  "intro": "Un ingeniero explica el proceso de evaluación previa al despliegue con fluidez y parece completamente creíble. El auditor quiere concluir que el control opera. Active cada paso.",
  "toggles": [
    {
      "id": "record",
      "label": "El auditor registra la declaración como una declaración de hechos, con atribución y fecha",
      "off_consequence": "Una impresión que el auditor conserva. El apartado 6.4.7 indica que la evidencia que conduce a hallazgos de auditoría debe quedar registrada, y no hay nada de lo que partir.",
      "on_consequence": "Una declaración de hechos, que el apartado 3.10 incluye en la evidencia de auditoría. Ocupa un lugar bajo en la escala de verificación, pero está en ella."
    },
    {
      "id": "corroborate",
      "label": "El auditor obtiene registros de evaluación e historial de despliegue de tres modelos identificados",
      "off_consequence": "La conclusión se apoya en el relato de una sola persona. El apartado 4.6 exige que los hallazgos y conclusiones se basen únicamente en la evidencia de auditoría, y un único relato no verificado es un respaldo endeble para una afirmación sobre un control.",
      "on_consequence": "Registros que pueden volver a examinarse. La declaración queda ahora corroborada o contradicha por algo independiente del interlocutor.",
      "depends_on": ["record"]
    },
    {
      "id": "test",
      "label": "Los registros se someten a las pruebas del Anexo A.5: completos, correctos, coherentes, actuales",
      "off_consequence": "Los registros existen y nadie preguntó si dicen lo que deben decir. Una evaluación fechada después de su despliegue supera una verificación de existencia y falla el control.",
      "on_consequence": "Completitud respecto a la propia plantilla de la organización, coherencia entre las fechas de evaluación y las fechas de despliegue, actualidad respecto al pipeline reconstruido. Aquí es donde suele aparecer el hallazgo real.",
      "depends_on": ["corroborate"]
    },
    {
      "id": "reproduce",
      "label": "El auditor se pregunta si un segundo auditor podría llegar a esta conclusión a partir del registro por sí solo",
      "off_consequence": "La conclusión es del auditor y solo es defendible mientras él esté presente para defenderla.",
      "on_consequence": "Las conclusiones fiables y reproducibles del apartado 4.7, y la afirmación del apartado 4.1 de que los auditores que trabajan de forma independiente llegan a conclusiones similares en circunstancias similares.",
      "depends_on": ["test"]
    }
  ],
  "reflection_prompt": "¿Fue inútil la explicación del ingeniero?",
  "reflection_answer": "No: cumplió la función que cumple una entrevista. Le indicó al auditor qué buscar, qué registros deberían existir y dónde aparecería una brecha. Lo que no pudo hacer es sostener la conclusión, porque el apartado 3.10 exige que la evidencia de auditoría sea verificable y el apartado 4.6 pide que las conclusiones se basen únicamente en la evidencia de auditoría. La entrevista orientó la auditoría; los registros la respaldaron. Un auditor que omite la entrevista trabaja a ciegas, y uno que se detiene ahí tiene una impresión en lugar de un hallazgo."
}
::

::deep-dive title="Evidencia que le muestran y evidencia que usted encuentra"
Hay una distinción que el Anexo A.5 insinúa y que vale la pena hacer explícita para el trabajo con sistemas de gestión de IA, porque gran parte de la evidencia está mediada por alguien con acceso.
```

### 21. RANDOM -- `aims-ia-02-01-a-programme-is-designed-not-scheduled` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
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

::summary
- An audit programme is arrangements for a set of audits over a time frame directed towards a specific purpose - the purpose is what makes it a design.
- Clause 5.2 places programme objectives with the audit client and ties them to its strategic direction and context.
- Objectives that any audit plan would serve equally are describing rather than directing.
- Programme extent should reflect this auditee's size, nature, complexity, risks and maturity.
- Programme objectives direct a set of audits; individual audit objectives state what one audit accomplishes, and must be consistent with them.
- A programme objective the organization set itself is a requirement it set itself, and can be audited against.
::

```

**es-419**

```
El apartado 5.3 de ISO/IEC 42001 exige que la alta dirección asigne la responsabilidad y la autoridad para informar sobre el desempeño del sistema de gestión de IA a la alta dirección. Un programa de auditoría sin un cliente identificable es a menudo un indicador temprano de que esa asignación se realizó solo en papel.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "El objetivo del programa de auditoría del sistema de gestión de IA de una organización dice: \"Verificar la conformidad continua con ISO/IEC 42001 y la preparación para la certificación.\" ¿Cuál es la evaluación más precisa?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Adecuado: nombra la norma y el propósito del programa." },
      { "id": "b", "text": "Débil frente al apartado 5.2: no se deriva del contexto de la organización y no puede orientar la planificación, ya que cualquier plan de auditoría lo serviría por igual." },
      { "id": "c", "text": "No conforme: los objetivos del programa deben ser cuantitativos." },
      { "id": "d", "text": "Adecuado para un primer ciclo, tras el cual debería reemplazarse." }
    ],
    "correct": ["b"],
    "explanation": "El apartado 5.2 pide que los objetivos sean coherentes con la dirección estratégica y el contexto del cliente de la auditoría, y que orienten la planificación y la realización de las auditorías. Nada exige que sean cuantitativos, y nada hace que los objetivos genéricos sean aceptables en un primer ciclo: un primer ciclo también tiene un contexto.",
    "concept_slugs": ["aia-programme-objectives", "aia-objectives-from-context"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q2",
    "question": "¿Qué afirmación distingue correctamente un objetivo del programa de un objetivo de la auditoría individual?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Los objetivos del programa se refieren a la conformidad; los objetivos de la auditoría se refieren a la eficacia." },
      { "id": "b", "text": "Un objetivo del programa orienta un conjunto de auditorías durante un período de tiempo; un objetivo de la auditoría establece qué debe lograr una auditoría, e ISO 19011 pide que el segundo sea coherente con el primero." },
      { "id": "c", "text": "Los objetivos del programa los establece el auditor; los objetivos de la auditoría los establece el auditado." },
      { "id": "d", "text": "Son la misma cosa descrita en diferentes niveles de detalle." }
    ],
    "correct": ["b"],
    "explanation": "El apartado 5.2 cubre los objetivos del programa y el 5.5.2 cubre los objetivos de la auditoría individual, exigiendo coherencia entre ellos. Ambos pueden abordar la conformidad y la eficacia. El apartado 5.2 sitúa los objetivos del programa en el cliente de la auditoría y el 5.5.2 sitúa los objetivos de la auditoría en el individuo que gestiona el programa; ninguno pertenece al auditado.",
    "concept_slugs": ["aia-programme-vs-individual-audit"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "Una organización desplegó sistemas de IA en dos nuevas jurisdicciones este año. Sus objetivos del programa de auditoría no han cambiado respecto al año anterior. ¿Qué sugiere el apartado 5.2 de ISO 19011:2026 al respecto?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Nada: los objetivos deben ser estables para permitir la comparación entre ciclos." },
      { "id": "b", "text": "Los objetivos deben ser coherentes con el contexto del cliente de la auditoría, y un cambio material en el contexto que no produjo ningún cambio en los objetivos sugiere que no se derivaron de él." },
      { "id": "c", "text": "El programa no es conforme, porque el apartado 5.2 exige la revisión anual de los objetivos." },
      { "id": "d", "text": "Solo los objetivos de la auditoría individual necesitan cambiar." }
    ],
    "correct": ["b"],
    "explanation": "El apartado 5.2 vincula los objetivos con la dirección estratégica y el contexto del cliente de la auditoría, y enumera los cambios en procesos, productos, servicios y proyectos entre aquello en lo que pueden basarse. No exige revisión anual, y la estabilidad no es en sí misma un defecto: lo que los objetivos sin cambios sugieren vale la pena investigar, no concluir.",
    "concept_slugs": ["aia-objectives-from-context", "aia-programme-objectives"],
    "bloom_level": "2_understand",
    "difficulty": 4
  },
  {
    "id": "q4",
"question": "¿Por qué la cláusula 5.1 de ISO 19011:2026 establece que el alcance de un programa de auditoría debería derivarse del tamaño y las características del auditado y de la madurez de sus sistemas de gestión?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Para que las organizaciones más grandes reciban proporcionalmente más días de auditoría." },
      { "id": "b", "text": "Para que el programa se dimensione según lo que los sistemas de esta organización realmente requieren, en lugar de un estándar general de cómo debe verse un programa de auditoría." },
      { "id": "c", "text": "Porque los organismos de certificación calculan el tiempo de auditoría sobre la misma base." },
      { "id": "d", "text": "Porque el apartado 9.2 de ISO/IEC 42001 exige que el alcance del programa esté documentado." }
    ],
    "correct": ["b"],
    "explanation": "El apartado 5.1 enumera tamaño, naturaleza, funcionalidad, complejidad, riesgos y oportunidades, alcance y madurez: un conjunto de factores sobre este auditado, no una fórmula. El cálculo del tiempo de auditoría por parte de los organismos de certificación es un ejercicio diferente regido por ISO/IEC 17021-1 y, para la IA, por ISO/IEC 42006. El apartado 9.2.2 exige un programa de auditoría que cubra frecuencia, métodos, responsabilidades, requisitos de planificación e informes, no su alcance como tal.",
    "concept_slugs": ["aia-programme-objectives", "aia-objectives-from-context"],
    "bloom_level": "2_understand",
    "difficulty": 4
  }
]
::

::summary
- Un programa de auditoría son los acuerdos para un conjunto de auditorías durante un período de tiempo orientadas hacia un propósito específico: el propósito es lo que lo convierte en un diseño.
- El apartado 5.2 sitúa los objetivos del programa en el cliente de la auditoría y los vincula a su dirección estratégica y contexto.
- Los objetivos que cualquier plan de auditoría serviría por igual están describiendo en lugar de orientando.
- El alcance del programa debería reflejar el tamaño, la naturaleza, la complejidad, los riesgos y la madurez de este auditado.
- Los objetivos del programa orientan un conjunto de auditorías; los objetivos de la auditoría individual establecen qué logra una auditoría, y deben ser coherentes con aquellos.
- Un objetivo del programa que la organización se fijó a sí misma es un requisito que se fijó a sí misma, y puede ser auditado en su contra.
::

```

### 22. RANDOM -- `aims-ia-01-01-who-commissioned-it` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
---
lesson_id: aims-ia-01-01-who-commissioned-it
module_slug: aia-audit-function
certification_code: AIMS-IA
title: Who Commissioned It
subtitle: First, second and third party - and why the consultant running your audit does not change the answer
language: en
lesson_group_id: aims-ia-01-01-who-commissioned-it
duration_minutes: 11
order_index: 1
task_codes: ["1.1"]
concept_slugs:
  - aia-audit-party-types
  - aia-internal-audit-definition
  - aia-audit-client-vs-auditee
prerequisites: []
preview: |
  An 11-minute lesson on the three audit parties, what decides
  which one you are conducting, and why an AI management system
  audit can involve an outside specialist and still be internal.
authors:
  - Certidemy team
status: draft
---

::hook
Your organization has no one who can evaluate a fine-tuned model. You bring in someone who can. Have you just stopped conducting an internal audit?
::

::concept title="Three audits, and technique is not what separates them"
ISO 19011:2026 sets out three types of audit in a table near the front of the standard. What distinguishes them is not how evidence is gathered - an auditor samples, interviews and verifies the same way in all three. What distinguishes them is **who commissioned the audit, whose requirements serve as the criteria, and what the audit can result in.**
```

**es-419**

```
---
lesson_id: aims-ia-01-01-who-commissioned-it
module_slug: aia-audit-function
certification_code: AIMS-IA
title: Quién lo encargó
subtitle: Primera, segunda y tercera parte — y por qué el consultor que conduce su auditoría no cambia la respuesta
language: es-419
lesson_group_id: aims-ia-01-01-who-commissioned-it
duration_minutes: 11
order_index: 1
task_codes: ["1.1"]
concept_slugs:
  - aia-audit-party-types
  - aia-internal-audit-definition
  - aia-audit-client-vs-auditee
prerequisites: []
preview: |
  Una lección de 11 minutos sobre los tres tipos de auditoría, qué
  determina cuál se está realizando y por qué una auditoría de un
  sistema de gestión de IA puede involucrar a un especialista externo
  y seguir siendo interna.
authors:
  - Certidemy team
status: draft
---

::hook
Su organización no cuenta con nadie que pueda evaluar un modelo ajustado. Usted contrata a alguien que sí puede. ¿Ha dejado de realizar una auditoría interna?
::

::concept title="Tres auditorías, y la técnica no es lo que las distingue"
La norma ISO 19011:2026 establece tres tipos de auditoría en una tabla al inicio del documento. Lo que los distingue no es la forma en que se recopila la evidencia — un auditor muestrea, entrevista y verifica de la misma manera en los tres. Lo que los distingue es **quién encargó la auditoría, cuyos requisitos sirven como criterios y qué puede resultar de ella.**
```

### 23. RANDOM -- `aims-ia-05-01-three-things-a-finding-can-be` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
- a **description of or reference to the audit criteria** against which conformity is demonstrated;
- the **audit evidence** to support conformity and effectiveness, if applicable;
- a **declaration of conformity**, if applicable.

Note the same three elements as a nonconformity record, which is not a coincidence: a conformity is a finding, and a finding names its criterion and its evidence either way.

Recording conformities matters more in an internal audit than an external one. The certification body's report is about whether a certificate should issue; yours is information for management, and *this area was examined and found sound, on this evidence* is information. It also distinguishes an area examined and passed from an area never opened - which lesson 03-03's sampling statement addresses from the other direction.
```

**es-419**

```
- una **descripción o referencia a los criterios de auditoría** frente a los cuales se demuestra la conformidad;
- la **evidencia de auditoría** que respalde la conformidad y la eficacia, cuando corresponda;
- una **declaración de conformidad**, cuando corresponda.

Nótese que son los mismos tres elementos que un registro de no conformidad, lo cual no es casualidad: una conformidad es un hallazgo, y un hallazgo nombra su criterio y su evidencia en cualquier caso.

Registrar las conformidades importa más en una auditoría interna que en una externa. El informe del organismo de certificación trata sobre si debería emitirse un certificado; el informe interno es información para la dirección, y *esta área fue examinada y se encontró en buen estado, con esta evidencia* es información. También distingue un área examinada y aprobada de un área que nunca se abrió, algo que la declaración de muestreo de la lección 03-03 aborda desde la otra dirección.
```

### 24. RANDOM -- `aims-ia-05-02-criterion-evidence-gap` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
::concept title="The remedy belongs to the auditee"
ISO 19011:2026 clause 6.7 records that the outcome of an audit can indicate the need for corrections, corrective actions or opportunities for improvement, and that **such actions are normally settled and carried out by the auditee** inside an agreed time frame.

So a finding that prescribes the fix has made a decision that is not the auditor's. Three reasons it is a poor idea, beyond the question of remit:

**It narrows the auditee's options.** *Should implement a mandatory gate in the release process* excludes every other way of meeting clause 8.4 - a scheduled review, a trigger in the change process, a different assignment of responsibility. The auditee may have a better answer.
```

**es-419**

```
::concept title="El remedio corresponde al auditado"
La cláusula 6.7 de la norma ISO 19011:2026 registra que el resultado de una auditoría puede indicar la necesidad de correcciones, acciones correctivas u oportunidades de mejora, y que **tales acciones normalmente son acordadas y llevadas a cabo por el auditado** dentro de un plazo acordado.

Por lo tanto, un hallazgo que prescribe la solución ha tomado una decisión que no corresponde al auditor. Tres razones por las que esto es inadecuado, más allá de la cuestión de las atribuciones:

**Limita las opciones del auditado.** *Debería implementar una compuerta obligatoria en el proceso de lanzamiento* excluye cualquier otra forma de cumplir el apartado 8.4: una revisión programada, un disparador en el proceso de cambio, una asignación diferente de responsabilidades. El auditado puede tener una respuesta mejor.
```

---

## AIMS-IA 2026-09-12 / pt-BR

26 row(s) in this stratum; 4 adversarial, 4 random.

### 25. ADVERSARIAL -- `aims-ia-03-02-enough-to-plan-against` / pt-BR

flags: accent (secao); convem (convem-que not clause-initial); convem (convem-que not clause-initial); convem (convem-que not clause-initial); convem (convem-que not clause-initial)

**EN**

```
That is a defined outcome with named recipients. It is not a matter of the auditor working harder.

The common failure is silent absorption: the documentation is thin, the auditor decides to work it out during fieldwork, and the audit proceeds with its preparation stage effectively skipped. The costs land later - a plan built on guesses, sampling that cannot be justified because the population was never established, and interviews used to discover what a document should have said.

**Inadequate is a judgement against the audit's objectives, scope and criteria**, not against a general standard of tidiness. An organization with sparse documentation and a scope narrow enough that the auditor can still plan is fine. An organization with extensive documentation that never says which systems are in production is not, however thick the folder.
::
```

**pt-BR**

```
Esse é um resultado definido com destinatários nomeados. Não é uma questão de o auditor trabalhar mais.

A falha comum é a absorção silenciosa: a documentação é escassa, o auditor decide resolver isso durante o trabalho de campo, e a auditoria prossegue com sua etapa de preparação efetivamente ignorada. Os custos aparecem depois — um plano construído sobre suposições, amostragem que não pode ser justificada porque a população nunca foi estabelecida, e entrevistas usadas para descobrir o que um documento deveria ter dito.

**Inadequada é um julgamento em relação aos objetivos, escopo e critérios da auditoria**, não em relação a um padrão geral de organização. Uma organização com documentação escassa e um escopo suficientemente estreito para que o auditor ainda possa planejar está bem. Uma organização com documentação extensa que nunca indica quais sistemas estão em produção não está, por mais volumosa que seja a pasta.
::
```

### 26. ADVERSARIAL -- `aims-ia-02-01-a-programme-is-designed-not-scheduled` / pt-BR

flags: accent (secao); convem (convem-que not clause-initial); convem (convem-que not clause-initial); convem (convem-que not clause-initial); convem (convem-que not clause-initial)

**EN**

```
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

::summary
- An audit programme is arrangements for a set of audits over a time frame directed towards a specific purpose - the purpose is what makes it a design.
- Clause 5.2 places programme objectives with the audit client and ties them to its strategic direction and context.
- Objectives that any audit plan would serve equally are describing rather than directing.
- Programme extent should reflect this auditee's size, nature, complexity, risks and maturity.
- Programme objectives direct a set of audits; individual audit objectives state what one audit accomplishes, and must be consistent with them.
- A programme objective the organization set itself is a requirement it set itself, and can be audited against.
::

```

**pt-BR**

```
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

::summary
- Um programa de auditoria é um conjunto de disposições para auditorias ao longo de um período de tempo direcionadas a um propósito específico — o propósito é o que o torna um projeto.
- A Seção 5.2 coloca os objetivos do programa com o cliente da auditoria e os vincula à sua direção estratégica e contexto.
- Objetivos que qualquer plano de auditoria serviria igualmente estão descrevendo, não orientando.
- A extensão do programa convém que reflita o tamanho, a natureza, a complexidade, os riscos e a maturidade deste auditado.
- Os objetivos do programa orientam um conjunto de auditorias; os objetivos da auditoria individual declaram o que uma auditoria realiza, e devem ser consistentes com eles.
- Um objetivo de programa que a organização estabeleceu para si mesma é um requisito que ela estabeleceu para si mesma, e pode ser auditado em relação a ele.
::

```

### 27. ADVERSARIAL -- `aims-ia-02-03-competence-the-team-needs` / pt-BR

flags: accent (secao); convem (convem-que not clause-initial); convem (convem-que not clause-initial); convem (convem-que not clause-initial)

**EN**

```
**For objectivity:** because the expert does not audit, the expert can be closer to the domain than an auditor could be. A data scientist from a different product line can explain evaluation methodology without forming conclusions about their colleagues' work. This is often the cleanest available answer to the independence-against-competence tension from lesson 01-04.
::

::concept title="Every remedy costs something, and the choice is recorded"
Four responses to a competence gap, each with a real cost.

| Remedy | Cost |
|---|---|
| Train the auditor | Lead time, and it does not help this cycle |
| Add a technical expert | Availability; the expert's own proximity to the work must be considered |
| Pair with a competent auditor | Consumes two people's days for one person's coverage |
| Contract an external auditor | Money and lead time; remains a first-party audit |
| Narrow the scope and say so | The area goes unaudited, and the report must state it |
```

**pt-BR**

```
**Para a objetividade:** como o especialista não audita, ele pode estar mais próximo do domínio do que um auditor poderia estar. Um cientista de dados de uma linha de produto diferente pode explicar a metodologia de avaliação sem formar conclusões sobre o trabalho de seus colegas. Essa é frequentemente a resposta mais limpa disponível para a tensão entre independência e competência discutida na lição 01-04.
::

::concept title="Cada solução tem um custo, e a escolha é registrada"
Quatro respostas a uma lacuna de competência, cada uma com um custo real.

| Solução | Custo |
|---|---|
| Treinar o auditor | Prazo de preparação; não ajuda neste ciclo |
| Incluir um especialista técnico | Disponibilidade; a proximidade do especialista com o trabalho deve ser considerada |
| Parear com um auditor competente | Consome os dias de duas pessoas para cobrir o trabalho de uma |
| Contratar um auditor externo | Custo financeiro e prazo; continua sendo uma auditoria de primeira parte |
| Reduzir o escopo e declarar isso | A área fica sem auditoria, e o relatório deve registrar a omissão |
```

### 28. ADVERSARIAL -- `aims-ia-03-08-opening-and-closing` / pt-BR

flags: accent (secao); convem (convem-que not clause-initial); convem (convem-que not clause-initial)

**EN**

```
Everything up to that point is the auditor's own work, checked by the auditor. At the closing meeting the finding meets a person who knows the system, has an interest in it being wrong, and will say so. A finding that survives that is likely to survive the report, the management review and any subsequent challenge. A finding that does not was going to fail somewhere.

The three ways findings fail at closing are worth recognising in advance:

**The evidence is not what the auditor thought.** The record was superseded, the export was filtered, the system shown was staging. This is a good outcome - a wrong finding withdrawn at closing costs the auditor a sentence and costs the organization nothing.
```

**pt-BR**

```
Tudo até esse ponto é o trabalho do próprio auditor, verificado pelo auditor. Na reunião de encerramento, a constatação encontra uma pessoa que conhece o sistema, tem interesse em que ela esteja errada e vai dizê-lo. Uma constatação que sobrevive a isso provavelmente sobreviverá ao relatório, à análise crítica pela direção e a qualquer contestação subsequente. Uma constatação que não sobrevive teria falhado em algum momento.

As três formas pelas quais as constatações falham no encerramento valem ser reconhecidas com antecedência:

**A evidência não é o que o auditor pensava.** O registro foi substituído, a exportação foi filtrada, o sistema mostrado era de homologação. Este é um bom resultado - uma constatação errada retirada no encerramento custa ao auditor uma frase e não custa nada à organização.
```

### 29. RANDOM -- `aims-ia-01-01-who-commissioned-it` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
---
lesson_id: aims-ia-01-01-who-commissioned-it
module_slug: aia-audit-function
certification_code: AIMS-IA
title: Who Commissioned It
subtitle: First, second and third party - and why the consultant running your audit does not change the answer
language: en
lesson_group_id: aims-ia-01-01-who-commissioned-it
duration_minutes: 11
order_index: 1
task_codes: ["1.1"]
concept_slugs:
  - aia-audit-party-types
  - aia-internal-audit-definition
  - aia-audit-client-vs-auditee
prerequisites: []
preview: |
  An 11-minute lesson on the three audit parties, what decides
  which one you are conducting, and why an AI management system
  audit can involve an outside specialist and still be internal.
authors:
  - Certidemy team
status: draft
---

::hook
Your organization has no one who can evaluate a fine-tuned model. You bring in someone who can. Have you just stopped conducting an internal audit?
::

::concept title="Three audits, and technique is not what separates them"
ISO 19011:2026 sets out three types of audit in a table near the front of the standard. What distinguishes them is not how evidence is gathered - an auditor samples, interviews and verifies the same way in all three. What distinguishes them is **who commissioned the audit, whose requirements serve as the criteria, and what the audit can result in.**
```

**pt-BR**

```
---
lesson_id: aims-ia-01-01-who-commissioned-it
module_slug: aia-audit-function
certification_code: AIMS-IA
title: Quem Encomendou
subtitle: Primeira, segunda e terceira parte — e por que o consultor que conduz sua auditoria não muda a resposta
language: pt-BR
lesson_group_id: aims-ia-01-01-who-commissioned-it
duration_minutes: 11
order_index: 1
task_codes: ["1.1"]
concept_slugs:
  - aia-audit-party-types
  - aia-internal-audit-definition
  - aia-audit-client-vs-auditee
prerequisites: []
preview: |
  Uma lição de 11 minutos sobre os três tipos de auditoria, o que
  determina qual deles está sendo conduzido e por que uma auditoria
  de sistema de gestão de IA pode envolver um especialista externo
  e ainda assim ser interna.
authors:
  - Certidemy team
status: draft
---

::hook
Sua organização não tem ninguém capaz de avaliar um modelo ajustado. Você contrata alguém que tem essa capacidade. Você acabou de deixar de conduzir uma auditoria interna?
::

::concept title="Três auditorias, e a técnica não é o que as diferencia"
A ISO 19011:2026 estabelece três tipos de auditoria em uma tabela próxima ao início da norma. O que os distingue não é a forma como as evidências são coletadas — um auditor amostra, entrevista e verifica da mesma maneira nos três tipos. O que os distingue é **quem encomendou a auditoria, cujos requisitos servem como critérios e o que a auditoria pode resultar.**
```

### 30. RANDOM -- `aims-ia-01-05-inside-and-outside-the-remit` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
You ask whether the AIMS conforms to **the organization's own requirements** as well as the standard's, and whether it is effectively implemented and maintained. Your criteria are wider on one axis - the organization's own policy, its declared processes, its stated competence standard - and your output is information nobody outside the organization is entitled to.

That wider criteria set is why "the certification body looked at this" is never an answer to a clause 9.2 question. The certification body did not audit against the organization's own AI policy, and could not have, because it is not their criterion.

The reverse also holds and is worth saying to an anxious auditee: a nonconformity you raise internally is not a certification finding, is not visible to the certification body unless the organization shows them, and is the system working as designed. The whole point of clause 9.2 is that management learns something true before someone else does.
::
```

**pt-BR**

```
Você pergunta se o sistema de gestão de IA está em conformidade com **os requisitos da própria organização**, além dos da norma, e se está efetivamente implementado e mantido. Seus critérios são mais amplos em um eixo — a política de IA da organização, seus processos declarados, seu padrão de competência estabelecido — e seu produto é uma informação à qual ninguém fora da organização tem direito.

Esse conjunto de critérios mais amplo é a razão pela qual "o organismo de certificação examinou isso" nunca é uma resposta a uma questão da Seção 9.2. O organismo de certificação não auditou em relação à política de IA da própria organização e não poderia tê-lo feito, porque esse não é o critério dele.

O inverso também se aplica e vale ser dito a um auditado ansioso: uma não conformidade que você levanta internamente não é uma constatação de certificação, não é visível ao organismo de certificação a menos que a organização a mostre, e é o sistema funcionando conforme projetado. O objetivo central da Seção 9.2 é que a gestão aprenda algo verdadeiro antes que outra pessoa o faça.
::
```

### 31. RANDOM -- `aims-ia-02-07-the-programme-audits-itself` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
::deep-dive title="Auditing your own programme, and the awkwardness of it"
Task 4.x work in module 4 includes auditing clause 9.2 itself - the organization's internal audit programme. Where the person conducting that audit is the person who runs the programme, they are examining their own work, and lesson 01-04's carve-out applies with the safeguards it named.

There is a practical point beyond the objectivity one. The programme manager knows what was deferred, narrowed and skipped, and knows it without needing to look. That knowledge is not audit evidence - clause 4.6 asks that findings and conclusions be based only on the audit evidence - and an auditor who writes a finding from memory has produced something the record does not support, even where it is true.

The discipline is to make the knowledge into evidence: the schedules, the scope changes, the deferral decisions, the follow-up records. If the programme's own records cannot show what the manager already knows, that gap is itself the finding, and it is the clause 9.2.2 documentation requirement it fails.
```

**pt-BR**

```
::deep-dive title="Auditar o próprio programa e o desconforto disso"
O trabalho da tarefa 4.x no módulo 4 inclui auditar a própria Seção 9.2 — o programa de auditoria interna da organização. Quando a pessoa que conduz essa auditoria é a mesma que gerencia o programa, ela está examinando seu próprio trabalho, e a ressalva da lição 01-04 se aplica com as salvaguardas que ela nomeou.

Há um ponto prático além da questão da objetividade. O gestor do programa sabe o que foi adiado, reduzido e ignorado, e sabe isso sem precisar consultar nada. Esse conhecimento não é evidência de auditoria — a Seção 4.6 exige que constatações e conclusões sejam baseadas apenas na evidência de auditoria — e um auditor que registra uma constatação de memória produziu algo que o registro não sustenta, mesmo que seja verdadeiro.

A disciplina é transformar o conhecimento em evidência: os cronogramas, as mudanças de escopo, as decisões de adiamento, os registros de acompanhamento. Se os próprios registros do programa não conseguem mostrar o que o gestor já sabe, essa lacuna é em si a constatação, e é o requisito de documentação da Seção 9.2.2 que ela descumpre.
```

### 32. RANDOM -- `aims-ia-05-03-one-finding-or-several` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
::interactive widget="toggle-and-observe" id="one-fact-three-criteria" concept_slugs="aia-multiple-criteria-findings,aia-combining-vs-separating-findings,aia-criteria-cross-reference"
{
  "scenario_title": "One missing record, three criteria, and a fourth question",
  "intro": "No impact assessment record exists for a model retrained in March. Clause 8.4 applies, control A.5.2 is declared, and the organization's own procedure requires assessment on any training data change. Switch each decision on.",
  "toggles": [
    {
      "id": "identify",
      "label": "All criteria the evidence engages are identified before anything is drafted",
      "off_consequence": "The finding is written against the first criterion that came to mind. The declared control and the organization's own procedure go unmentioned, and clause 9.2.1 makes the second of those a criterion in its own right.",
      "on_consequence": "Annex A.18.4 asks the auditor to consider the effect on corresponding or similar criteria. The full picture is available before the drafting choice is made."
    },
    {
      "id": "test",
      "label": "The auditor asks whether one corrective action would satisfy all three",
      "off_consequence": "The choice between one finding and three is made by habit. Either the count inflates or three criteria hide behind one.",
      "on_consequence": "The question resolves it: performing the assessment and fixing what let it be skipped satisfies all three, so one finding citing three criteria is the right shape.",
      "depends_on": ["identify"]
    },
    {
      "id": "name",
      "label": "All three criteria are named in the finding, not just the primary one",
      "off_consequence": "The closure test runs against the one cited criterion. The declared control and the internal procedure go unchecked, and the auditee was never told they were engaged.",
      "on_consequence": "Annex A.18.3 asks for reference to the audit criteria, plural. Whoever closes the action checks against all three.",
      "depends_on": ["test"]
    },
    {
      "id": "separate",
      "label": "The auditor checks whether any criterion fails for a different reason",
      "off_consequence": "A procedure that was followed correctly but does not itself meet clause 8.4 is hidden inside a finding about a missed assessment, and one corrective action closes both on paper.",
      "on_consequence": "Where a criterion fails for a different reason it needs a different remedy, and that is the case for separating. Over-combining conceals exactly this.",
      "depends_on": ["name"]
    }
  ],
  "reflection_prompt": "Why does the count matter beyond tidiness?",
  "reflection_answer": "Because clause 9.3.2 requires management review to consider trends in nonconformities and corrective actions. A trend driven by how an auditor chose to split findings measures the auditor rather than the management system, and management is making decisions from it. Ten findings from three facts reads as deterioration; one finding hiding three unremedied criteria reads as improvement. Neither is information."
}
::

::deep-dive title="The criterion the auditor keeps forgetting is the organization's own"
Of the three layers in an AIMS finding, the one omitted most often is not the control - it is the organization's own requirement.

Clause 9.2.1 a) 1) names it first: the internal audit provides information on whether the AIMS conforms to **the organization's own requirements for its AI management system**, and then to the requirements of the standard. Lesson 01-03 established it and lesson 02-05 made it a scoping element.
```

**pt-BR**

```
Ele é esquecido porque exige mais trabalho. Os requisitos da norma são os mesmos para todas as organizações e um auditor os carrega entre os compromissos. Os requisitos da própria organização precisam ser encontrados, lidos e compreendidos para cada auditoria — a política de IA, os procedimentos, o padrão de competência que ela estabeleceu, os objetivos que publicou, os compromissos nas justificativas de sua Declaração de Aplicabilidade.

Duas consequências que vale a pena guardar:

**Uma constatação contra um requisito interno é frequentemente a mais sólida disponível.** A organização o redigiu, portanto o critério não está em disputa, e geralmente é mais específico do que a norma — *qualquer mudança nos dados de treinamento aciona uma avaliação* é verificável de uma forma que *quando ocorrem mudanças significativas* não é, porque a organização já definiu o que conta.
```

---

## ISMS-IA 2026-08-12 / es-419

34 row(s) in this stratum; 4 adversarial, 4 random.

### 33. ADVERSARIAL -- `isms-ia-05-05-fixing-it-and-fixing-it` / es-419

flags: structure (quotes en=2 tr=1); ratio (span 1 ratio 3.35 > p95 1.563)

**EN**

```
**Was b) 3) actually done?** The most skippable of the three and the most revealing. Where a finding in one area produced no examination of similar areas, item 3 was not performed - and that is a finding available on almost any corrective action review.

**Method does not matter.** Five whys, fishbone, fault tree, or a paragraph of reasoning by someone who understands the process. The standard prescribes none. What it requires is that causes were determined and that the determination holds up.
::

::interactive widget="drag-match" id="correction-or-corrective-action" concept_slugs="ia-correction-versus-corrective-action,ia-recurrence-prevention,ia-root-cause-analysis-adequacy"
{
  "items": [
    { "id": "a1", "text": "The five suppliers missing security assessments were assessed retrospectively and the files updated." },
    { "id": "a2", "text": "The procurement system now blocks contract approval unless an assessment document is attached." },
    { "id": "a3", "text": "The procurement team attended a refresher session on the supplier onboarding procedure." },
    { "id": "a4", "text": "Someone checked whether the same gap exists in the three other onboarding routes the organization operates." }
  ],
  "targets": [
    { "id": "t-correction", "text": "Correction - clause 10.2 a), addresses the instances" },
    { "id": "t-corrective", "text": "Corrective action - eliminates the cause so it cannot recur by the same route" },
    { "id": "t-neither", "text": "Neither reliably - changes knowledge, not what the arrangement permits" },
    { "id": "t-b3", "text": "Clause 10.2 b) 3) - determining if similar nonconformities exist or could occur" }
  ],
  "correct": {
    "a1": "t-correction",
    "a2": "t-corrective",
    "a3": "t-neither",
    "a4": "t-b3"
  },
  "explanation": "The third is the one organizations offer most and it is the weakest, because the failure here was permitted by the system rather than caused by ignorance - a fully trained team facing the same system produces the same gap. The fourth is the step most often skipped entirely, and it is a named requirement rather than good practice: clause 10.2 b) 3) obliges the organization to determine whether similar nonconformities exist or could potentially occur, which is exactly the question that finds the other three onboarding routes."
}
::
```

**es-419**

```
**¿Se realizó realmente b) 3)?** El más fácil de omitir de los tres y el más revelador. Cuando un hallazgo en un área no generó ningún examen de áreas similares, el punto 3 no se realizó — y eso es un hallazgo disponible en casi cualquier revisión de acción correctiva.

**El método no importa.** Cinco porqués, diagrama de espina de pescado, árbol de fallos, o un párrafo de razonamiento de alguien que entiende el proceso. La norma no prescribe ninguno. Lo que exige es que las causas fueron determinadas y que la determinación se sostiene.
::

::interactive widget="drag-match" id="correction-or-corrective-action" concept_slugs="ia-correction-versus-corrective-action,ia-recurrence-prevention,ia-root-cause-analysis-adequacy"
{
  "items": [
    { "id": "a1", "text": "Los cinco proveedores a los que les faltaba la evaluación de seguridad fueron evaluados de manera retroactiva y los expedientes fueron actualizados." },
    { "id": "a2", "text": "El sistema de adquisiciones ahora bloquea la aprobación del contrato a menos que se adjunte un documento de evaluación." },
    { "id": "a3", "text": "El equipo de adquisiciones asistió a una sesión de actualización sobre el procedimiento de incorporación de proveedores." },
    { "id": "a4", "text": "Alguien verificó si la misma brecha existe en las otras tres rutas de incorporación que opera la organización." }
  ],
  "targets": [
    { "id": "t-correction", "text": "Corrección — apartado 10.2 a), aborda las instancias" },
    { "id": "t-corrective", "text": "Acción correctiva — elimina la causa para que no pueda volver a ocurrir por la misma vía" },
    { "id": "t-neither", "text": "Ninguna de las dos de manera confiable — cambia el conocimiento, no lo que el sistema permite" },
    { "id": "t-b3", "text": "Apartado 10.2 b) 3) — determinar si existen no conformidades similares o podrían ocurrir" }
  ],
  "correct": {
    "a1": "t-correction",
    "a2": "t-corrective",
    "a3": "t-neither",
    "a4": "t-b3"
  },
  "explanation": "La tercera es la que las organizaciones ofrecen con mayor frecuencia y es la más débil, porque el fallo aquí fue permitido por el sistema en lugar de ser causado por ignorancia — un equipo completamente capacitado que enfrenta el mismo sistema produce la misma brecha. La cuarta es el paso que se omite con mayor frecuencia, y es un requisito explícito en lugar de una buena práctica: el apartado 10.2 b) 3) obliga a la organización a determinar si existen no conformidades similares o podrían ocurrir potencialmente, que es exactamente la pregunta que descubre las otras tres rutas de incorporación."
}
::
```

### 34. ADVERSARIAL -- `isms-ia-04-05-competence-awareness-documents` / es-419

flags: structure (quotes en=0 tr=1)

**EN**

```
**7.2 c) actions taken and effectiveness evaluated.** Find someone who was found not competent and had action taken. What was the action, and how did anyone know it worked? If nobody has ever been found lacking, ask how competence is assessed - an assessment that never finds a gap may not be an assessment.

**7.2 d) documented information retained as evidence of competence.** Whatever a) said was needed, is there something on file establishing it?

**Four questions, two people, twenty minutes.** That is a better clause 7.2 audit than reading a training register end to end.
::
```

**es-419**

```
**7.2 c) acciones tomadas y eficacia evaluada.** Encontrar a alguien que haya sido identificado como no competente y se hayan tomado acciones. ¿Cuál fue la acción y cómo supo alguien que funcionó? Si nunca se ha encontrado a nadie con deficiencias, preguntar cómo se evalúa la competencia: una evaluación que nunca detecta una brecha puede no ser realmente una evaluación.

**7.2 d) información documentada conservada como evidencia de competencia.** Cualquiera que sea lo que a) estableció como necesario, ¿hay algo en el expediente que lo acredite?

**Cuatro preguntas, dos personas, veinte minutos.** Eso es una mejor auditoría del apartado 7.2 que leer un registro de capacitación de principio a fin.
::
```

### 35. ADVERSARIAL -- `isms-ia-04-01-what-the-scope-left-out` / es-419

flags: structure (quotes en=3 tr=2)

**EN**

```
::concept title="Clause 4.3 names three inputs"
The scope is not a boundary somebody drew. It is a determination clause 4.3 requires to be made from stated inputs:

> The organization **shall determine the boundaries and applicability** of the ISMS to establish its scope.

Clause 4.3 then names three inputs the organization is required to consider when it does so:
> a) the external and internal issues referred to in 4.1;
> b) the requirements referred to in 4.2;
> c) **interfaces and dependencies between activities performed by the organization, and those that are performed by other organizations.**
>
> The scope shall be available as documented information.
```

**es-419**

```
**Las actividades, ubicaciones y activos pueden excluirse del alcance del SGSI.** Una organización puede certificar una unidad de negocio, tres de cinco sedes, o una única línea de producto. El apartado 4.3 pide que se determinen los límites y la aplicabilidad, lo que presupone que algunas cosas quedan fuera de ellos.

**Los requisitos no pueden excluirse.** El **Capítulo 1 Alcance** de ISO/IEC 27001 establece:

> Excluir cualquiera de los requisitos especificados en los capítulos 4 a 10 no es aceptable cuando una organización declara conformidad con este documento.
```

### 36. ADVERSARIAL -- `isms-ia-01-03-objectivity-of-the-assignment` / es-419

flags: structure (quotes en=2 tr=3)

**EN**

```
Read the second one again. The standard does not prohibit the assignment. It **anticipates** that internal auditors sometimes cannot be independent of what they are auditing, and it tells you what to do about it: remove bias, encourage objectivity, make the effort visible.

That is a more usable position than the maxim, and a more honest one. In an organization of forty people, full independence from every audited activity is not attainable. A standard that pretended otherwise would be ignored.
::

::callout type="terminology"
The phrase "an auditor may not audit their own work" is practice convention. It is a good rule of thumb and the canonical way to fail 9.2.2 b) - but it is not a quotation from either standard, and it should not be presented as one.
::
```

**es-419**

```
::concept title="La independencia es una propiedad de la asignación"
La objetividad no es una credencial que el auditor lleva de un encargo a otro. Se establece, o no, para cada asignación.

El mismo auditor puede ser completamente independiente del proceso de gestión de incidentes y estar totalmente en conflicto respecto a la gestión de accesos, porque desempeña un rol de aprobación de accesos. Nada en la persona cambió. Lo que cambió fue la relación entre la persona y la actividad.

Por lo tanto, la pregunta nunca es "¿es esta persona un auditor independiente?". Es: **dado lo que esta persona hace en la organización, ¿puede evaluar esta actividad basándose únicamente en la evidencia?**
```

### 37. RANDOM -- `isms-ia-03-09-a-trail-someone-else-can-follow` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
::concept title="What a working paper has to contain"
The test is simple and demanding: **could a competent auditor who was not present reach the same conclusion from your record?**

That requires four things, and the first is the one most often thin.

- **The specific evidence.** Not "reviewed access records" but *which* records - the identifier, the date, the system, the query or filter that produced them. Lesson 03-03's point applies: an export you cannot reconstruct is weaker later than it felt at the time.
- **The criterion.** The clause, control, policy or contractual term the evidence was compared against. Named, not implied.
- **What the evidence showed**, separated from what you concluded from it. These get merged in a hurry and the merge is what makes a finding hard to defend.
- **The reliance judgement, where the verification was partial.** Lesson 03-01 asked you to determine reliance; this is where you write down what you determined and why. Reconstructing that months later is not possible.
```

**es-419**

```
::concept title="Qué debe contener un papel de trabajo"
La prueba es simple y exigente: **¿podría un auditor competente que no estuvo presente llegar a la misma conclusión a partir de tu registro?**

Eso requiere cuatro cosas, y la primera es la que más frecuentemente resulta débil.

- **La evidencia específica.** No "se revisaron registros de acceso", sino *cuáles* registros: el identificador, la fecha, el sistema, la consulta o el filtro que los generó. El punto de la lección 03-03 aplica: una exportación que no puedes reconstruir es más débil tiempo después de lo que parecía en el momento.
- **El criterio.** El capítulo, control, política o término contractual con el que se comparó la evidencia. Nombrado, no implícito.
- **Lo que mostró la evidencia**, separado de lo que concluiste a partir de ella. Estos se fusionan con las prisas, y esa fusión es lo que hace difícil defender un hallazgo.
- **El juicio de confianza, cuando la verificación fue parcial.** La lección 03-01 te pidió determinar la confianza; aquí es donde escribes lo que determinaste y por qué. Reconstruir eso meses después no es posible.
```

### 38. RANDOM -- `isms-ia-04-09-the-control-that-passed-last-year` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
**Ask for the rejection records.** Rate, reasons, and how they have moved. This single request establishes whether the control operates, and its trend establishes something about the protected process that nothing else the organization holds does.

**Ask what a reviewer sees.** Watch one review happen if you can, per lesson 03-04's observation method. What is on the screen, what else is open, how long does it take.

**Ask when effectiveness was last established, and against what.** If the answer predates a provider change, a volume change or a scope change, the evidence was drawn under different conditions - and the question is not whether the control failed but whether anyone would know.
```

**es-419**

```
**Solicite los registros de rechazo.** Tasa, motivos y cómo han evolucionado. Esta única solicitud establece si el control opera, y su tendencia establece algo sobre el proceso protegido que ninguna otra cosa que tenga la organización hace.

**Pregunte qué ve un revisor.** Observe una revisión en tiempo real si puede, según el método de observación de la lección 03-04. Qué hay en la pantalla, qué más está abierto, cuánto tiempo toma.

**Pregunte cuándo se estableció por última vez la efectividad, y contra qué.** Si la respuesta es anterior a un cambio de proveedor, un cambio de volumen o un cambio de alcance, la evidencia fue extraída bajo condiciones diferentes — y la pregunta no es si el control falló sino si alguien lo sabría.
```

### 39. RANDOM -- `isms-ia-03-05-the-question-that-gets-evidence` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
1. **Open question** - what happens.
2. **Specific instance** - tell me about the last time, or a recent one.
3. **The artefact** - can we look at the record that produced.

Step three is where the interview stops being an interview and becomes document review. That transition is the productive part. Lesson 03-01's rule applies: the statement never supports the finding; the record you asked for because of the statement does.

**A closed question cannot reach step three**, because it never produced a specific instance to ask about.
::
```

**es-419**

```
**Pregunte sobre el proceso, no sobre la persona.** "¿Qué ocurre cuando..." en lugar de "¿qué hace usted cuando...". La primera invita a una descripción; la segunda invita a una defensa.

**Trate el procedimiento informal como información, no como una confesión.** Cuando alguien describe un atajo, la respuesta útil es curiosidad sobre por qué la vía habitual no funcionó. Ahí es donde realmente está el hallazgo: un control que las personas no pueden seguir es un problema del control, no un problema de disciplina.

**No los corrija.** Si un entrevistado describe algo que no coincide con lo que dice el procedimiento, anótelo y continúe. Explicar el proceso correcto les enseña la respuesta que usted esperaba y detiene el flujo de todo lo que aún no sabía.
```

### 40. RANDOM -- `isms-ia-01-02-principles-in-tension` / es-419

flags: none -- this is the half that tests the checks

**EN**

```
Assign the expert and independence is compromised. Assign someone else and the audit may miss what a competent examination would have caught.

Neither principle wins by rank. The resolution comes from asking what the audit is trying to establish, and what would make its conclusion unreliable. **An audit conducted by someone who cannot understand the evidence produces a conclusion nobody should rely on. An audit conducted by someone auditing their own design produces a conclusion nobody should rely on either.** The answer is usually neither of the two obvious options - it is an arrangement that borrows the competence without borrowing the conflict.
::

::concept title="Evidence-based against risk-based"
The second collision is quieter and more common.
```

**es-419**

```
Asignar al experto compromete la independencia. Asignar a otra persona puede hacer que la auditoría pase por alto lo que un examen competente habría detectado.

Ningún principio gana por jerarquía. La resolución surge de preguntarse qué intenta establecer la auditoría y qué haría que su conclusión fuera poco confiable. **Una auditoría realizada por alguien que no puede comprender la evidencia produce una conclusión en la que nadie debería confiar. Una auditoría realizada por alguien que audita su propio diseño produce una conclusión en la que nadie debería confiar tampoco.** La respuesta suele ser ninguna de las dos opciones obvias — es un arreglo que toma prestada la competencia sin tomar prestado el conflicto.
::

::concept title="Basado en evidencia frente a basado en riesgos"
La segunda colisión es más silenciosa y más frecuente.
```

---

## ISMS-IA 2026-08-12 / pt-BR

31 row(s) in this stratum; 4 adversarial, 4 random.

### 41. ADVERSARIAL -- `isms-ia-04-03-the-whole-of-clause-6` / pt-BR

flags: accent (formula); accent (analise); modal (should x1, no weak modal, 9 obligations vs 7 en)

**EN**

```
And b) is testable in a way people forget: **repeated assessments producing comparable results.** Compare this year's assessment against last year's. If the same risk moved two levels with no change in the environment, the process is not producing comparable results and that is a 6.1.2 b) finding.
::

::callout type="pitfall"
ISO/IEC 27001 does not require a risk register. Clauses 6.1.2 and 6.1.3 require documented information about the **processes**; clauses 8.2 and 8.3 require documented information **of the results**. A register is one good way to satisfy those. A finding that no register exists cites a requirement the standard does not contain.
::

::concept title="6.1.3: treatment, and what Annex A is for"
Clause 6.1.3 requires a defined and applied treatment process that:
```

**pt-BR**

```
E o item b) é verificável de uma forma que as pessoas esquecem: **avaliações repetidas produzindo resultados comparáveis.** Compare a avaliação deste ano com a do ano passado. Se o mesmo risco mudou dois níveis sem nenhuma alteração no ambiente, o processo não está produzindo resultados comparáveis e isso é uma constatação relativa à Seção 6.1.2 b).
::

::callout type="pitfall"
A ISO/IEC 27001 não exige um registro de riscos. As Seções 6.1.2 e 6.1.3 exigem informação documentada sobre os **processos**; as Seções 8.2 e 8.3 exigem informação documentada **dos resultados**. Um registro é uma boa forma de atender a esses requisitos. Uma constatação de que não existe registro cita um requisito que a norma não contém.
::

::concept title="6.1.3: tratamento e para que serve o Anexo A"
A Seção 6.1.3 exige um processo de tratamento definido e aplicado que:
```

### 42. ADVERSARIAL -- `isms-ia-04-05-competence-awareness-documents` / pt-BR

flags: structure (quotes en=0 tr=1); accent (clausula)

**EN**

```
**7.2 c) actions taken and effectiveness evaluated.** Find someone who was found not competent and had action taken. What was the action, and how did anyone know it worked? If nobody has ever been found lacking, ask how competence is assessed - an assessment that never finds a gap may not be an assessment.

**7.2 d) documented information retained as evidence of competence.** Whatever a) said was needed, is there something on file establishing it?

**Four questions, two people, twenty minutes.** That is a better clause 7.2 audit than reading a training register end to end.
::
```

**pt-BR**

```
**7.2 c) ações tomadas e eficácia avaliada.** Encontre alguém que foi identificado como não competente e teve ação tomada. Qual foi a ação, e como alguém soube que funcionou? Se ninguém jamais foi identificado como deficiente, pergunte como a competência é avaliada — uma avaliação que nunca encontra lacunas pode não ser uma avaliação.

**7.2 d) informação documentada retida como evidência de competência.** O que quer que a) tenha declarado como necessário, há algo no arquivo que o estabeleça?

**Quatro perguntas, duas pessoas, vinte minutos.** Isso é uma auditoria da Seção 7.2 melhor do que ler um registro de treinamento do início ao fim.
::
```

### 43. ADVERSARIAL -- `isms-ia-02-02-where-the-effort-goes` / pt-BR

flags: convem (convem-que not clause-initial); convem (convem-que not clause-initial)

**EN**

```
---
lesson_id: isms-ia-02-02-where-the-effort-goes
module_slug: ia-audit-programme
certification_code: ISMS-IA
title: Where the Effort Goes
subtitle: Risk-based frequency, coverage across the cycle, and why clause order is not priority order
language: en
lesson_group_id: isms-ia-02-02-where-the-effort-goes
duration_minutes: 12
order_index: 2
task_codes: ["2.2"]
concept_slugs:
  - ia-risk-based-audit-programme
  - ia-programme-risks-and-opportunities-5-3
  - ia-process-importance-as-prioritisation-factor
  - ia-coverage-across-programme-cycle
  - ia-clause-order-carries-no-priority
prerequisites: [isms-ia-02-01-what-the-programme-is-for]
preview: |
  A 12-minute lesson on allocating finite audit effort by risk and
  importance, achieving coverage across a cycle rather than within
  one audit, and the risks that attach to the programme itself.
authors:
  - Certidemy team
status: draft
---

::hook
Equal time for every area feels fair. It guarantees that the areas which matter most are examined least thoroughly.
::

::concept title="The risk-based approach is not a suggestion"
ISO 19011:2026 makes the risk-based approach one of its seven principles, and its wording is unusually firm for a guidance document:
```

**pt-BR**

```
---
lesson_id: isms-ia-02-02-where-the-effort-goes
module_slug: ia-audit-programme
certification_code: ISMS-IA
title: Para Onde Vai o Esforço
subtitle: Frequência baseada em risco, cobertura ao longo do ciclo e por que a ordem das seções não é ordem de prioridade
language: pt-BR
lesson_group_id: isms-ia-02-02-where-the-effort-goes
duration_minutes: 12
order_index: 2
task_codes: ["2.2"]
concept_slugs:
  - ia-risk-based-audit-programme
  - ia-programme-risks-and-opportunities-5-3
  - ia-process-importance-as-prioritisation-factor
  - ia-coverage-across-programme-cycle
  - ia-clause-order-carries-no-priority
prerequisites: [isms-ia-02-01-what-the-programme-is-for]
preview: |
  Uma lição de 12 minutos sobre como alocar o esforço finito de auditoria
  por risco e importância, alcançar cobertura ao longo de um ciclo em vez
  de em uma única auditoria, e os riscos que recaem sobre o próprio programa.
authors:
  - Certidemy team
status: draft
---

::hook
Dedicar tempo igual a cada área parece justo. Isso garante que as áreas que mais importam sejam examinadas com menos profundidade.
::

::concept title="A abordagem baseada em risco não é uma sugestão"
A ISO 19011:2026 torna a abordagem baseada em risco um de seus sete princípios, e sua redação é incomumente firme para um documento de orientação:
```

### 44. ADVERSARIAL -- `isms-ia-05-05-fixing-it-and-fixing-it` / pt-BR

flags: structure (quotes en=2 tr=1); ratio (span 1 ratio 2.94 > p95 1.461)

**EN**

```
**Was b) 3) actually done?** The most skippable of the three and the most revealing. Where a finding in one area produced no examination of similar areas, item 3 was not performed - and that is a finding available on almost any corrective action review.

**Method does not matter.** Five whys, fishbone, fault tree, or a paragraph of reasoning by someone who understands the process. The standard prescribes none. What it requires is that causes were determined and that the determination holds up.
::

::interactive widget="drag-match" id="correction-or-corrective-action" concept_slugs="ia-correction-versus-corrective-action,ia-recurrence-prevention,ia-root-cause-analysis-adequacy"
{
  "items": [
    { "id": "a1", "text": "The five suppliers missing security assessments were assessed retrospectively and the files updated." },
    { "id": "a2", "text": "The procurement system now blocks contract approval unless an assessment document is attached." },
    { "id": "a3", "text": "The procurement team attended a refresher session on the supplier onboarding procedure." },
    { "id": "a4", "text": "Someone checked whether the same gap exists in the three other onboarding routes the organization operates." }
  ],
  "targets": [
    { "id": "t-correction", "text": "Correction - clause 10.2 a), addresses the instances" },
    { "id": "t-corrective", "text": "Corrective action - eliminates the cause so it cannot recur by the same route" },
    { "id": "t-neither", "text": "Neither reliably - changes knowledge, not what the arrangement permits" },
    { "id": "t-b3", "text": "Clause 10.2 b) 3) - determining if similar nonconformities exist or could occur" }
  ],
  "correct": {
    "a1": "t-correction",
    "a2": "t-corrective",
    "a3": "t-neither",
    "a4": "t-b3"
  },
  "explanation": "The third is the one organizations offer most and it is the weakest, because the failure here was permitted by the system rather than caused by ignorance - a fully trained team facing the same system produces the same gap. The fourth is the step most often skipped entirely, and it is a named requirement rather than good practice: clause 10.2 b) 3) obliges the organization to determine whether similar nonconformities exist or could potentially occur, which is exactly the question that finds the other three onboarding routes."
}
::
```

**pt-BR**

```
**O item b) 3) foi realmente executado?** O mais fácil de pular dos três e o mais revelador. Onde um achado em uma área não produziu nenhum exame de áreas semelhantes, o item 3 não foi realizado — e isso é um achado disponível em quase qualquer análise de ação corretiva.

**O método não importa.** Cinco porquês, diagrama de Ishikawa, árvore de falhas ou um parágrafo de raciocínio de alguém que entende o processo. A norma não prescreve nenhum. O que ela exige é que as causas foram determinadas e que a determinação se sustenta.
::

::interactive widget="drag-match" id="correction-or-corrective-action" concept_slugs="ia-correction-versus-corrective-action,ia-recurrence-prevention,ia-root-cause-analysis-adequacy"
{
  "items": [
    { "id": "a1", "text": "Os cinco fornecedores sem avaliações de segurança foram avaliados retroativamente e os arquivos atualizados." },
    { "id": "a2", "text": "O sistema de aquisição agora bloqueia a aprovação do contrato a menos que um documento de avaliação esteja anexado." },
    { "id": "a3", "text": "A equipe de aquisição participou de uma sessão de atualização sobre o procedimento de integração de fornecedores." },
    { "id": "a4", "text": "Alguém verificou se a mesma lacuna existe nas outras três rotas de integração que a organização opera." }
  ],
  "targets": [
    { "id": "t-correction", "text": "Correção — Seção 10.2 a), trata das ocorrências" },
    { "id": "t-corrective", "text": "Ação corretiva — elimina a causa para que não possa se repetir pelo mesmo caminho" },
    { "id": "t-neither", "text": "Nenhuma das duas de forma confiável — muda o conhecimento, não o que o arranjo permite" },
    { "id": "t-b3", "text": "Seção 10.2 b) 3) — determinação se não conformidades semelhantes existem ou poderiam ocorrer" }
  ],
  "correct": {
    "a1": "t-correction",
    "a2": "t-corrective",
    "a3": "t-neither",
    "a4": "t-b3"
  },
  "explanation": "A terceira é a que as organizações oferecem com mais frequência e é a mais fraca, porque a falha aqui foi permitida pelo sistema e não causada pela ignorância — uma equipe totalmente treinada diante do mesmo sistema produz a mesma lacuna. A quarta é a etapa mais frequentemente ignorada por completo, e é um requisito explícito e não uma boa prática: a Seção 10.2 b) 3) obriga a organização a determinar se não conformidades semelhantes existem ou poderiam potencialmente ocorrer, que é exatamente a pergunta que encontra as outras três rotas de integração."
}
::
```

### 45. RANDOM -- `isms-ia-03-05-the-question-that-gets-evidence` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
1. **Open question** - what happens.
2. **Specific instance** - tell me about the last time, or a recent one.
3. **The artefact** - can we look at the record that produced.

Step three is where the interview stops being an interview and becomes document review. That transition is the productive part. Lesson 03-01's rule applies: the statement never supports the finding; the record you asked for because of the statement does.

**A closed question cannot reach step three**, because it never produced a specific instance to ask about.
::
```

**pt-BR**

```
1. **Pergunta aberta** — o que acontece.
2. **Instância específica** — fale sobre a última vez, ou uma recente.
3. **O artefato** — podemos ver o registro que isso gerou.

O terceiro passo é onde a entrevista deixa de ser uma entrevista e se torna revisão de documentos. Essa transição é a parte produtiva. A regra da lição 03-01 se aplica: a declaração nunca sustenta a constatação; o registro que você solicitou por causa da declaração, sim.

**Uma pergunta fechada não consegue chegar ao terceiro passo**, porque nunca produziu uma instância específica sobre a qual perguntar.
::
```

### 46. RANDOM -- `isms-ia-05-02-one-instance-or-a-pattern` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
Which is the point worth holding: **a single finding can be systemic.** One exception, in a process where the control is impossible to follow as written, is evidence about the arrangement. Counting instances is a useful signal and it is not the test.

**The reverse is also true.** Five findings that share nothing but a report are five findings, and grouping them to look decisive is its own distortion.
::

::interactive widget="scenario-mcq" id="isolated-or-systemic" concept_slugs="ia-isolated-versus-systemic-failure,ia-nonconformity-determination,ia-absence-of-evidence-versus-evidence-of-absence"
{
  "scenario_title": "Four findings, or one",
  "steps": [
    {
      "id": "step-1",
      "situation": "Auditing a distributor. You find four instances of supplier security assessments missing before contract signature, in four different business units. Each unit uses the same procurement system. The procedure requires the assessment to be attached before the contract can be approved; the system allows approval without it.",
      "question": "How do you report this?",
      "options": [
        { "id": "a", "text": "Four nonconformities, one per business unit", "next": "step-1a" },
        { "id": "b", "text": "One nonconformity: the arrangement permits approval without the required assessment, evidenced in four units", "next": "step-2" },
        { "id": "c", "text": "One nonconformity per unit, plus an observation that the system permits it", "next": "step-1c" }
      ]
    },
    {
      "id": "step-1a",
      "situation": "Four separate findings send four business units to fix their own behaviour. Each will, and the next contract approved in a fifth unit will have the same gap - because nothing about the arrangement changed. The units did not cause this; the system permitted it.",
      "question": "Try again.",
      "options": [
        { "id": "b", "text": "One nonconformity about the arrangement, evidenced in four units", "next": "step-2" },
        { "id": "c", "text": "Four nonconformities plus an observation about the system", "next": "step-1c" }
      ]
    },
    {
      "id": "step-1c",
      "situation": "Closer, and it puts the cause in the weaker category. An observation typically requires no action, so the thing that actually needs fixing is the part nobody must act on, while four units are asked to try harder.",
      "question": "Try again.",
      "options": [
        { "id": "b", "text": "One nonconformity about the arrangement, evidenced in four units", "next": "step-2" }
      ]
    },
    {
      "id": "step-2",
      "situation": "Correct. The procurement lead responds: this is really four separate lapses by four teams, and each team has been reminded of the procedure.",
      "question": "What is the useful reply?",
      "options": [
        { "id": "a", "text": "Accept it - the corrective action addresses each instance", "next": "step-2a" },
        { "id": "b", "text": "Ask what would prevent the same thing in a fifth unit next month, given the system still permits approval without the assessment", "next": "step-3" },
        { "id": "c", "text": "Escalate to top management as a leadership failure", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2a",
      "situation": "Reminding people is a correction - it addresses the instances. Clause 10.2 b) requires evaluating the need for action to eliminate the causes so it does not recur or occur elsewhere. Four reminders leave the cause untouched, and lesson 05-05 takes this apart properly.",
      "question": "Try again.",
      "options": [
        { "id": "b", "text": "Ask what prevents recurrence in a fifth unit", "next": "step-3" },
        { "id": "c", "text": "Escalate as a leadership failure", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2c",
      "situation": "Nothing in the evidence points at leadership. A system that permits a step to be skipped is a design issue, and characterising it as a leadership failure makes the conversation about blame rather than about the gate that is missing.",
      "question": "Try again.",
      "options": [
        { "id": "b", "text": "Ask what prevents recurrence in a fifth unit", "next": "step-3" }
      ]
    },
    {
      "id": "step-3",
      "situation": "The question lands. The procurement lead had not considered that the system permits it, and raises a change request for a mandatory attachment gate.",
      "question": "What made the difference?",
      "options": [
        { "id": "a", "text": "The auditor was persistent" },
        { "id": "b", "text": "The finding located the failure in the arrangement rather than in four teams, so the response could address the cause" },
        { "id": "c", "text": "Escalation created pressure" }
      ]
    }
  ],
  "best_path": ["step-1:b", "step-2:b", "step-3:b"],
  "explanation": "Four instances sharing one system and one procedure are evidence about the arrangement, and where the arrangement makes non-compliance possible and easy the failure is systemic regardless of the count. Note what the finding does not do: it does not blame the four units, whose behaviour was permitted by the system they were given. And note the connection to clause 10.2 b) 3) - determining whether similar nonconformities exist or could occur is the organization's obligation, and a finding written per-unit makes that determination harder rather than easier."
}
::
```

**pt-BR**

```
Que é o ponto que vale guardar: **uma única constatação pode ser sistêmica.** Uma exceção, em um processo onde o controle é impossível de seguir como escrito, é evidência sobre o arranjo. Contar instâncias é um sinal útil e não é o teste.

**O inverso também é verdadeiro.** Cinco constatações que não compartilham nada além de um relatório são cinco constatações, e agrupá-las para parecer decisivo é sua própria distorção.
::

::interactive widget="scenario-mcq" id="isolated-or-systemic" concept_slugs="ia-isolated-versus-systemic-failure,ia-nonconformity-determination,ia-absence-of-evidence-versus-evidence-of-absence"
{
  "scenario_title": "Quatro constatações, ou uma",
  "steps": [
    {
      "id": "step-1",
      "situation": "Auditando um distribuidor. Você encontra quatro instâncias de avaliações de segurança de fornecedores ausentes antes da assinatura do contrato, em quatro unidades de negócio diferentes. Cada unidade usa o mesmo sistema de compras. O procedimento exige que a avaliação seja anexada antes que o contrato possa ser aprovado; o sistema permite a aprovação sem ela.",
      "question": "Como você relata isso?",
      "options": [
        { "id": "a", "text": "Quatro não conformidades, uma por unidade de negócio", "next": "step-1a" },
        { "id": "b", "text": "Uma não conformidade: o arranjo permite a aprovação sem a avaliação exigida, evidenciada em quatro unidades", "next": "step-2" },
        { "id": "c", "text": "Uma não conformidade por unidade, mais uma observação de que o sistema o permite", "next": "step-1c" }
      ]
    },
    {
      "id": "step-1a",
      "situation": "Quatro constatações separadas enviam quatro unidades de negócio para corrigir seu próprio comportamento. Cada uma o fará, e o próximo contrato aprovado em uma quinta unidade terá a mesma lacuna — porque nada no arranjo mudou. As unidades não causaram isso; o sistema o permitiu.",
      "question": "Tente novamente.",
      "options": [
        { "id": "b", "text": "Uma não conformidade sobre o arranjo, evidenciada em quatro unidades", "next": "step-2" },
        { "id": "c", "text": "Quatro não conformidades mais uma observação sobre o sistema", "next": "step-1c" }
      ]
    },
    {
      "id": "step-1c",
      "situation": "Mais próximo, e coloca a causa na categoria mais fraca. Uma observação normalmente não requer ação, portanto o que realmente precisa ser corrigido fica na parte que ninguém é obrigado a agir, enquanto quatro unidades são solicitadas a se esforçar mais.",
      "question": "Tente novamente.",
      "options": [
        { "id": "b", "text": "Uma não conformidade sobre o arranjo, evidenciada em quatro unidades", "next": "step-2" }
      ]
    },
    {
      "id": "step-2",
      "situation": "Correto. O responsável pelas compras responde: na verdade, são quatro falhas separadas de quatro equipes, e cada equipe foi lembrada do procedimento.",
      "question": "Qual é a resposta útil?",
      "options": [
        { "id": "a", "text": "Aceitar — a ação corretiva aborda cada instância", "next": "step-2a" },
        { "id": "b", "text": "Perguntar o que impediria o mesmo problema em uma quinta unidade no próximo mês, dado que o sistema ainda permite a aprovação sem a avaliação", "next": "step-3" },
        { "id": "c", "text": "Escalar para a alta direção como uma falha de liderança", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2a",
      "situation": "Lembrar as pessoas é uma correção — ela aborda as instâncias. A Seção 10.2 b) exige avaliar a necessidade de ação para eliminar as causas de modo que não se repita ou ocorra em outro lugar. Quatro lembretes deixam a causa intocada, e a Lição 05-05 analisa isso adequadamente.",
      "question": "Tente novamente.",
      "options": [
        { "id": "b", "text": "Perguntar o que impede a recorrência em uma quinta unidade", "next": "step-3" },
        { "id": "c", "text": "Escalar como uma falha de liderança", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2c",
      "situation": "Nada na evidência aponta para a liderança. Um sistema que permite que uma etapa seja ignorada é um problema de design, e caracterizá-lo como uma falha de liderança torna a conversa sobre culpa em vez de sobre a barreira que está faltando.",
      "question": "Tente novamente.",
      "options": [
        { "id": "b", "text": "Perguntar o que impede a recorrência em uma quinta unidade", "next": "step-3" }
      ]
    },
    {
      "id": "step-3",
      "situation": "A pergunta surte efeito. O responsável pelas compras não havia considerado que o sistema o permite e abre uma solicitação de mudança para uma barreira obrigatória de anexo.",
      "question": "O que fez a diferença?",
      "options": [
        { "id": "a", "text": "O auditor foi persistente" },
        { "id": "b", "text": "A constatação localizou a falha no arranjo, e não em quatro equipes, de modo que a resposta pôde abordar a causa" },
        { "id": "c", "text": "A escalada criou pressão" }
      ]
    }
  ],
  "best_path": ["step-1:b", "step-2:b", "step-3:b"],
  "explanation": "Quatro instâncias que compartilham um sistema e um procedimento são evidência sobre o arranjo, e quando o arranjo torna o não cumprimento possível e fácil, a falha é sistêmica independentemente da contagem. Note o que a constatação não faz: ela não culpa as quatro unidades, cujo comportamento foi permitido pelo sistema que lhes foi dado. E note a conexão com a Seção 10.2 b) 3) — determinar se não conformidades similares existem ou poderiam ocorrer é a obrigação da organização, e uma constatação escrita por unidade torna essa determinação mais difícil, e não mais fácil."
}
::
```

### 47. RANDOM -- `isms-ia-01-05-which-document-says-what` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
- The **two-stage initial audit**, surveillance visits, and the recertification cycle.
- The **certificate validity period**.
- The **major and minor nonconformity** distinction.

**None of those appears in ISO/IEC 27001.** It contains no conformity assessment provisions at all. If you cite a three-year cycle or a major nonconformity to ISO/IEC 27001, you have attributed a real thing to the wrong document - and an auditee who knows the standard will notice.
::

::callout type="exam-watch"
Three claims commonly attributed to ISO/IEC 27001 that are not in it: the requirement for a risk register, the major/minor severity scheme, and the certification cycle. Each is real practice, and each belongs somewhere else.
::
```

**pt-BR**

```
Uma constatação defensável tem três partes, e é na primeira que os erros de atribuição aparecem.

1. **O requisito.** Identificado especificamente - uma seção da ISO/IEC 27001, um controle que a organização incluiu em sua Declaração de Aplicabilidade, uma declaração na própria política da organização, uma obrigação contratual ou legal.
2. **A evidência.** O que foi examinado e o que revelou.
3. **A lacuna.** Como a evidência não satisfaz o requisito.

Se o passo um produz "todo mundo sabe disso" ou "é uma boa prática", pare. Ou localize o requisito nos critérios, ou a constatação é uma observação sobre a prática, e não uma não conformidade - o que ainda pode valer a pena relatar, mas não como falha contra uma norma.
```

### 48. RANDOM -- `isms-ia-05-04-what-the-report-must-disclose` / pt-BR

flags: none -- this is the half that tests the checks

**EN**

```
::concept title="What the report is for"
ISO 19011:2026 covers preparing the audit report as its own step. The report is the audit's product - for most readers it is the only part of the audit they will ever see.

Which sets the standard for what belongs in it: **a reader must be able to assess the conclusions.** Not re-perform the audit, and not take the conclusions on trust. Assess them.

That requires knowing at minimum what was examined, against what criteria, and how - which is why lesson 03-02 insisted on recording the population and the selection basis. A conclusion whose basis is invisible asks for trust rather than offering assessment.
```

**pt-BR**

```
::concept title="Para que serve o relatório"
A ISO 19011:2026 trata a elaboração do relatório de auditoria como uma etapa própria. O relatório é o produto da auditoria — para a maioria dos leitores, é a única parte da auditoria que eles verão.

Isso define o padrão para o que deve constar nele: **o leitor deve ser capaz de avaliar as conclusões.** Não de refazer a auditoria, nem de aceitar as conclusões por confiança. Avaliá-las.

Para isso, é necessário saber, no mínimo, o que foi examinado, com base em quais critérios e como — razão pela qual a lição 03-02 insistiu em registrar a população e o critério de seleção. Uma conclusão cuja base é invisível pede confiança em vez de oferecer avaliação.
```
