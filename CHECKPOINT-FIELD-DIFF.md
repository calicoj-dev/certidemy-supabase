# Checkpoint field diff -- `BATCH1-RETRANSLATION.json`

A `::checkpoint` block is one markdown block and thirty-odd independently translated
fields. Emitted as a block, a rewrite of one option arrives as a rewrite of everything.
Fields pair by **id**, never by position, so a reordered or dropped option is reported
rather than silently compared against its neighbour.

| block | fields | changed | unchanged | machine drift |
|---|---|---|---|---|
| `01-03-the-ai-system-life-cycle es-419 b21` | 24 | **14** | 10 | none |
| `01-03-the-ai-system-life-cycle pt-BR b21` | 24 | **17** | 7 | none |
| `05-02-aims-internal-audit es-419 b28` | 24 | **18** | 6 | none |
| `05-02-aims-internal-audit pt-BR b28` | 24 | **18** | 6 | none |

**67 fields changed, 29 left alone, 0 machine drift.**

## `01-03-the-ai-system-life-cycle es-419 b21`

**`q1.question`**

- was: Un equipo confirma que su modelo desplegado no utiliza aprendizaje continuo y concluye que su comportamiento es, por lo tanto, estable. ¿Qué se ha pasado por alto?
- now: Un equipo confirma que su modelo desplegado no utiliza aprendizaje continuo y concluye que su comportamiento es, por tanto, estable. ¿Qué se ha pasado por alto?

**`q1.option.c`**

- was: El aprendizaje continuo es obligatorio para los sistemas dentro del alcance de un sistema de gestión de IA
- now: El aprendizaje continuo es obligatorio para los sistemas dentro del alcance de un SGia

**`q1.explanation`**

- was: Dos mecanismos mueven el comportamiento. El aprendizaje continuo cambia el modelo; la deriva cambia el ajuste entre un modelo estático y un mundo en movimiento. El monitoreo es lo que identifica la necesidad de reentrenamiento en el segundo caso, y un equipo que ha descartado el primero a menudo deja de monitorear el segundo.
- now: Dos mecanismos modifican el comportamiento. El aprendizaje continuo cambia el modelo; la deriva cambia el ajuste entre un modelo estático y un mundo en movimiento. El monitoreo es lo que identifica la necesidad de reentrenamiento en el segundo caso, y un equipo que ha descartado el primero suele dejar de monitorear el segundo.

**`q2.question`**

- was: ¿Cuál afirmación sobre las etapas del ciclo de vida es correcta?
- now: ¿Cuál de las siguientes afirmaciones sobre las etapas del ciclo de vida es correcta?

**`q2.option.b`**

- was: Una organización puede especificar sus propias etapas y debe definir criterios y requisitos para cada una
- now: Una organización puede especificar sus propias etapas, y debe definir criterios y requisitos para cada una

**`q2.option.c`**

- was: Las etapas solo son relevantes para las organizaciones que desarrollan sistemas de IA
- now: Las etapas son relevantes únicamente para las organizaciones que desarrollan sistemas de IA

**`q2.option.d`**

- was: Las etapas están definidas en el Anexo A y no pueden modificarse
- now: Las etapas se definen en el Anexo A y no pueden modificarse

**`q2.explanation`**

- was: Hay un modelo genérico disponible en ISO/IEC 22989 y procesos del ciclo de vida en ISO/IEC 5338, pero la norma permite que una organización especifique sus propias etapas. Lo que exige es que se definan criterios y requisitos para cada etapa en uso.
- now: En ISO/IEC 22989 se dispone de un modelo genérico y en ISO/IEC 5338 de procesos del ciclo de vida, pero la norma permite que una organización especifique sus propias etapas. Lo que exige es que se definan criterios y requisitos para cada etapa en uso.

**`q3.question`**

- was: ¿Por qué aparece la frase 'a lo largo de su ciclo de vida' en tantos objetivos de control?
- now: ¿Por qué aparece la expresión 'a lo largo de su ciclo de vida' en tantos objetivos de control?

**`q3.option.a`**

- was: Señala que las obligaciones se vinculan durante toda la existencia de un sistema, no en un momento de aprobación
- now: Señala que las obligaciones se aplican durante toda la existencia de un sistema, no en el momento de su aprobación

**`q3.explanation`**

