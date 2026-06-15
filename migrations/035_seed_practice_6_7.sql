-- 035_seed_practice_6_7.sql
-- =============================================================================
-- Practice pool: 12 questions for task 6.7 (lesson 06-06 capstone "Coaching the
-- AI-Augmented Team"), concepts ai-augmentation-anti-patterns +
-- coaching-restore-empiricism. en + es-419 + pt-BR; shared group_id/question.
-- pool='practice', is_exam_scope=true, status='approved', task_id by code '6.7'.
-- Higher Bloom skew (incl. 5_evaluate) to match the capstone level.
-- Idempotent on (question_group_id, language). Scrum terms kept English.
-- =============================================================================

with task as (
  select id as task_id from public.tasks
  where certification_id = '11111111-1111-1111-1111-111111111111' and code = '6.7'
),
q(grp, lang, qtext, opts, ans, expl, diff, bloom) as (
  values
  -- Q1 ----------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000001$g$,'en',
   $t$A Scrum Master notices a team treating AI output volume as success, skipping review, and delegating the Sprint Goal to its AI. The most accurate description is:$t$,
   $o$[{"id":"a","text":"A single isolated impediment"},{"id":"b","text":"Several AI-augmentation anti-patterns appearing together and reinforcing each other"},{"id":"c","text":"Normal, healthy use of AI in Scrum"},{"id":"d","text":"A tooling problem the vendor should fix"}]$o$,
   $a$["b"]$a$,
   $e$These are distinct anti-patterns — output-as-success, over-trust, delegated accountability — and they typically cluster, each making the others worse.$e$,3,$b$4_analyze$b$),
  ($g$d6017001-0000-4000-8000-000000000001$g$,'es-419',
   $t$Un Scrum Master nota que un equipo trata el volumen de salida de IA como éxito, se salta la revisión y delega el Sprint Goal a su IA. La descripción más precisa es:$t$,
   $o$[{"id":"a","text":"Un único impedimento aislado"},{"id":"b","text":"Varios anti-patrones del aumento con IA que aparecen juntos y se refuerzan entre sí"},{"id":"c","text":"Un uso normal y sano de la IA en Scrum"},{"id":"d","text":"Un problema de herramientas que el proveedor debería arreglar"}]$o$,
   $a$["b"]$a$,
   $e$Son anti-patrones distintos —salida como éxito, exceso de confianza, accountability delegada— y suelen agruparse, empeorándose mutuamente.$e$,3,$b$4_analyze$b$),
  ($g$d6017001-0000-4000-8000-000000000001$g$,'pt-BR',
   $t$Um Scrum Master nota que um time trata o volume de saída de IA como sucesso, pula a revisão e delega o Sprint Goal à sua IA. A descrição mais precisa é:$t$,
   $o$[{"id":"a","text":"Um único impedimento isolado"},{"id":"b","text":"Vários anti-padrões do aumento por IA aparecendo juntos e reforçando uns aos outros"},{"id":"c","text":"Um uso normal e saudável da IA no Scrum"},{"id":"d","text":"Um problema de ferramenta que o fornecedor deveria corrigir"}]$o$,
   $a$["b"]$a$,
   $e$São anti-padrões distintos —saída como sucesso, excesso de confiança, accountability delegada— e costumam se agrupar, piorando uns aos outros.$e$,3,$b$4_analyze$b$),

  -- Q2 ----------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000002$g$,'en',
   $t$Which of these is an AI-augmentation anti-pattern?$t$,
   $o$[{"id":"a","text":"Reviewing AI output against the Definition of Done"},{"id":"b","text":"Treating AI as a team member that holds accountabilities"},{"id":"c","text":"Using AI to draft, with human review"},{"id":"d","text":"Keeping AI prompts and context inspectable"}]$o$,
   $a$["b"]$a$,
   $e$Treating AI as a team member — letting accountabilities drift onto a tool — is an anti-pattern. The others are healthy practices.$e$,2,$b$2_understand$b$),
  ($g$d6017001-0000-4000-8000-000000000002$g$,'es-419',
   $t$¿Cuál de estos es un anti-patrón del aumento con IA?$t$,
   $o$[{"id":"a","text":"Revisar la salida de IA contra la Definition of Done"},{"id":"b","text":"Tratar a la IA como un integrante del equipo que sostiene accountabilities"},{"id":"c","text":"Usar la IA para redactar, con revisión humana"},{"id":"d","text":"Mantener inspeccionables los prompts y el contexto de la IA"}]$o$,
   $a$["b"]$a$,
   $e$Tratar a la IA como integrante del equipo —dejar que las accountabilities se desplacen a una herramienta— es un anti-patrón. Las demás son prácticas sanas.$e$,2,$b$2_understand$b$),
  ($g$d6017001-0000-4000-8000-000000000002$g$,'pt-BR',
   $t$Qual destes é um anti-padrão do aumento por IA?$t$,
   $o$[{"id":"a","text":"Revisar a saída de IA contra a Definition of Done"},{"id":"b","text":"Tratar a IA como um integrante do time que sustenta accountabilities"},{"id":"c","text":"Usar a IA para rascunhar, com revisão humana"},{"id":"d","text":"Manter inspecionáveis os prompts e o contexto da IA"}]$o$,
   $a$["b"]$a$,
   $e$Tratar a IA como integrante do time —deixar as accountabilities deslizarem para uma ferramenta— é um anti-padrão. As demais são práticas saudáveis.$e$,2,$b$2_understand$b$),

  -- Q3 ----------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000003$g$,'en',
   $t$Why do AI-augmentation anti-patterns "rarely appear alone"?$t$,
   $o$[{"id":"a","text":"They occur at random"},{"id":"b","text":"They reinforce each other — over-trust feeds output-as-success, which feeds skipped review"},{"id":"c","text":"Only one can exist per team"},{"id":"d","text":"The Scrum Guide pairs them"}]$o$,
   $a$["b"]$a$,
   $e$A team in trouble usually shows several at once, each making the others worse.$e$,3,$b$3_apply$b$),
  ($g$d6017001-0000-4000-8000-000000000003$g$,'es-419',
   $t$¿Por qué los anti-patrones del aumento con IA "rara vez aparecen solos"?$t$,
   $o$[{"id":"a","text":"Ocurren al azar"},{"id":"b","text":"Se refuerzan entre sí: el exceso de confianza alimenta la salida-como-éxito, que alimenta la revisión omitida"},{"id":"c","text":"Solo puede existir uno por equipo"},{"id":"d","text":"La Guía de Scrum los empareja"}]$o$,
   $a$["b"]$a$,
   $e$Un equipo en problemas suele mostrar varios a la vez, cada uno empeorando a los demás.$e$,3,$b$3_apply$b$),
  ($g$d6017001-0000-4000-8000-000000000003$g$,'pt-BR',
   $t$Por que os anti-padrões do aumento por IA "raramente aparecem sozinhos"?$t$,
   $o$[{"id":"a","text":"Ocorrem ao acaso"},{"id":"b","text":"Reforçam uns aos outros: o excesso de confiança alimenta a saída-como-sucesso, que alimenta a revisão pulada"},{"id":"c","text":"Só pode existir um por time"},{"id":"d","text":"O Guia do Scrum os emparelha"}]$o$,
   $a$["b"]$a$,
   $e$Um time com problemas costuma mostrar vários ao mesmo tempo, cada um piorando os demais.$e$,3,$b$3_apply$b$),

  -- Q4 ----------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000004$g$,'en',
   $t$In coaching, "naming the anti-pattern" is:$t$,
   $o$[{"id":"a","text":"The full fix"},{"id":"b","text":"Diagnosis — it tells you what the team needs to see, but is not yet coaching"},{"id":"c","text":"Irrelevant"},{"id":"d","text":"The same as issuing a rule"}]$o$,
   $a$["b"]$a$,
   $e$Naming is diagnosis; it surfaces what the team must see, but naming is not yet coaching.$e$,2,$b$2_understand$b$),
  ($g$d6017001-0000-4000-8000-000000000004$g$,'es-419',
   $t$En el coaching, "nombrar el anti-patrón" es:$t$,
   $o$[{"id":"a","text":"La solución completa"},{"id":"b","text":"Diagnóstico: te dice qué necesita ver el equipo, pero todavía no es coaching"},{"id":"c","text":"Irrelevante"},{"id":"d","text":"Lo mismo que emitir una regla"}]$o$,
   $a$["b"]$a$,
   $e$Nombrar es diagnóstico; saca a la luz lo que el equipo debe ver, pero nombrar todavía no es coaching.$e$,2,$b$2_understand$b$),
  ($g$d6017001-0000-4000-8000-000000000004$g$,'pt-BR',
   $t$No coaching, "nomear o anti-padrão" é:$t$,
   $o$[{"id":"a","text":"A correção completa"},{"id":"b","text":"Diagnóstico: diz o que o time precisa ver, mas ainda não é coaching"},{"id":"c","text":"Irrelevante"},{"id":"d","text":"O mesmo que emitir uma regra"}]$o$,
   $a$["b"]$a$,
   $e$Nomear é diagnóstico; traz à tona o que o time precisa ver, mas nomear ainda não é coaching.$e$,2,$b$2_understand$b$),

  -- Q5 ----------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000005$g$,'en',
   $t$A team ships fast with AI but cannot explain its modules, trusts the AI's output unchecked, and counts raw output as done. This is best understood as:$t$,
   $o$[{"id":"a","text":"One impediment, easily fixed with a rule"},{"id":"b","text":"A cluster of reinforcing anti-patterns — eroded understanding, over-trust, and output-as-success"},{"id":"c","text":"Healthy high performance"},{"id":"d","text":"A Product Owner failure"}]$o$,
   $a$["b"]$a$,
   $e$Multiple anti-patterns reinforcing each other; recognizing the cluster is the diagnostic step before coaching.$e$,4,$b$4_analyze$b$),
  ($g$d6017001-0000-4000-8000-000000000005$g$,'es-419',
   $t$Un equipo entrega rápido con IA pero no puede explicar sus módulos, confía en la salida de la IA sin verificar y cuenta la salida bruta como hecha. Esto se entiende mejor como:$t$,
   $o$[{"id":"a","text":"Un impedimento, fácil de arreglar con una regla"},{"id":"b","text":"Un conjunto de anti-patrones que se refuerzan: entendimiento erosionado, exceso de confianza y salida-como-éxito"},{"id":"c","text":"Alto desempeño sano"},{"id":"d","text":"Una falla del Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$Varios anti-patrones que se refuerzan; reconocer el conjunto es el paso de diagnóstico antes del coaching.$e$,4,$b$4_analyze$b$),
  ($g$d6017001-0000-4000-8000-000000000005$g$,'pt-BR',
   $t$Um time entrega rápido com IA mas não consegue explicar seus módulos, confia na saída da IA sem verificar e conta a saída bruta como pronta. Isso é melhor entendido como:$t$,
   $o$[{"id":"a","text":"Um impedimento, fácil de corrigir com uma regra"},{"id":"b","text":"Um conjunto de anti-padrões que se reforçam: entendimento erodido, excesso de confiança e saída-como-sucesso"},{"id":"c","text":"Alto desempenho saudável"},{"id":"d","text":"Uma falha do Product Owner"}]$o$,
   $a$["b"]$a$,
   $e$Vários anti-padrões reforçando uns aos outros; reconhecer o conjunto é o passo de diagnóstico antes do coaching.$e$,4,$b$4_analyze$b$),

  -- Q6 ----------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000006$g$,'en',
   $t$Which of these is NOT an AI-augmentation anti-pattern?$t$,
   $o$[{"id":"a","text":"Output called Done without meeting the Definition of Done"},{"id":"b","text":"Reviewing AI output to the same standard as human work"},{"id":"c","text":"Knowledge trapped in private AI chats"},{"id":"d","text":"Delegating accountability to the AI"}]$o$,
   $a$["b"]$a$,
   $e$Reviewing AI output to the same standard as human work is the healthy practice, not an anti-pattern.$e$,2,$b$2_understand$b$),
  ($g$d6017001-0000-4000-8000-000000000006$g$,'es-419',
   $t$¿Cuál de estos NO es un anti-patrón del aumento con IA?$t$,
   $o$[{"id":"a","text":"Salida llamada Done sin cumplir la Definition of Done"},{"id":"b","text":"Revisar la salida de IA con el mismo estándar que el trabajo humano"},{"id":"c","text":"Conocimiento atrapado en chats privados con IA"},{"id":"d","text":"Delegar la accountability a la IA"}]$o$,
   $a$["b"]$a$,
   $e$Revisar la salida de IA con el mismo estándar que el trabajo humano es la práctica sana, no un anti-patrón.$e$,2,$b$2_understand$b$),
  ($g$d6017001-0000-4000-8000-000000000006$g$,'pt-BR',
   $t$Qual destes NÃO é um anti-padrão do aumento por IA?$t$,
   $o$[{"id":"a","text":"Saída chamada de Done sem cumprir a Definition of Done"},{"id":"b","text":"Revisar a saída de IA com o mesmo padrão do trabalho humano"},{"id":"c","text":"Conhecimento preso em chats privados com IA"},{"id":"d","text":"Delegar a accountability à IA"}]$o$,
   $a$["b"]$a$,
   $e$Revisar a saída de IA com o mesmo padrão do trabalho humano é a prática saudável, não um anti-padrão.$e$,2,$b$2_understand$b$),

  -- Q7 ----------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000007$g$,'en',
   $t$What is the best first coaching move when a team is deep in AI-augmentation anti-patterns?$t$,
   $o$[{"id":"a","text":"Take over the team's reviews until things stabilize"},{"id":"b","text":"Make the pattern visible without blame and ask the team what they notice"},{"id":"c","text":"Escalate to management to mandate change"},{"id":"d","text":"Ban the AI tool entirely"}]$o$,
   $a$["b"]$a$,
   $e$Coaching starts by helping the team see its own pattern; visibility plus a question creates the conditions for the team to choose and own a change.$e$,2,$b$3_apply$b$),
  ($g$d6017001-0000-4000-8000-000000000007$g$,'es-419',
   $t$¿Cuál es el mejor primer movimiento de coaching cuando un equipo está hundido en anti-patrones del aumento con IA?$t$,
   $o$[{"id":"a","text":"Hacerte cargo de las revisiones del equipo hasta que se estabilice"},{"id":"b","text":"Hacer visible el patrón sin culpa y preguntar al equipo qué nota"},{"id":"c","text":"Escalar a la gerencia para imponer el cambio"},{"id":"d","text":"Prohibir por completo la herramienta de IA"}]$o$,
   $a$["b"]$a$,
   $e$El coaching empieza ayudando al equipo a ver su propio patrón; la visibilidad más una pregunta crean las condiciones para que elija y sea dueño de un cambio.$e$,2,$b$3_apply$b$),
  ($g$d6017001-0000-4000-8000-000000000007$g$,'pt-BR',
   $t$Qual é o melhor primeiro movimento de coaching quando um time está afundado em anti-padrões do aumento por IA?$t$,
   $o$[{"id":"a","text":"Assumir as revisões do time até as coisas se estabilizarem"},{"id":"b","text":"Tornar o padrão visível sem culpa e perguntar ao time o que ele nota"},{"id":"c","text":"Escalar para a gestão para impor a mudança"},{"id":"d","text":"Proibir a ferramenta de IA por completo"}]$o$,
   $a$["b"]$a$,
   $e$O coaching começa ajudando o time a ver o próprio padrão; a visibilidade mais uma pergunta criam as condições para o time escolher e ser dono de uma mudança.$e$,2,$b$3_apply$b$),

  -- Q8 ----------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000008$g$,'en',
   $t$Why is issuing a list of rules a poor fix for AI-augmentation anti-patterns?$t$,
   $o$[{"id":"a","text":"Rules take too long to write"},{"id":"b","text":"Policed behavior reverts without understanding; the team adds instructions to obey instead of restoring its own inspect-and-adapt"},{"id":"c","text":"The Scrum Guide forbids Scrum Masters from setting rules"},{"id":"d","text":"Only the Product Owner may write rules"}]$o$,
   $a$["b"]$a$,
   $e$Empiricism is something a team does, not a rule it follows. Rules without ownership revert; coaching the team to own the change restores the capability.$e$,3,$b$4_analyze$b$),
  ($g$d6017001-0000-4000-8000-000000000008$g$,'es-419',
   $t$¿Por qué emitir una lista de reglas es una mala solución para los anti-patrones del aumento con IA?$t$,
   $o$[{"id":"a","text":"Las reglas tardan demasiado en escribirse"},{"id":"b","text":"El comportamiento vigilado revierte sin entendimiento; el equipo agrega instrucciones que obedecer en vez de restaurar su propio inspeccionar y adaptar"},{"id":"c","text":"La Guía de Scrum prohíbe a los Scrum Masters poner reglas"},{"id":"d","text":"Solo el Product Owner puede escribir reglas"}]$o$,
   $a$["b"]$a$,
   $e$El empirismo es algo que un equipo hace, no una regla que sigue. Las reglas sin propiedad revierten; hacer coaching para que el equipo sea dueño del cambio restaura la capacidad.$e$,3,$b$4_analyze$b$),
  ($g$d6017001-0000-4000-8000-000000000008$g$,'pt-BR',
   $t$Por que emitir uma lista de regras é uma má solução para os anti-padrões do aumento por IA?$t$,
   $o$[{"id":"a","text":"As regras demoram demais para escrever"},{"id":"b","text":"O comportamento policiado reverte sem entendimento; o time adiciona instruções para obedecer em vez de restaurar o próprio inspecionar e adaptar"},{"id":"c","text":"O Guia do Scrum proíbe Scrum Masters de definir regras"},{"id":"d","text":"Só o Product Owner pode escrever regras"}]$o$,
   $a$["b"]$a$,
   $e$O empirismo é algo que um time faz, não uma regra que ele segue. Regras sem propriedade revertem; fazer coaching para o time ser dono da mudança restaura a capacidade.$e$,3,$b$4_analyze$b$),

  -- Q9 ----------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000009$g$,'en',
   $t$A Scrum Master quietly fixes the worst AI issues between Sprints. Why does this fail as a coaching approach?$t$,
   $o$[{"id":"a","text":"It is too slow"},{"id":"b","text":"Rescuing makes the team dependent and bypasses ownership, so the dysfunction returns"},{"id":"c","text":"It violates the Sprint timebox"},{"id":"d","text":"It is actually the best approach"}]$o$,
   $a$["b"]$a$,
   $e$Rescuing (fixing it yourself) bypasses the team's ownership; the dysfunction resurfaces because the team never confronts it.$e$,3,$b$4_analyze$b$),
  ($g$d6017001-0000-4000-8000-000000000009$g$,'es-419',
   $t$Un Scrum Master arregla en silencio los peores problemas de IA entre Sprints. ¿Por qué falla como enfoque de coaching?$t$,
   $o$[{"id":"a","text":"Es demasiado lento"},{"id":"b","text":"Rescatar vuelve dependiente al equipo y esquiva la propiedad, así que la disfunción regresa"},{"id":"c","text":"Viola el timebox del Sprint"},{"id":"d","text":"En realidad es el mejor enfoque"}]$o$,
   $a$["b"]$a$,
   $e$Rescatar (arreglarlo tú mismo) esquiva la propiedad del equipo; la disfunción reaparece porque el equipo nunca la confronta.$e$,3,$b$4_analyze$b$),
  ($g$d6017001-0000-4000-8000-000000000009$g$,'pt-BR',
   $t$Um Scrum Master conserta em silêncio os piores problemas de IA entre Sprints. Por que isso falha como abordagem de coaching?$t$,
   $o$[{"id":"a","text":"É lento demais"},{"id":"b","text":"Resgatar torna o time dependente e contorna a propriedade, então a disfunção volta"},{"id":"c","text":"Viola o timebox do Sprint"},{"id":"d","text":"Na verdade é a melhor abordagem"}]$o$,
   $a$["b"]$a$,
   $e$Resgatar (consertar você mesmo) contorna a propriedade do time; a disfunção volta porque o time nunca a confronta.$e$,3,$b$4_analyze$b$),

  -- Q10 ---------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000010$g$,'en',
   $t$After a coaching conversation about AI over-trust, how can the Scrum Master tell empiricism was actually restored rather than just instructed?$t$,
   $o$[{"id":"a","text":"The team produces more output the next Sprint"},{"id":"b","text":"The team can explain in its own words why the change matters and chose the change itself"},{"id":"c","text":"The AI metrics improve"},{"id":"d","text":"The Scrum Master no longer attends the Retrospective"}]$o$,
   $a$["b"]$a$,
   $e$Restored empiricism shows up as ownership and understanding: the team chose the change and can articulate why. Reciting an instruction is not the same as having adapted.$e$,3,$b$5_evaluate$b$),
  ($g$d6017001-0000-4000-8000-000000000010$g$,'es-419',
   $t$Tras una conversación de coaching sobre el exceso de confianza en la IA, ¿cómo sabe el Scrum Master si el empirismo se restauró de verdad y no solo se instruyó?$t$,
   $o$[{"id":"a","text":"El equipo produce más salida el siguiente Sprint"},{"id":"b","text":"El equipo puede explicar con sus palabras por qué importa el cambio y eligió el cambio por sí mismo"},{"id":"c","text":"Mejoran las métricas de IA"},{"id":"d","text":"El Scrum Master ya no asiste a la Retrospective"}]$o$,
   $a$["b"]$a$,
   $e$El empirismo restaurado se ve como propiedad y entendimiento: el equipo eligió el cambio y puede articular por qué. Repetir una instrucción no es lo mismo que haberse adaptado.$e$,3,$b$5_evaluate$b$),
  ($g$d6017001-0000-4000-8000-000000000010$g$,'pt-BR',
   $t$Após uma conversa de coaching sobre o excesso de confiança na IA, como o Scrum Master sabe se o empirismo foi de fato restaurado e não apenas instruído?$t$,
   $o$[{"id":"a","text":"O time produz mais saída no próximo Sprint"},{"id":"b","text":"O time consegue explicar com as próprias palavras por que a mudança importa e escolheu a mudança ele mesmo"},{"id":"c","text":"As métricas de IA melhoram"},{"id":"d","text":"O Scrum Master não participa mais da Retrospective"}]$o$,
   $a$["b"]$a$,
   $e$O empirismo restaurado aparece como propriedade e entendimento: o time escolheu a mudança e consegue articular por quê. Repetir uma instrução não é o mesmo que ter se adaptado.$e$,3,$b$5_evaluate$b$),

  -- Q11 ---------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000011$g$,'en',
   $t$After coaching, a team can recite the new review rule but cannot say why it matters. What does this indicate?$t$,
   $o$[{"id":"a","text":"Empiricism is fully restored"},{"id":"b","text":"An instruction was given, not a capability restored — the coaching is incomplete"},{"id":"c","text":"The team is high-performing"},{"id":"d","text":"The AI is well-configured"}]$o$,
   $a$["b"]$a$,
   $e$If the team can only recite what it was told, that is an instruction, not restored inspect-and-adapt.$e$,4,$b$5_evaluate$b$),
  ($g$d6017001-0000-4000-8000-000000000011$g$,'es-419',
   $t$Tras el coaching, un equipo puede repetir la nueva regla de revisión pero no puede decir por qué importa. ¿Qué indica esto?$t$,
   $o$[{"id":"a","text":"El empirismo está totalmente restaurado"},{"id":"b","text":"Se dio una instrucción, no se restauró una capacidad: el coaching está incompleto"},{"id":"c","text":"El equipo es de alto desempeño"},{"id":"d","text":"La IA está bien configurada"}]$o$,
   $a$["b"]$a$,
   $e$Si el equipo solo puede repetir lo que le dijeron, eso es una instrucción, no un inspeccionar y adaptar restaurado.$e$,4,$b$5_evaluate$b$),
  ($g$d6017001-0000-4000-8000-000000000011$g$,'pt-BR',
   $t$Após o coaching, um time consegue repetir a nova regra de revisão mas não consegue dizer por que ela importa. O que isso indica?$t$,
   $o$[{"id":"a","text":"O empirismo está totalmente restaurado"},{"id":"b","text":"Uma instrução foi dada, não uma capacidade restaurada: o coaching está incompleto"},{"id":"c","text":"O time é de alto desempenho"},{"id":"d","text":"A IA está bem configurada"}]$o$,
   $a$["b"]$a$,
   $e$Se o time só consegue repetir o que lhe foi dito, isso é uma instrução, não um inspecionar e adaptar restaurado.$e$,4,$b$5_evaluate$b$),

  -- Q12 ---------------------------------------------------------------------
  ($g$d6017001-0000-4000-8000-000000000012$g$,'en',
   $t$Why is "the coaching is the repair" an accurate way to describe restoring empiricism?$t$,
   $o$[{"id":"a","text":"Coaching produces more code"},{"id":"b","text":"A team that sees its own pattern and chooses its own correction has actually adapted — the very capability the anti-patterns eroded"},{"id":"c","text":"Coaching replaces the Retrospective"},{"id":"d","text":"Coaching sets the Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$Adapting — choosing and owning the change — is itself the capability empiricism needs, so doing it restores it.$e$,3,$b$4_analyze$b$),
  ($g$d6017001-0000-4000-8000-000000000012$g$,'es-419',
   $t$¿Por qué "el coaching es la reparación" describe con precisión restaurar el empirismo?$t$,
   $o$[{"id":"a","text":"El coaching produce más código"},{"id":"b","text":"Un equipo que ve su propio patrón y elige su propia corrección de verdad se adaptó: justo la capacidad que los anti-patrones erosionaron"},{"id":"c","text":"El coaching reemplaza la Retrospective"},{"id":"d","text":"El coaching fija el Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$Adaptarse —elegir y ser dueño del cambio— es en sí la capacidad que el empirismo necesita, así que hacerlo la restaura.$e$,3,$b$4_analyze$b$),
  ($g$d6017001-0000-4000-8000-000000000012$g$,'pt-BR',
   $t$Por que "o coaching é o reparo" descreve com precisão restaurar o empirismo?$t$,
   $o$[{"id":"a","text":"O coaching produz mais código"},{"id":"b","text":"Um time que vê o próprio padrão e escolhe a própria correção de fato se adaptou: justamente a capacidade que os anti-padrões erodiram"},{"id":"c","text":"O coaching substitui a Retrospective"},{"id":"d","text":"O coaching define o Sprint Goal"}]$o$,
   $a$["b"]$a$,
   $e$Adaptar-se —escolher e ser dono da mudança— é em si a capacidade que o empirismo precisa, então fazê-lo a restaura.$e$,3,$b$4_analyze$b$)
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
-- Expect 12 per language for task 6.7:
-- select language, count(*) from public.quiz_questions
--  where pool='practice' and task_id = (select id from public.tasks
--    where certification_id='11111111-1111-1111-1111-111111111111' and code='6.7')
--  group by language order by language;
-- Sanity (expect 0 rows):
-- select question_group_id, language from public.quiz_questions q
--  where q.question_group_id::text like 'd6017001-%'
--    and not (q.options @> jsonb_build_array(jsonb_build_object('id', q.correct_answer->>0)));
-- Full D6 practice tally (expect 84 per language = 252 rows):
-- select q.language, count(*) from public.quiz_questions q
--  join public.tasks t on t.id = q.task_id
--  where q.pool='practice' and t.domain_id = 'd0d10001-0000-0000-0000-000000000006'
--  group by q.language order by q.language;
