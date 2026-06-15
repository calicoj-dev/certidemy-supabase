-- 030_seed_practice_6_2.sql
-- =============================================================================
-- Practice pool: 12 questions for task 6.2 (lesson 06-02 "Definition of Done
-- and AI Work"), concepts dod-applies-to-ai-output + increment-transparency-ai.
-- en + es-419 + pt-BR; shared question_group_id per question across languages.
-- pool='practice', is_exam_scope=true, status='approved', task_id by code '6.2'.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.2'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- Q1 ----------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000001$g$,'en',
   $t$Does the Definition of Done apply differently to AI-generated work?$t$,
   $o$[{"id":"a","text":"Yes — AI work has a lower bar"},{"id":"b","text":"No — it applies equally regardless of who or what produced the work"},{"id":"c","text":"Yes — AI work skips review"},{"id":"d","text":"AI work does not need a Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$The Definition of Done is the team's quality standard and applies equally to AI-assisted output. "An AI wrote it" is not a shortcut around any criterion.$e$,1,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000001$g$,'es-419',
   $t$¿La Definition of Done se aplica de forma distinta al trabajo generado por IA?$t$,
   $o$[{"id":"a","text":"Sí: el trabajo de IA tiene un nivel más bajo"},{"id":"b","text":"No: se aplica por igual sin importar quién o qué produjo el trabajo"},{"id":"c","text":"Sí: el trabajo de IA se salta la revisión"},{"id":"d","text":"El trabajo de IA no necesita Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$La Definition of Done es el estándar de calidad del equipo y se aplica por igual a la salida asistida por IA. "Lo escribió una IA" no es un atajo para saltarse ningún criterio.$e$,1,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$A Definition of Done se aplica de forma diferente ao trabalho gerado por IA?$t$,
   $o$[{"id":"a","text":"Sim — o trabalho de IA tem um nível mais baixo"},{"id":"b","text":"Não — aplica-se igualmente não importa quem ou o que produziu o trabalho"},{"id":"c","text":"Sim — o trabalho de IA pula a revisão"},{"id":"d","text":"O trabalho de IA não precisa de Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$A Definition of Done é o padrão de qualidade do time e se aplica igualmente à saída assistida por IA. "Foi uma IA que escreveu" não é um atalho para pular nenhum critério.$e$,1,$b$2_understand$b$),

  -- Q2 ----------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000002$g$,'en',
   $t$An AI agent's code compiles and passes all automated tests. Is it Done?$t$,
   $o$[{"id":"a","text":"Yes — automated tests are the Definition of Done"},{"id":"b","text":"Not necessarily; the Developers still judge it against the full Definition of Done"},{"id":"c","text":"Yes, if the AI wrote the tests too"},{"id":"d","text":"No — AI output can never be Done"}]$o$,
   $a$["b"]$a$,
   $e$Automated checks are part of the Definition of Done, not the whole. Done requires the Developers' judgment against the full standard.$e$,2,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000002$g$,'es-419',
   $t$El código de un agente de IA compila y pasa todas las pruebas automatizadas. ¿Está Done?$t$,
   $o$[{"id":"a","text":"Sí: las pruebas automatizadas son la Definition of Done"},{"id":"b","text":"No necesariamente; los Developers todavía lo juzgan contra la Definition of Done completa"},{"id":"c","text":"Sí, si la IA también escribió las pruebas"},{"id":"d","text":"No: la salida de IA nunca puede estar Done"}]$o$,
   $a$["b"]$a$,
   $e$Las verificaciones automatizadas son parte de la Definition of Done, no su totalidad. Done requiere el juicio de los Developers contra el estándar completo.$e$,2,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$O código de um agente de IA compila e passa em todos os testes automatizados. Está Done?$t$,
   $o$[{"id":"a","text":"Sim: os testes automatizados são a Definition of Done"},{"id":"b","text":"Não necessariamente; os Developers ainda o julgam contra a Definition of Done completa"},{"id":"c","text":"Sim, se a IA também escreveu os testes"},{"id":"d","text":"Não: a saída de IA nunca pode estar Done"}]$o$,
   $a$["b"]$a$,
   $e$As verificações automatizadas são parte da Definition of Done, não o todo. Done exige o julgamento dos Developers contra o padrão completo.$e$,2,$b$2_understand$b$),

  -- Q3 ----------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000003$g$,'en',
   $t$How should AI-generated output entering the workflow be treated?$t$,
   $o$[{"id":"a","text":"As a finished Increment"},{"id":"b","text":"As a draft that goes through the team's normal path to Done"},{"id":"c","text":"As exempt from review"},{"id":"d","text":"As automatically shippable"}]$o$,
   $a$["b"]$a$,
   $e$AI output is a draft — useful but never automatically shippable. It enters review, testing, and judgment like any first pass.$e$,1,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000003$g$,'es-419',
   $t$¿Cómo debería tratarse la salida generada por IA que entra al flujo de trabajo?$t$,
   $o$[{"id":"a","text":"Como un Increment terminado"},{"id":"b","text":"Como un borrador que pasa por el camino normal del equipo hacia Done"},{"id":"c","text":"Como exenta de revisión"},{"id":"d","text":"Como automáticamente entregable"}]$o$,
   $a$["b"]$a$,
   $e$La salida de IA es un borrador: útil, pero nunca automáticamente entregable. Entra a revisión, pruebas y juicio como cualquier primer intento.$e$,1,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Como a saída gerada por IA que entra no fluxo de trabalho deve ser tratada?$t$,
   $o$[{"id":"a","text":"Como um Increment terminado"},{"id":"b","text":"Como um rascunho que passa pelo caminho normal do time até o Done"},{"id":"c","text":"Como isenta de revisão"},{"id":"d","text":"Como automaticamente entregável"}]$o$,
   $a$["b"]$a$,
   $e$A saída de IA é um rascunho: útil, mas nunca automaticamente entregável. Ela entra em revisão, testes e julgamento como qualquer primeira versão.$e$,1,$b$2_understand$b$),

  -- Q4 ----------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000004$g$,'en',
   $t$A Developer wants to skip code review on a large batch of AI output "because there's so much." Best response?$t$,
   $o$[{"id":"a","text":"Agree; the volume justifies it"},{"id":"b","text":"High volume is exactly when review matters most, and the Definition of Done applies regardless of who produced the work"},{"id":"c","text":"Merge now, review later"},{"id":"d","text":"Review it all yourself as Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$Volume is a reason to hold the bar, not lower it. The Definition of Done applies to AI work the same as human work.$e$,3,$b$3_apply$b$),
  ($g$d6012001-0000-4000-8000-000000000004$g$,'es-419',
   $t$Un Developer quiere saltarse la revisión de código en un gran lote de salida de IA "porque hay muchísimo". ¿Mejor respuesta?$t$,
   $o$[{"id":"a","text":"Estar de acuerdo; el volumen lo justifica"},{"id":"b","text":"El alto volumen es justo cuando la revisión más importa, y la Definition of Done se aplica sin importar quién produjo el trabajo"},{"id":"c","text":"Fusionar ahora, revisar después"},{"id":"d","text":"Revisarlo todo tú mismo como Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$El volumen es razón para mantener el nivel, no para bajarlo. La Definition of Done se aplica al trabajo de IA igual que al humano.$e$,3,$b$3_apply$b$),
  ($g$d6012001-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$Um Developer quer pular a revisão de código em um grande lote de saída de IA "porque tem muita coisa". Melhor resposta?$t$,
   $o$[{"id":"a","text":"Concordar; o volume justifica"},{"id":"b","text":"O alto volume é justamente quando a revisão mais importa, e a Definition of Done se aplica não importa quem produziu o trabalho"},{"id":"c","text":"Fazer o merge agora, revisar depois"},{"id":"d","text":"Revisar tudo você mesmo como Scrum Master"}]$o$,
   $a$["b"]$a$,
   $e$Volume é razão para manter o nível, não para baixá-lo. A Definition of Done se aplica ao trabalho de IA igual ao humano.$e$,3,$b$3_apply$b$),

  -- Q5 ----------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000005$g$,'en',
   $t$Why is merging AI output into the Increment without review risky?$t$,
   $o$[{"id":"a","text":"AI output is always low quality"},{"id":"b","text":"It makes work look finished while skipping the standard that makes 'finished' meaningful, hiding risk"},{"id":"c","text":"The Scrum Guide bans AI code"},{"id":"d","text":"It breaks the Sprint timebox"}]$o$,
   $a$["b"]$a$,
   $e$Skipping review does not save time; it hides risk. The Definition of Done is what makes "Done" trustworthy.$e$,2,$b$3_apply$b$),
  ($g$d6012001-0000-4000-8000-000000000005$g$,'es-419',
   $t$¿Por qué es riesgoso fusionar salida de IA en el Increment sin revisión?$t$,
   $o$[{"id":"a","text":"La salida de IA siempre es de baja calidad"},{"id":"b","text":"Hace que el trabajo parezca terminado mientras se salta el estándar que hace 'terminado' significativo, ocultando riesgo"},{"id":"c","text":"La Guía de Scrum prohíbe el código de IA"},{"id":"d","text":"Rompe el timebox del Sprint"}]$o$,
   $a$["b"]$a$,
   $e$Saltarse la revisión no ahorra tiempo; oculta riesgo. La Definition of Done es lo que hace "Done" confiable.$e$,2,$b$3_apply$b$),
  ($g$d6012001-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Por que é arriscado fazer o merge de saída de IA no Increment sem revisão?$t$,
   $o$[{"id":"a","text":"A saída de IA é sempre de baixa qualidade"},{"id":"b","text":"Faz o trabalho parecer terminado enquanto pula o padrão que torna 'terminado' significativo, escondendo risco"},{"id":"c","text":"O Guia do Scrum proíbe código de IA"},{"id":"d","text":"Quebra o timebox do Sprint"}]$o$,
   $a$["b"]$a$,
   $e$Pular a revisão não economiza tempo; esconde risco. A Definition of Done é o que torna "Done" confiável.$e$,2,$b$3_apply$b$),

  -- Q6 ----------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000006$g$,'en',
   $t$How do "passes automated checks" and "meets the Definition of Done" relate?$t$,
   $o$[{"id":"a","text":"They are identical"},{"id":"b","text":"Automated checks are one part of the Definition of Done; meeting the full Definition of Done is the Developers' judgment"},{"id":"c","text":"The Definition of Done is a subset of automated checks"},{"id":"d","text":"Neither matters if AI wrote it"}]$o$,
   $a$["b"]$a$,
   $e$Automated checks are a component of the Definition of Done, not a replacement for the team's judgment that the full standard is met.$e$,3,$b$4_analyze$b$),
  ($g$d6012001-0000-4000-8000-000000000006$g$,'es-419',
   $t$¿Cómo se relacionan "pasa las verificaciones automatizadas" y "cumple la Definition of Done"?$t$,
   $o$[{"id":"a","text":"Son idénticas"},{"id":"b","text":"Las verificaciones automatizadas son una parte de la Definition of Done; cumplir la Definition of Done completa es el juicio de los Developers"},{"id":"c","text":"La Definition of Done es un subconjunto de las verificaciones automatizadas"},{"id":"d","text":"Nada importa si lo escribió la IA"}]$o$,
   $a$["b"]$a$,
   $e$Las verificaciones automatizadas son un componente de la Definition of Done, no un reemplazo del juicio del equipo de que se cumple el estándar completo.$e$,3,$b$4_analyze$b$),
  ($g$d6012001-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$Como se relacionam "passa nas verificações automatizadas" e "cumpre a Definition of Done"?$t$,
   $o$[{"id":"a","text":"São idênticas"},{"id":"b","text":"As verificações automatizadas são uma parte da Definition of Done; cumprir a Definition of Done completa é o julgamento dos Developers"},{"id":"c","text":"A Definition of Done é um subconjunto das verificações automatizadas"},{"id":"d","text":"Nada importa se a IA escreveu"}]$o$,
   $a$["b"]$a$,
   $e$As verificações automatizadas são um componente da Definition of Done, não um substituto do julgamento do time de que o padrão completo foi cumprido.$e$,3,$b$4_analyze$b$),

  -- Q7 ----------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000007$g$,'en',
   $t$What does artifact transparency require when much of the Increment is AI-generated?$t$,
   $o$[{"id":"a","text":"Hiding which parts were AI-generated"},{"id":"b","text":"That the team can see and verify how the work was produced, keeping it inspectable"},{"id":"c","text":"Trusting the model since it is consistent"},{"id":"d","text":"Replacing review with the AI's confidence score"}]$o$,
   $a$["b"]$a$,
   $e$Transparency means the work behind the Increment is visible and honest so the team can inspect it. Opaque AI output breaks that.$e$,2,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000007$g$,'es-419',
   $t$¿Qué exige la transparencia de artefactos cuando gran parte del Increment es generada por IA?$t$,
   $o$[{"id":"a","text":"Ocultar qué partes fueron generadas por IA"},{"id":"b","text":"Que el equipo pueda ver y verificar cómo se produjo el trabajo, manteniéndolo inspeccionable"},{"id":"c","text":"Confiar en el modelo porque es consistente"},{"id":"d","text":"Reemplazar la revisión con el puntaje de confianza de la IA"}]$o$,
   $a$["b"]$a$,
   $e$La transparencia significa que el trabajo detrás del Increment es visible y honesto para que el equipo pueda inspeccionarlo. La salida de IA opaca rompe eso.$e$,2,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$O que a transparência de artefatos exige quando grande parte do Increment é gerada por IA?$t$,
   $o$[{"id":"a","text":"Esconder quais partes foram geradas por IA"},{"id":"b","text":"Que o time consiga ver e verificar como o trabalho foi produzido, mantendo-o inspecionável"},{"id":"c","text":"Confiar no modelo porque ele é consistente"},{"id":"d","text":"Substituir a revisão pela pontuação de confiança da IA"}]$o$,
   $a$["b"]$a$,
   $e$Transparência significa que o trabalho por trás do Increment é visível e honesto para que o time possa inspecioná-lo. A saída de IA opaca quebra isso.$e$,2,$b$2_understand$b$),

  -- Q8 ----------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000008$g$,'en',
   $t$When a person writes code, a reviewer can ask their intent. What changes when a model writes it?$t$,
   $o$[{"id":"a","text":"Nothing changes"},{"id":"b","text":"That conversation does not exist, so the team must make the AI's contribution inspectable in other ways"},{"id":"c","text":"The code is automatically transparent"},{"id":"d","text":"Transparency no longer applies"}]$o$,
   $a$["b"]$a$,
   $e$Without an author to question, the team keeps the prompts/context, reviews carefully, and is honest about what was machine-generated — to preserve inspectability.$e$,3,$b$3_apply$b$),
  ($g$d6012001-0000-4000-8000-000000000008$g$,'es-419',
   $t$Cuando una persona escribe código, un revisor puede preguntarle su intención. ¿Qué cambia cuando lo escribe un modelo?$t$,
   $o$[{"id":"a","text":"No cambia nada"},{"id":"b","text":"Esa conversación no existe, así que el equipo debe hacer inspeccionable la contribución de la IA de otras maneras"},{"id":"c","text":"El código es automáticamente transparente"},{"id":"d","text":"La transparencia ya no aplica"}]$o$,
   $a$["b"]$a$,
   $e$Sin un autor a quien preguntar, el equipo conserva los prompts/contexto, revisa con cuidado y es honesto sobre qué fue generado por máquina, para preservar la inspeccionabilidad.$e$,3,$b$3_apply$b$),
  ($g$d6012001-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$Quando uma pessoa escreve código, um revisor pode perguntar a intenção dela. O que muda quando um modelo o escreve?$t$,
   $o$[{"id":"a","text":"Nada muda"},{"id":"b","text":"Essa conversa não existe, então o time precisa tornar a contribuição da IA inspecionável de outras formas"},{"id":"c","text":"O código é automaticamente transparente"},{"id":"d","text":"A transparência não se aplica mais"}]$o$,
   $a$["b"]$a$,
   $e$Sem um autor a quem perguntar, o time guarda os prompts/contexto, revisa com cuidado e é honesto sobre o que foi gerado por máquina, para preservar a inspecionabilidade.$e$,3,$b$3_apply$b$),

  -- Q9 ----------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000009$g$,'en',
   $t$Opaque, unverified AI output in the Increment is primarily a failure of:$t$,
   $o$[{"id":"a","text":"Velocity"},{"id":"b","text":"Transparency"},{"id":"c","text":"The Sprint timebox"},{"id":"d","text":"Sprint Planning"}]$o$,
   $a$["b"]$a$,
   $e$If no one can say how a part of the Increment came to be or whether it was checked, the team has lost the transparency that inspection depends on.$e$,2,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000009$g$,'es-419',
   $t$La salida de IA opaca y sin verificar en el Increment es principalmente una falla de:$t$,
   $o$[{"id":"a","text":"Velocity"},{"id":"b","text":"Transparencia"},{"id":"c","text":"El timebox del Sprint"},{"id":"d","text":"Sprint Planning"}]$o$,
   $a$["b"]$a$,
   $e$Si nadie puede decir cómo llegó a existir una parte del Increment o si fue revisada, el equipo perdió la transparencia de la que depende la inspección.$e$,2,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000009$g$,'pt-BR',
   $t$A saída de IA opaca e não verificada no Increment é principalmente uma falha de:$t$,
   $o$[{"id":"a","text":"Velocity"},{"id":"b","text":"Transparência"},{"id":"c","text":"O timebox do Sprint"},{"id":"d","text":"Sprint Planning"}]$o$,
   $a$["b"]$a$,
   $e$Se ninguém consegue dizer como uma parte do Increment passou a existir ou se foi verificada, o time perdeu a transparência da qual a inspeção depende.$e$,2,$b$2_understand$b$),

  -- Q10 ---------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000010$g$,'en',
   $t$Why does opaque AI output threaten Scrum's empiricism specifically?$t$,
   $o$[{"id":"a","text":"It slows the build"},{"id":"b","text":"Inspection depends on transparency; if the work is not visible and verifiable, the team cannot truly inspect or adapt"},{"id":"c","text":"It changes the Sprint length"},{"id":"d","text":"It removes the Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$Empiricism rests on transparency, inspection, and adaptation. Opaque output removes the transparency that inspection needs, so the loop weakens.$e$,4,$b$4_analyze$b$),
  ($g$d6012001-0000-4000-8000-000000000010$g$,'es-419',
   $t$¿Por qué la salida de IA opaca amenaza específicamente el empirismo de Scrum?$t$,
   $o$[{"id":"a","text":"Hace más lenta la construcción"},{"id":"b","text":"La inspección depende de la transparencia; si el trabajo no es visible y verificable, el equipo no puede inspeccionar ni adaptarse de verdad"},{"id":"c","text":"Cambia la duración del Sprint"},{"id":"d","text":"Elimina al Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$El empirismo se apoya en transparencia, inspección y adaptación. La salida opaca quita la transparencia que la inspección necesita, así que el ciclo se debilita.$e$,4,$b$4_analyze$b$),
  ($g$d6012001-0000-4000-8000-000000000010$g$,'pt-BR',
   $t$Por que a saída de IA opaca ameaça especificamente o empirismo do Scrum?$t$,
   $o$[{"id":"a","text":"Ela deixa a construção mais lenta"},{"id":"b","text":"A inspeção depende da transparência; se o trabalho não é visível e verificável, o time não consegue inspecionar nem adaptar de verdade"},{"id":"c","text":"Ela muda a duração do Sprint"},{"id":"d","text":"Ela remove o Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$O empirismo se apoia em transparência, inspeção e adaptação. A saída opaca remove a transparência de que a inspeção precisa, então o ciclo enfraquece.$e$,4,$b$4_analyze$b$),

  -- Q11 ---------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000011$g$,'en',
   $t$A team adds to its working agreement: "AI-generated work is reviewed to the same standard as human work before it counts toward the Increment." This is an example of:$t$,
   $o$[{"id":"a","text":"Lowering the Definition of Done for AI"},{"id":"b","text":"Protecting the Definition of Done as a real gate for AI output"},{"id":"c","text":"Banning AI"},{"id":"d","text":"Replacing the Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$It makes "the AI did it" a normal, inspectable step rather than an excuse — keeping the Definition of Done a genuine gate.$e$,2,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000011$g$,'es-419',
   $t$Un equipo agrega a su acuerdo de trabajo: "El trabajo generado por IA se revisa con el mismo estándar que el trabajo humano antes de contar para el Increment". Esto es un ejemplo de:$t$,
   $o$[{"id":"a","text":"Bajar la Definition of Done para la IA"},{"id":"b","text":"Proteger la Definition of Done como una compuerta real para la salida de IA"},{"id":"c","text":"Prohibir la IA"},{"id":"d","text":"Reemplazar la Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Convierte "lo hizo la IA" en un paso normal e inspeccionable en vez de una excusa, manteniendo la Definition of Done como una compuerta genuina.$e$,2,$b$2_understand$b$),
  ($g$d6012001-0000-4000-8000-000000000011$g$,'pt-BR',
   $t$Um time adiciona ao seu acordo de trabalho: "O trabalho gerado por IA é revisado com o mesmo padrão do trabalho humano antes de contar para o Increment". Isso é um exemplo de:$t$,
   $o$[{"id":"a","text":"Baixar a Definition of Done para a IA"},{"id":"b","text":"Proteger a Definition of Done como um portão real para a saída de IA"},{"id":"c","text":"Proibir a IA"},{"id":"d","text":"Substituir a Definition of Done"}]$o$,
   $a$["b"]$a$,
   $e$Transforma "a IA fez" em um passo normal e inspecionável em vez de uma desculpa, mantendo a Definition of Done como um portão genuíno.$e$,2,$b$2_understand$b$),

  -- Q12 ---------------------------------------------------------------------
  ($g$d6012001-0000-4000-8000-000000000012$g$,'en',
   $t$A team keeps the prompts and context that produced AI code and reviews it as carefully as any external contribution. What are they preserving?$t$,
   $o$[{"id":"a","text":"Velocity"},{"id":"b","text":"The transparency that inspection depends on"},{"id":"c","text":"The Sprint timebox"},{"id":"d","text":"The Product Backlog order"}]$o$,
   $a$["b"]$a$,
   $e$Keeping AI contributions inspectable and honest about what was machine-generated preserves transparency, which inspection requires.$e$,3,$b$3_apply$b$),
  ($g$d6012001-0000-4000-8000-000000000012$g$,'es-419',
   $t$Un equipo conserva los prompts y el contexto que produjeron el código de IA y lo revisa con el mismo cuidado que cualquier contribución externa. ¿Qué están preservando?$t$,
   $o$[{"id":"a","text":"Velocity"},{"id":"b","text":"La transparencia de la que depende la inspección"},{"id":"c","text":"El timebox del Sprint"},{"id":"d","text":"El orden del Product Backlog"}]$o$,
   $a$["b"]$a$,
   $e$Mantener las contribuciones de IA inspeccionables y honestas sobre qué fue generado por máquina preserva la transparencia, que la inspección requiere.$e$,3,$b$3_apply$b$),
  ($g$d6012001-0000-4000-8000-000000000012$g$,'pt-BR',
   $t$Um time guarda os prompts e o contexto que produziram o código de IA e o revisa com o mesmo cuidado de qualquer contribuição externa. O que eles estão preservando?$t$,
   $o$[{"id":"a","text":"Velocity"},{"id":"b","text":"A transparência da qual a inspeção depende"},{"id":"c","text":"O timebox do Sprint"},{"id":"d","text":"A ordem do Product Backlog"}]$o$,
   $a$["b"]$a$,
   $e$Manter as contribuições de IA inspecionáveis e honestas sobre o que foi gerado por máquina preserva a transparência, que a inspeção exige.$e$,3,$b$3_apply$b$)
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
-- Expect 12 per language for task 6.2:
-- select language, count(*) from public.quiz_questions
--  where pool='practice' and task_id = (select id from public.tasks
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.2')
--  group by language order by language;
-- Sanity (expect 0 rows): correct_answer id must exist in options:
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like 'd6012001-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