- was: La evaluación de impacto, la documentación de recursos, el reporte de preocupaciones y la asignación de responsabilidades a terceros la incluyen. La repetición establece que el ciclo de vida, y no la fecha de lanzamiento, es el período durante el cual rigen las obligaciones. Los controles del Anexo A son todos controles de referencia; la frase no dice nada sobre el carácter obligatorio.
- now: La evaluación de impacto, la documentación de recursos, la notificación de preocupaciones y la asignación de responsabilidades a terceros la incluyen. La repetición establece que el ciclo de vida, y no la fecha de lanzamiento, es el período durante el cual rigen las obligaciones. Los controles del Anexo A son todos controles de referencia; la expresión no dice nada sobre su carácter obligatorio.

**`q4.question`**

- was: Un sistema es reentrenado con doce meses de nuevos datos de producción y vuelto a desplegar. ¿Qué exige más directamente la norma?
- now: Un sistema es reentrenado con doce meses de nuevos datos de producción y se vuelve a desplegar. ¿Qué exige más directamente la norma?

**`q4.option.a`**

- was: Nada adicional, ya que el sistema fue evaluado antes de su despliegue original
- now: Nada más, dado que el sistema fue evaluado antes de su despliegue original

**`q4.explanation`**

- was: Las evaluaciones del riesgo y las evaluaciones de impacto se realizan a intervalos planificados o cuando se proponen o producen cambios significativos. El reentrenamiento con nuevos datos constituye dicho cambio. La Declaración de Aplicabilidad registra qué controles son necesarios y por qué; no cambia automáticamente porque un sistema haya sido reentrenado.
- now: Las evaluaciones de riesgo y las evaluaciones de impacto se realizan en los intervalos planificados o ante un cambio significativo, lo que ocurra primero, y ninguna espera a la otra. El reentrenamiento con nuevos datos constituye dicho cambio. La Declaración de Aplicabilidad registra qué controles son necesarios y por qué; no cambia automáticamente porque un sistema haya sido reentrenado.

## `01-03-the-ai-system-life-cycle pt-BR b21`

**`q1.question`**

- was: Uma equipe confirma que seu modelo implantado não utiliza aprendizado contínuo e conclui que seu comportamento é, portanto, estável. O que foi negligenciado?
- now: Uma equipe confirma que seu modelo implantado não utiliza aprendizado contínuo e conclui que seu comportamento é, portanto, estável. O que foi ignorado?

**`q1.option.b`**

- was: A deriva de conceito ou de dados nos dados de produção pode alterar o desempenho mesmo sem aprendizado
- now: O desvio de conceito ou de dados nos dados de produção pode alterar o desempenho mesmo sem aprendizado

**`q1.option.c`**

- was: O aprendizado contínuo é obrigatório para sistemas dentro do escopo de um sistema de gestão de IA
- now: O aprendizado contínuo é obrigatório para sistemas dentro do escopo de um SGIA

**`q1.explanation`**

- was: Dois mecanismos alteram o comportamento. O aprendizado contínuo muda o modelo; a deriva muda o ajuste entre um modelo estático e um mundo em movimento. O monitoramento é o que identifica a necessidade de retreinamento no segundo caso, e uma equipe que descartou o primeiro mecanismo frequentemente para de monitorar o segundo.
- now: Dois mecanismos alteram o comportamento. O aprendizado contínuo modifica o modelo; o desvio altera o ajuste entre um modelo estático e um mundo em movimento. O monitoramento é o que identifica a necessidade de retreinamento no segundo caso, e uma equipe que descartou o primeiro frequentemente deixa de monitorar o segundo.

**`q2.question`**

- was: Qual afirmação sobre as etapas do ciclo de vida é precisa?
- now: Qual afirmação sobre as fases do ciclo de vida está correta?

**`q2.option.a`**

- was: A norma prescreve um conjunto fixo de etapas que toda organização deve adotar
- now: A norma prescreve um conjunto fixo de fases que toda organização deve adotar

**`q2.option.b`**

- was: Uma organização pode especificar suas próprias etapas e deve definir critérios e requisitos para cada uma delas
- now: Uma organização pode especificar suas próprias fases e deve definir critérios e requisitos para cada uma

**`q2.option.c`**

- was: As etapas são relevantes apenas para organizações que desenvolvem sistemas de IA
- now: As fases são relevantes apenas para organizações que desenvolvem sistemas de IA

**`q2.option.d`**

- was: As etapas são definidas no Anexo A e não podem ser alteradas
- now: As fases são definidas no Anexo A e não podem ser alteradas

**`q2.explanation`**

- was: Um modelo genérico está disponível na ISO/IEC 22989 e os processos do ciclo de vida na ISO/IEC 5338, mas a norma permite que uma organização especifique suas próprias etapas. O que ela exige é que critérios e requisitos sejam definidos para cada etapa em uso.
- now: Um modelo genérico está disponível na ISO/IEC 22989 e os processos do ciclo de vida na ISO/IEC 5338, mas a norma permite que uma organização especifique suas próprias fases. O que ela requer é que critérios e requisitos sejam definidos para cada fase em uso.

