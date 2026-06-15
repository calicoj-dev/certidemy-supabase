-- 029_seed_practice_6_1.sql
-- =============================================================================
-- Practice pool: 12 questions for task 6.1 (lesson 06-01 "AI Agents as Tools"),
-- concepts ai-as-tool-not-team-member + human-held-accountabilities.
-- en + es-419 + pt-BR; each question shares a question_group_id uuid across its
-- three language rows. pool='practice', is_exam_scope=true (foundation tier),
-- status='approved', module_id=null, task_id resolved by code '6.1'.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.1'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- Q1 ----------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000001$g$,'en',
   $t$In Scrum, what is an AI agent that the Developers use to generate code?$t$,
   $o$[{"id":"a","text":"A new Developer on the Scrum Team"},{"id":"b","text":"A tool the Developers use, not a member of the Scrum Team"},{"id":"c","text":"A fourth accountability in Scrum"},{"id":"d","text":"A replacement for the Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$The Scrum Team is made up of people — a Product Owner, a Scrum Master, and Developers. AI is a tool they use; it is not a member of the team.$e$,1,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000001$g$,'es-419',
   $t$En Scrum, ¿qué es un agente de IA que los Developers usan para generar código?$t$,
   $o$[{"id":"a","text":"Un nuevo Developer del Scrum Team"},{"id":"b","text":"Una herramienta que los Developers usan, no un integrante del Scrum Team"},{"id":"c","text":"Una cuarta accountability en Scrum"},{"id":"d","text":"Un reemplazo del Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$El Scrum Team está formado por personas: un Product Owner, un Scrum Master y Developers. La IA es una herramienta que usan; no es un integrante del equipo.$e$,1,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$No Scrum, o que é um agente de IA que os Developers usam para gerar código?$t$,
   $o$[{"id":"a","text":"Um novo Developer do Scrum Team"},{"id":"b","text":"Uma ferramenta que os Developers usam, não um integrante do Scrum Team"},{"id":"c","text":"Uma quarta accountability no Scrum"},{"id":"d","text":"Um substituto do Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$O Scrum Team é formado por pessoas: um Product Owner, um Scrum Master e Developers. A IA é uma ferramenta que eles usam; não é um integrante do time.$e$,1,$b$2_understand$b$),

  -- Q2 ----------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000002$g$,'en',
   $t$A team says "our AI agent is basically another team member now." Why is that framing a problem in Scrum?$t$,
   $o$[{"id":"a","text":"AI is too slow to be a team member"},{"id":"b","text":"Membership in a Scrum Team means holding an accountability, and a tool holds none"},{"id":"c","text":"The Scrum Guide caps team size at three"},{"id":"d","text":"It is not a problem; AI is a team member"}]$o$,
   $a$["b"]$a$,
   $e$Being a member of a Scrum Team means holding an accountability. A tool cannot, so calling it a member blurs who is actually answerable.$e$,2,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000002$g$,'es-419',
   $t$Un equipo dice "nuestro agente de IA ya es básicamente otro integrante del equipo". ¿Por qué ese encuadre es un problema en Scrum?$t$,
   $o$[{"id":"a","text":"La IA es demasiado lenta para ser integrante del equipo"},{"id":"b","text":"Ser integrante de un Scrum Team significa sostener una accountability, y una herramienta no sostiene ninguna"},{"id":"c","text":"La Guía de Scrum limita el equipo a tres personas"},{"id":"d","text":"No es un problema; la IA es un integrante del equipo"}]$o$,
   $a$["b"]$a$,
   $e$Ser integrante de un Scrum Team significa sostener una accountability. Una herramienta no puede, así que llamarla integrante difumina quién es realmente responsable.$e$,2,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$Um time diz "nosso agente de IA já é basicamente mais um integrante do time". Por que esse enquadramento é um problema no Scrum?$t$,
   $o$[{"id":"a","text":"A IA é lenta demais para ser integrante do time"},{"id":"b","text":"Ser integrante de um Scrum Team significa sustentar uma accountability, e uma ferramenta não sustenta nenhuma"},{"id":"c","text":"O Guia do Scrum limita o time a três pessoas"},{"id":"d","text":"Não é um problema; a IA é um integrante do time"}]$o$,
   $a$["b"]$a$,
   $e$Ser integrante de um Scrum Team significa sustentar uma accountability. Uma ferramenta não pode, então chamá-la de integrante confunde quem é de fato responsável.$e$,2,$b$2_understand$b$),

  -- Q3 ----------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000003$g$,'en',
   $t$Who is accountable for the Increment when much of it was generated by an AI agent?$t$,
   $o$[{"id":"a","text":"The AI agent"},{"id":"b","text":"The Developers"},{"id":"c","text":"No one, since AI wrote it"},{"id":"d","text":"The vendor of the AI tool"}]$o$,
   $a$["b"]$a$,
   $e$The Developers remain accountable for the Increment regardless of how it was produced. AI contributions do not transfer accountability away from people.$e$,2,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000003$g$,'es-419',
   $t$¿Quién es responsable (accountable) del Increment cuando gran parte fue generada por un agente de IA?$t$,
   $o$[{"id":"a","text":"El agente de IA"},{"id":"b","text":"Los Developers"},{"id":"c","text":"Nadie, ya que lo escribió la IA"},{"id":"d","text":"El proveedor de la herramienta de IA"}]$o$,
   $a$["b"]$a$,
   $e$Los Developers siguen siendo responsables del Increment sin importar cómo se produjo. Las contribuciones de IA no trasladan la accountability fuera de las personas.$e$,2,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Quem é responsável (accountable) pelo Increment quando grande parte foi gerada por um agente de IA?$t$,
   $o$[{"id":"a","text":"O agente de IA"},{"id":"b","text":"Os Developers"},{"id":"c","text":"Ninguém, já que a IA escreveu"},{"id":"d","text":"O fornecedor da ferramenta de IA"}]$o$,
   $a$["b"]$a$,
   $e$Os Developers continuam responsáveis pelo Increment não importa como ele foi produzido. As contribuições de IA não transferem a accountability para fora das pessoas.$e$,2,$b$2_understand$b$),

  -- Q4 ----------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000004$g$,'en',
   $t$An AI tool drafts the wording of the Sprint Goal. Who commits to the Sprint Goal?$t$,
   $o$[{"id":"a","text":"The AI, since it wrote it"},{"id":"b","text":"The Scrum Team — commitment is a human act"},{"id":"c","text":"The Scrum Master alone"},{"id":"d","text":"Whichever Developer ran the AI"}]$o$,
   $a$["b"]$a$,
   $e$AI can draft wording, but committing to the Sprint Goal is a promise the team makes. Drafting is not committing.$e$,3,$b$3_apply$b$),
  ($g$d6011001-0000-4000-8000-000000000004$g$,'es-419',
   $t$Una herramienta de IA redacta el texto del Sprint Goal. ¿Quién se compromete con el Sprint Goal?$t$,
   $o$[{"id":"a","text":"La IA, ya que lo escribió"},{"id":"b","text":"El Scrum Team: el compromiso es un acto humano"},{"id":"c","text":"Solo el Scrum Master"},{"id":"d","text":"El Developer que ejecutó la IA"}]$o$,
   $a$["b"]$a$,
   $e$La IA puede redactar el texto, pero comprometerse con el Sprint Goal es una promesa que hace el equipo. Redactar no es comprometerse.$e$,3,$b$3_apply$b$),
  ($g$d6011001-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$Uma ferramenta de IA rascunha o texto do Sprint Goal. Quem se compromete com o Sprint Goal?$t$,
   $o$[{"id":"a","text":"A IA, já que ela escreveu"},{"id":"b","text":"O Scrum Team: o compromisso é um ato humano"},{"id":"c","text":"Apenas o Scrum Master"},{"id":"d","text":"O Developer que executou a IA"}]$o$,
   $a$["b"]$a$,
   $e$A IA pode rascunhar o texto, mas comprometer-se com o Sprint Goal é uma promessa que o time faz. Rascunhar não é se comprometer.$e$,3,$b$3_apply$b$),

  -- Q5 ----------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000005$g$,'en',
   $t$During the Daily Scrum, how should an AI agent's overnight output be treated?$t$,
   $o$[{"id":"a","text":"As a team member's status update"},{"id":"b","text":"As input the Developers inspect and decide how to use"},{"id":"c","text":"As automatically part of the Increment"},{"id":"d","text":"As a replacement for the Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$AI output is input for the people doing the work. The Developers, not the tool, run the Daily Scrum and decide what to do with it.$e$,3,$b$3_apply$b$),
  ($g$d6011001-0000-4000-8000-000000000005$g$,'es-419',
   $t$Durante el Daily Scrum, ¿cómo debería tratarse la salida nocturna de un agente de IA?$t$,
   $o$[{"id":"a","text":"Como la actualización de estado de un integrante del equipo"},{"id":"b","text":"Como insumo que los Developers inspeccionan y deciden cómo usar"},{"id":"c","text":"Como parte automática del Increment"},{"id":"d","text":"Como un reemplazo del Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$La salida de IA es insumo para las personas que hacen el trabajo. Los Developers, no la herramienta, dirigen el Daily Scrum y deciden qué hacer con ella.$e$,3,$b$3_apply$b$),
  ($g$d6011001-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Durante o Daily Scrum, como a saída noturna de um agente de IA deve ser tratada?$t$,
   $o$[{"id":"a","text":"Como a atualização de status de um integrante do time"},{"id":"b","text":"Como insumo que os Developers inspecionam e decidem como usar"},{"id":"c","text":"Como parte automática do Increment"},{"id":"d","text":"Como um substituto do Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$A saída de IA é insumo para as pessoas que fazem o trabalho. Os Developers, não a ferramenta, conduzem o Daily Scrum e decidem o que fazer com ela.$e$,3,$b$3_apply$b$),

  -- Q6 ----------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000006$g$,'en',
   $t$Which statement about AI in a Scrum Team is correct?$t$,
   $o$[{"id":"a","text":"AI can hold the Scrum Master accountability if configured well"},{"id":"b","text":"AI expands what the team can do but does not become an accountable member"},{"id":"c","text":"AI should be listed as a Developer in the team roster"},{"id":"d","text":"AI removes the need for Developers"}]$o$,
   $a$["b"]$a$,
   $e$AI augments capacity; it never takes on an accountability or becomes a member of the team.$e$,2,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000006$g$,'es-419',
   $t$¿Cuál afirmación sobre la IA en un Scrum Team es correcta?$t$,
   $o$[{"id":"a","text":"La IA puede sostener la accountability del Scrum Master si se configura bien"},{"id":"b","text":"La IA amplía lo que el equipo puede hacer, pero no se vuelve un integrante responsable"},{"id":"c","text":"La IA debería figurar como Developer en la lista del equipo"},{"id":"d","text":"La IA elimina la necesidad de Developers"}]$o$,
   $a$["b"]$a$,
   $e$La IA aumenta la capacidad; nunca asume una accountability ni se vuelve integrante del equipo.$e$,2,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$Qual afirmação sobre a IA em um Scrum Team está correta?$t$,
   $o$[{"id":"a","text":"A IA pode sustentar a accountability do Scrum Master se for bem configurada"},{"id":"b","text":"A IA amplia o que o time consegue fazer, mas não se torna um integrante responsável"},{"id":"c","text":"A IA deveria constar como Developer na lista do time"},{"id":"d","text":"A IA elimina a necessidade de Developers"}]$o$,
   $a$["b"]$a$,
   $e$A IA aumenta a capacidade; ela nunca assume uma accountability nem se torna integrante do time.$e$,2,$b$2_understand$b$),

  -- Q7 ----------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000007$g$,'en',
   $t$Why can't accountability for meeting the Definition of Done be assigned to an AI agent?$t$,
   $o$[{"id":"a","text":"AI cannot read the Definition of Done"},{"id":"b","text":"Accountability means being answerable for a judgment, and a tool cannot answer for one"},{"id":"c","text":"The Definition of Done forbids automation"},{"id":"d","text":"AI is not fast enough"}]$o$,
   $a$["b"]$a$,
   $e$Judging that the Definition of Done is met is a human accountability. A tool can check criteria, but answering for the judgment stays with the Developers.$e$,4,$b$4_analyze$b$),
  ($g$d6011001-0000-4000-8000-000000000007$g$,'es-419',
   $t$¿Por qué la accountability de cumplir la Definition of Done no puede asignarse a un agente de IA?$t$,
   $o$[{"id":"a","text":"La IA no puede leer la Definition of Done"},{"id":"b","text":"La accountability significa responder por un juicio, y una herramienta no puede responder por uno"},{"id":"c","text":"La Definition of Done prohíbe la automatización"},{"id":"d","text":"La IA no es lo bastante rápida"}]$o$,
   $a$["b"]$a$,
   $e$Juzgar que se cumple la Definition of Done es una accountability humana. Una herramienta puede verificar criterios, pero responder por el juicio se queda con los Developers.$e$,4,$b$4_analyze$b$),
  ($g$d6011001-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$Por que a accountability de cumprir a Definition of Done não pode ser atribuída a um agente de IA?$t$,
   $o$[{"id":"a","text":"A IA não consegue ler a Definition of Done"},{"id":"b","text":"Accountability significa responder por um julgamento, e uma ferramenta não pode responder por um"},{"id":"c","text":"A Definition of Done proíbe automação"},{"id":"d","text":"A IA não é rápida o suficiente"}]$o$,
   $a$["b"]$a$,
   $e$Julgar que a Definition of Done foi cumprida é uma accountability humana. Uma ferramenta pode verificar critérios, mas responder pelo julgamento fica com os Developers.$e$,4,$b$4_analyze$b$),

  -- Q8 ----------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000008$g$,'en',
   $t$According to the 2020 Scrum Guide, the Scrum Team consists of:$t$,
   $o$[{"id":"a","text":"A Product Owner, a Scrum Master, Developers, and any AI agents"},{"id":"b","text":"A Product Owner, a Scrum Master, and Developers"},{"id":"c","text":"Only the Developers and their AI tools"},{"id":"d","text":"Whoever attends the Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$The Scrum Team is one Product Owner, one Scrum Master, and Developers — all people. Tools are not members.$e$,1,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000008$g$,'es-419',
   $t$Según la Guía de Scrum 2020, el Scrum Team está compuesto por:$t$,
   $o$[{"id":"a","text":"Un Product Owner, un Scrum Master, Developers y los agentes de IA"},{"id":"b","text":"Un Product Owner, un Scrum Master y Developers"},{"id":"c","text":"Solo los Developers y sus herramientas de IA"},{"id":"d","text":"Quien asista al Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$El Scrum Team es un Product Owner, un Scrum Master y Developers, todas personas. Las herramientas no son integrantes.$e$,1,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$Segundo o Guia do Scrum 2020, o Scrum Team é composto por:$t$,
   $o$[{"id":"a","text":"Um Product Owner, um Scrum Master, Developers e os agentes de IA"},{"id":"b","text":"Um Product Owner, um Scrum Master e Developers"},{"id":"c","text":"Apenas os Developers e suas ferramentas de IA"},{"id":"d","text":"Quem participa do Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$O Scrum Team é um Product Owner, um Scrum Master e Developers, todos pessoas. Ferramentas não são integrantes.$e$,1,$b$2_understand$b$),

  -- Q9 ----------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000009$g$,'en',
   $t$An AI agent's code causes a production incident. In Scrum terms, who is accountable?$t$,
   $o$[{"id":"a","text":"The AI agent that wrote it"},{"id":"b","text":"The Developers, who own the Increment"},{"id":"c","text":"No one — it was automated"},{"id":"d","text":"The Scrum Master, for allowing AI"}]$o$,
   $a$["b"]$a$,
   $e$The Developers own the Increment and remain accountable for what ships, including AI-generated parts they integrated.$e$,3,$b$3_apply$b$),
  ($g$d6011001-0000-4000-8000-000000000009$g$,'es-419',
   $t$El código de un agente de IA causa un incidente en producción. En términos de Scrum, ¿quién es responsable (accountable)?$t$,
   $o$[{"id":"a","text":"El agente de IA que lo escribió"},{"id":"b","text":"Los Developers, que son dueños del Increment"},{"id":"c","text":"Nadie: fue automatizado"},{"id":"d","text":"El Scrum Master, por permitir la IA"}]$o$,
   $a$["b"]$a$,
   $e$Los Developers son dueños del Increment y siguen siendo responsables de lo que se entrega, incluidas las partes generadas por IA que integraron.$e$,3,$b$3_apply$b$),
  ($g$d6011001-0000-4000-8000-000000000009$g$,'pt-BR',
   $t$O código de um agente de IA causa um incidente em produção. Em termos de Scrum, quem é responsável (accountable)?$t$,
   $o$[{"id":"a","text":"O agente de IA que o escreveu"},{"id":"b","text":"Os Developers, que são donos do Increment"},{"id":"c","text":"Ninguém: foi automatizado"},{"id":"d","text":"O Scrum Master, por permitir a IA"}]$o$,
   $a$["b"]$a$,
   $e$Os Developers são donos do Increment e continuam responsáveis pelo que é entregue, incluindo as partes geradas por IA que integraram.$e$,3,$b$3_apply$b$),

  -- Q10 ---------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000010$g$,'en',
   $t$A manager proposes reducing the Developers "since the AI is now a team member doing most of the work." What is the Scrum-accurate response?$t$,
   $o$[{"id":"a","text":"Agree; AI membership reduces needed headcount"},{"id":"b","text":"AI is a tool that augments the Developers, not a member that can hold their accountabilities"},{"id":"c","text":"Add the AI to the roster and remove one Developer"},{"id":"d","text":"Make the AI the Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$AI increases the Developers' capacity but cannot hold accountability for the Increment, self-management, or commitments, so it cannot replace accountable members.$e$,4,$b$4_analyze$b$),
  ($g$d6011001-0000-4000-8000-000000000010$g$,'es-419',
   $t$Un gerente propone reducir los Developers "ya que la IA ahora es un integrante del equipo que hace la mayor parte del trabajo". ¿Cuál es la respuesta correcta según Scrum?$t$,
   $o$[{"id":"a","text":"Estar de acuerdo; la membresía de la IA reduce el personal necesario"},{"id":"b","text":"La IA es una herramienta que aumenta a los Developers, no un integrante que pueda sostener sus accountabilities"},{"id":"c","text":"Agregar la IA a la lista y quitar un Developer"},{"id":"d","text":"Hacer a la IA el Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$La IA aumenta la capacidad de los Developers, pero no puede sostener la accountability del Increment, la autogestión ni los compromisos, así que no puede reemplazar a integrantes responsables.$e$,4,$b$4_analyze$b$),
  ($g$d6011001-0000-4000-8000-000000000010$g$,'pt-BR',
   $t$Um gestor propõe reduzir os Developers "já que a IA agora é um integrante do time fazendo a maior parte do trabalho". Qual é a resposta correta segundo o Scrum?$t$,
   $o$[{"id":"a","text":"Concordar; a participação da IA reduz o quadro necessário"},{"id":"b","text":"A IA é uma ferramenta que amplia os Developers, não um integrante que possa sustentar as accountabilities deles"},{"id":"c","text":"Adicionar a IA à lista e remover um Developer"},{"id":"d","text":"Tornar a IA o Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$A IA aumenta a capacidade dos Developers, mas não pode sustentar a accountability pelo Increment, a autogestão ou os compromissos, então não pode substituir integrantes responsáveis.$e$,4,$b$4_analyze$b$),

  -- Q11 ---------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000011$g$,'en',
   $t$What stays with people even when an AI does most of the producing?$t$,
   $o$[{"id":"a","text":"Typing speed"},{"id":"b","text":"The accountabilities — commitment, the Definition of Done, ownership of the Increment"},{"id":"c","text":"Nothing; AI takes over everything"},{"id":"d","text":"Only the Scrum Master's calendar"}]$o$,
   $a$["b"]$a$,
   $e$The doing can shift to a tool; the answering — the accountabilities — stays human.$e$,3,$b$3_apply$b$),
  ($g$d6011001-0000-4000-8000-000000000011$g$,'es-419',
   $t$¿Qué se queda con las personas incluso cuando una IA hace la mayor parte de la producción?$t$,
   $o$[{"id":"a","text":"La velocidad de escritura"},{"id":"b","text":"Las accountabilities: el compromiso, la Definition of Done, la propiedad del Increment"},{"id":"c","text":"Nada; la IA se encarga de todo"},{"id":"d","text":"Solo el calendario del Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$El hacer puede pasar a una herramienta; el responder —las accountabilities— se queda con las personas.$e$,3,$b$3_apply$b$),
  ($g$d6011001-0000-4000-8000-000000000011$g$,'pt-BR',
   $t$O que permanece com as pessoas mesmo quando uma IA faz a maior parte da produção?$t$,
   $o$[{"id":"a","text":"A velocidade de digitação"},{"id":"b","text":"As accountabilities: o compromisso, a Definition of Done, a propriedade do Increment"},{"id":"c","text":"Nada; a IA assume tudo"},{"id":"d","text":"Apenas a agenda do Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$O fazer pode passar para uma ferramenta; o responder —as accountabilities— permanece com as pessoas.$e$,3,$b$3_apply$b$),

  -- Q12 ---------------------------------------------------------------------
  ($g$d6011001-0000-4000-8000-000000000012$g$,'en',
   $t$"AI as a tool, not a team member" mainly protects which thing?$t$,
   $o$[{"id":"a","text":"The team's velocity number"},{"id":"b","text":"A clear line of human accountability for the work"},{"id":"c","text":"The AI vendor's licensing terms"},{"id":"d","text":"The length of the Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$Treating AI as a tool keeps it clear that people, not the tool, are answerable for the Increment and the team's commitments.$e$,2,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000012$g$,'es-419',
   $t$"La IA como herramienta, no como integrante del equipo" protege principalmente, ¿qué cosa?$t$,
   $o$[{"id":"a","text":"El número de velocity del equipo"},{"id":"b","text":"Una línea clara de accountability humana sobre el trabajo"},{"id":"c","text":"Los términos de licencia del proveedor de IA"},{"id":"d","text":"La duración del Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$Tratar a la IA como herramienta mantiene claro que las personas, no la herramienta, responden por el Increment y los compromisos del equipo.$e$,2,$b$2_understand$b$),
  ($g$d6011001-0000-4000-8000-000000000012$g$,'pt-BR',
   $t$"A IA como ferramenta, não como integrante do time" protege principalmente o quê?$t$,
   $o$[{"id":"a","text":"O número de velocity do time"},{"id":"b","text":"Uma linha clara de accountability humana sobre o trabalho"},{"id":"c","text":"Os termos de licença do fornecedor de IA"},{"id":"d","text":"A duração do Daily Scrum"}]$o$,
   $a$["b"]$a$,
   $e$Tratar a IA como ferramenta mantém claro que as pessoas, não a ferramenta, respondem pelo Increment e pelos compromissos do time.$e$,2,$b$2_understand$b$)
)
insert into public.quiz_questions
  (certification_id, module_id, question_text, question_type, options, correct_answer,
   explanation, difficulty, bloom_level, is_exam_scope, task_id, status, question_group_id, language, pool)
select
  '11111111-1111-1111-1111-111111111111', null, q.qtext, 'single_choice'::question_type,
  q.opts::jsonb, q.ans::jsonb, q.expl, q.diff::smallint, q.bloom::bloom_level,
  true, task.task_id, 'approved', q.grp::uuid, q.lang, 'practice'
from q cross join task
where not exists (
  select 1 from public.quiz_questions e
  where e.question_group_id = q.grp::uuid and e.language = q.lang
);

-- ---- VERIFICATION ------------------------------------------------------------
-- Expect 12 per language (36 rows) for task 6.1:
-- select language, count(*) from public.quiz_questions
--  where pool='practice' and task_id = (select id from public.tasks
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.1')
--  group by language order by language;
-- Sanity: every correct_answer id must exist in its options (expect 0 rows):
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like 'd6011001-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