**`q3.option.a`**

- was: Ela sinaliza que as obrigações se vinculam a toda a existência de um sistema, e não a um momento de aprovação
- now: Ela sinaliza que as obrigações se aplicam durante toda a existência do sistema, e não apenas no momento de sua aprovação

**`q3.explanation`**

- was: A avaliação de impacto, a documentação de recursos, o reporte de preocupações e a alocação de responsabilidades a terceiros — todos carregam essa expressão. A repetição estabelece que o ciclo de vida, e não a data de lançamento, é o período durante o qual as obrigações vigoram. Os controles do Anexo A são todos controles de referência; a expressão não diz nada sobre o caráter obrigatório.
- now: A avaliação de impacto, a documentação de recursos, o reporte de preocupações e a alocação de responsabilidades a terceiros, todos a carregam. A repetição estabelece que o ciclo de vida, e não a data de lançamento, é o período durante o qual as obrigações vigoram. Os controles do Anexo A são todos controles de referência; a expressão nada diz sobre caráter obrigatório.

**`q4.question`**

- was: Um sistema é retreinado com doze meses de novos dados de produção e reimplantado. O que a norma exige mais diretamente?
- now: Um sistema é retreinado com doze meses de novos dados de produção e reimplantado. O que a norma requer mais diretamente?

**`q4.option.a`**

- was: Nada além do que já foi feito, pois o sistema foi avaliado antes de sua implantação original
- now: Nada além disso, pois o sistema foi avaliado antes de sua implantação original

**`q4.option.c`**

- was: As avaliações são reativadas, pois ocorreu uma mudança significativa
- now: As avaliações devem ser retomadas, pois ocorreu uma mudança significativa

**`q4.option.d`**

- was: Notificação ao organismo de certificação antes da reimplantação
- now: Notificação do organismo de certificação antes da reimplantação

**`q4.explanation`**

- was: As avaliações de riscos e as avaliações de impacto são realizadas em intervalos planejados ou quando mudanças significativas são propostas ou ocorrem. O retreinamento com novos dados constitui tal mudança. A Declaração de Aplicabilidade registra quais controles são necessários e por quê; ela não muda automaticamente porque um sistema foi retreinado.
- now: As avaliações de risco e de impacto são realizadas nos intervalos planejados ou diante de uma mudança significativa — o que ocorrer primeiro, sem que uma aguarde a outra. O retreinamento com novos dados constitui tal mudança. A Declaração de Aplicabilidade registra quais controles são necessários e por quê; ela não se altera automaticamente pelo fato de o sistema ter sido retreinado.

## `05-02-aims-internal-audit es-419 b28`

**`q1.question`**

- was: ¿Contra qué criterios exige el apartado 9.2.1 que las auditorías internas verifiquen la conformidad?
- now: ¿Contra qué criterios el apartado 9.2.1 exige que las auditorías internas verifiquen la conformidad?

**`q1.option.b`**

- was: Los requisitos propios de la organización para su sistema de gestión de IA, y los requisitos de la norma
- now: Los requisitos propios de la organización para su SGAI y los requisitos de la norma

**`q1.explanation`**

- was: Ambos, más si el sistema está implementado y mantenido de manera eficaz. Los requisitos propios de la organización — su política, objetivos y procesos documentados — son la mitad que más frecuentemente se omite, y incumplir las propias reglas suele preceder al incumplimiento de las de la norma.
- now: Ambos, además de verificar si el sistema está implementado y mantenido de manera eficaz. Los requisitos propios de la organización —su política, objetivos y procesos documentados— son la mitad que con mayor frecuencia se omite, y vulnerar las propias reglas suele preceder a vulnerar las de la norma.

**`q2.question`**

- was: Un colega afirma que ISO/IEC 42001 establece que los auditores no deben auditar su propio trabajo. ¿Cómo debería corregirse esto?
- now: Un colega afirma que ISO/IEC 42001 establece que los auditores no deben auditar su propio trabajo. ¿Cómo debería corregirse esta afirmación?

**`q2.option.a`**

- was: Es correcto y aparece en el apartado 9.2.2
- now: Es correcta y aparece en el apartado 9.2.2

**`q2.option.b`**

- was: La norma requiere objetividad e imparcialidad del proceso de auditoría; la regla del trabajo propio es orientación de ISO 19011
- now: La norma exige objetividad e imparcialidad del proceso de auditoría; la regla sobre el propio trabajo es una orientación de ISO 19011

**`q2.option.d`**

- was: La regla aplica solo a las auditorías externas
- now: La regla se aplica únicamente a las auditorías externas

**`q2.explanation`**

- was: El apartado 9.2.2 requiere que los auditores sean seleccionados y las auditorías realizadas de manera que se garantice la objetividad y la imparcialidad del proceso de auditoría. La regla del trabajo propio es la forma canónica de incumplir ese requisito y es una práctica sólida, pero atribuirla al texto de esta norma es una atribución incorrecta.
- now: El apartado 9.2.2 exige que los auditores sean seleccionados y las auditorías realizadas de manera que se **garantice** la **objetividad** e **imparcialidad** del proceso de auditoría — propiedades del proceso que la organización debe asegurar, no disposiciones del auditor individual. Auditar el propio trabajo es la forma canónica de no cumplir ese requisito y constituye una buena práctica, pero atribuir esa regla al texto de esta norma es una atribución incorrecta.

**`q3.question`**

- was: Una organización pequeña no tiene a nadie que no haya participado en la construcción de su sistema de gestión. ¿Qué permite la norma?
- now: Una organización pequeña no cuenta con ninguna persona que no haya participado en la construcción de su sistema de gestión. ¿Qué permite la norma?

**`q3.option.a`**

- was: Eximir de la auditoría interna cuando la organización está por debajo de un umbral de tamaño
- now: Dispensar la auditoría interna cuando la organización esté por debajo de un umbral de tamaño

**`q3.option.b`**

- was: Realizar la auditoría interna a través de una parte externa en nombre de la organización
- now: Llevar a cabo la auditoría interna a través de una parte externa contratada para realizarla en nombre de la organización

**`q3.option.c`**

- was: Apoyarse en la auditoría del organismo de certificación en su lugar
- now: Basarse en la auditoría del organismo de certificación en su lugar

**`q3.option.d`**

- was: Autoauditoría, siempre que el auditor documente su independencia
- now: La autoauditoría, siempre que el auditor documente su independencia

**`q3.explanation`**

- was: Una nota a la definición de auditoría permite que una auditoría interna se realice internamente o se encargue a un tercero contratado para llevarla a cabo. Esa es una vía que la norma contempla, no un recurso alternativo. No existe ninguna exención por tamaño, y afirmar la independencia no la crea — el requisito se aplica al proceso.
- now: Una nota a la definición de auditoría permite que una auditoría interna se realice internamente o se encargue a una parte externa contratada para llevarla a cabo. Esta es una vía que la norma contempla, no una solución alternativa. No existe ninguna dispensa por tamaño, y declarar independencia no la crea — el requisito se aplica al proceso.

**`q4.question`**

- was: ¿Qué requiere el apartado 9.2.2 que la organización considere al establecer el programa de auditoría?
- now: ¿Qué exige el apartado 9.2.2 que la organización considere al establecer el programa de auditoría?

**`q4.option.a`**

- was: La importancia de los procesos en cuestión y los resultados de auditorías anteriores
- now: La importancia de los procesos auditados y los hallazgos de auditorías anteriores

**`q4.option.c`**

- was: El calendario de vigilancia del organismo de certificación
- now: El calendario de supervisión del organismo de certificación

**`q4.explanation`**

- was: Esos dos factores, lo que es la auditoría basada en riesgos expresada con claridad: la atención sigue a la importancia, y las áreas que generaron hallazgos la última vez merecen mayor dedicación. Los objetivos, criterios y alcance se definen luego por auditoría y no una sola vez para todo el programa.
- now: Esos dos factores, que es la auditoría basada en riesgos enunciada de forma sencilla: la atención sigue a la importancia, y las áreas que generaron hallazgos en ocasiones anteriores merecen mayor dedicación. Los objetivos, criterios y extensión se definen luego por auditoría individual, no de forma única para el programa.

## `05-02-aims-internal-audit pt-BR b28`

**`q1.question`**

- was: Em relação a quais critérios a Seção 9.2.1 exige que as auditorias internas testem a conformidade?
- now: Em relação a quais critérios a cláusula 9.2.1 exige que as auditorias internas testem a conformidade?

**`q1.option.a`**

- was: Apenas os requisitos da norma
- now: Somente os requisitos da norma

**`q1.option.b`**

- was: Os próprios requisitos da organização para o seu sistema de gestão de IA e os requisitos da norma
- now: Os próprios requisitos da organização para seu SGAI e os requisitos da norma

**`q1.explanation`**

- was: Ambos, além de verificar se o sistema está efetivamente implementado e mantido. Os próprios requisitos da organização — sua política, objetivos e processos documentados — são a metade mais frequentemente ignorada, e descumprir as próprias regras geralmente precede o descumprimento das regras da norma.
- now: Ambos, além de verificar se o sistema está efetivamente implementado e mantido. Os próprios requisitos da organização — sua política, objetivos e processos documentados — são a metade mais frequentemente ignorada, e descumprir as próprias regras geralmente precede o descumprimento dos requisitos da norma.

**`q2.question`**

- was: Um colega afirma que a ISO/IEC 42001 diz que os auditores não devem auditar seu próprio trabalho. Como isso deve ser corrigido?
- now: Um colega afirma que a ISO/IEC 42001 diz que os auditores não devem auditar seu próprio trabalho. Como essa afirmação deve ser corrigida?

**`q2.option.a`**

- was: Está correto e aparece na Seção 9.2.2
- now: Está correta e consta na cláusula 9.2.2

**`q2.option.b`**

- was: A norma exige objetividade e imparcialidade do processo de auditoria; a regra do próprio trabalho é orientação da ISO 19011
- now: A norma requer objetividade e imparcialidade do processo de auditoria; a regra sobre o próprio trabalho é orientação da ISO 19011

**`q2.option.c`**

- was: A norma permite auditar o próprio trabalho quando não há alternativa disponível
- now: A norma permite auditar o próprio trabalho quando não há alternativa

**`q2.explanation`**

- was: A Seção 9.2.2 exige que os auditores sejam selecionados e as auditorias conduzidas de forma a garantir a objetividade e a imparcialidade do processo de auditoria. A regra do próprio trabalho é a forma canônica de falhar esse requisito e é uma boa prática, mas atribuí-la ao texto desta norma é uma atribuição incorreta.
- now: A cláusula 9.2.2 requer que os auditores sejam selecionados e as auditorias conduzidas de modo a **assegurar** a **objetividade** e a **imparcialidade** do processo de auditoria — propriedades do processo que a organização deve garantir, não disposições do auditor individualmente. A regra sobre o próprio trabalho é a forma canônica de violar isso e constitui boa prática, mas atribuí-la ao texto desta norma é uma atribuição incorreta.

**`q3.question`**

- was: Uma organização pequena não tem ninguém que não tenha ajudado a construir seu sistema de gestão. O que a norma permite?
- now: Uma organização pequena não possui nenhum colaborador que não tenha participado da construção de seu sistema de gestão. O que a norma permite?

**`q3.option.b`**

- was: Conduzir a auditoria interna por meio de uma parte externa em nome da organização
- now: Realizar a auditoria interna por meio de uma parte externa contratada para executá-la em nome da organização

**`q3.option.c`**

- was: Basear-se na auditoria do organismo de certificação em vez disso
- now: Basear-se na auditoria do organismo de certificação como substituta

**`q3.explanation`**

- was: Uma nota à definição de auditoria permite que uma auditoria interna seja realizada internamente ou entregue a um terceiro contratado para executá-la. Essa é uma rota contemplada pela norma, não um contorno. Não existe dispensa por tamanho, e declarar independência não a cria — o requisito se aplica ao processo.
- now: Uma nota à definição de auditoria permite que uma auditoria interna seja realizada internamente ou delegada a uma parte externa contratada para executá-la. Essa é uma possibilidade contemplada pela norma, não um contorno. Não existe dispensa por tamanho, e declarar independência não a cria — o requisito recai sobre o processo.

**`q4.question`**

- was: O que a Seção 9.2.2 exige que a organização considere ao estabelecer o programa de auditoria?
- now: O que a cláusula 9.2.2 requer que a organização considere ao estabelecer o programa de auditoria?

**`q4.option.a`**

- was: A importância dos processos envolvidos e os resultados de auditorias anteriores
- now: A importância dos processos sob auditoria e o que auditorias anteriores constataram

**`q4.option.c`**

- was: O cronograma de vigilância do organismo de certificação
- now: O calendário de supervisão do organismo de certificação

**`q4.option.d`**

- was: O orçamento disponível para atividades de auditoria
- now: O orçamento disponível para a atividade de auditoria

**`q4.explanation`**

- was: Esses dois fatores, o que é auditoria baseada em risco expressa de forma direta: a atenção segue a importância, e as áreas que geraram constatações na última vez merecem mais. Os objetivos, critérios e escopo são então definidos por auditoria, não uma vez para o programa.
- now: Esses dois fatores expressam, de forma direta, a auditoria baseada em risco: a atenção segue a importância, e as áreas que geraram constatações anteriormente merecem maior atenção. Objetivos, critérios e extensão são então definidos por auditoria, e não uma única vez para todo o programa.
