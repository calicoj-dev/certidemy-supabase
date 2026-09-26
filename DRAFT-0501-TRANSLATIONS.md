# 05-01: the four translated spans, for your read

**English landed and re-scanned. These four are drafted and NOT applied.**

---

## Where 05-01 stands now

```
             run   mcp_servable   review_required   lesson_body_is_servable()
en            7        true            false                 TRUE
es-419        7        true            true                  false
pt-BR         7        true            true                  false
```

**The English now serves.** That is the direct consequence of the two steps you
ordered — fix the English, re-scan — and there is no step between them and the row
becoming servable, because the leak was the only thing withholding it. Run went
**12w → 7w**, under the 10w floor and under the 8w drafting margin. `scan-iso-leaks`
wrote 1,437 verdicts, 11 post-conditions passed, 0 failed.

**Both translations are still withheld**, now by the translation-review arm rather
than by the leak arm: the English hash moved, so their reviews are stale. Nothing
serves the old reproduction to anyone.

**Read off the gate, not the column.** All three rows show `mcp_servable = true`;
only `lesson_body_is_servable()` distinguishes them. The column is not the gate.

## Span 1 — the 12w blocker

**English, as landed:**

> ISO/IEC 42001 Annex B, B.6.2.6 warns against a specific error in choosing
> performance criteria. Whatever the AI system displaced is usually still running
> somewhere -- a manual workflow, a rule engine, an older model -- and how well it
> performs should be treated as context when the criteria are set. A model with 88%
> accuracy sounds mediocre until you learn the manual process it replaced ran at
> 71%. Absolute numbers without a baseline mislead in both directions.

**es-419, drafted:**

> ISO/IEC 42001 Anexo B, B.6.2.6 advierte sobre un error específico al elegir
> criterios de desempeño. Aquello que el sistema de IA desplazó suele seguir
> funcionando en algún lugar: un flujo de trabajo manual, un motor de reglas, un
> modelo anterior. Su desempeño debería tratarse como contexto al fijar los
> criterios. Un modelo con un 88 % de exactitud parece mediocre hasta que se
> descubre que el proceso manual que reemplazó operaba al 71 %. Los números
> absolutos sin una línea de base inducen a error en ambas direcciones.

**pt-BR, drafted:**

> ISO/IEC 42001 Anexo B, B.6.2.6 alerta contra um erro específico na escolha de
> critérios de desempenho. Aquilo que o sistema de IA substituiu normalmente
> continua funcionando em algum lugar: um fluxo de trabalho manual, um motor de
> regras, um modelo mais antigo. Convém que seu desempenho seja tratado como
> contexto ao definir os critérios. Um modelo com 88% de acurácia parece medíocre
> até você descobrir que o processo manual que ele substituiu operava a 71%.
> Números absolutos sem uma linha de base induzem ao erro em ambas as direções.

## Span 2 — 9w, and the word you changed

**English, as landed** (`go wrong`, not `drift`):

> B.6.2.6 adds a related item that is easy to miss. A system can **go wrong**
> because people started pointing it at something else, not because the model moved:
> a job it was never designed to do, **or** one nobody foresaw. Whether such a use is
> still appropriate should itself be considered. That is a monitoring obligation
> about **use**, not about the model, and no technical metric surfaces it.

**es-419, drafted:**

> B.6.2.6 añade un elemento relacionado que es fácil pasar por alto. Un sistema
> puede **empezar a fallar** porque las personas comenzaron a usarlo para otra cosa,
> no porque el modelo haya cambiado: una tarea para la que nunca fue diseñado, **o**
> una que nadie previó. Debería considerarse si ese uso sigue siendo apropiado. Esa
> es una obligación de seguimiento sobre el **uso**, no sobre el modelo, y ninguna
> métrica técnica la hace visible.

**pt-BR, drafted:**

> B.6.2.6 acrescenta um item relacionado que é fácil de ignorar. Um sistema pode
> **falhar** porque as pessoas passaram a usá-lo para outra finalidade, não porque o
> modelo mudou: uma tarefa para a qual nunca foi projetado, **ou** uma que ninguém
> previu. Convém que se considere se tal uso continua adequado. Isso é uma obrigação
> de monitoramento sobre o **uso**, não sobre o modelo, e nenhuma métrica técnica a
> revela.

## What was asserted before these reached you

All four scored through G1–G7, Check A, Check B, Check D and the refusal pattern.
**Four clean, zero gate findings.** Plus, per span and language:

| | |
|---|---|
| **the modal** | `debería` in es, `convém que` in pt. **`debe`, `deberá`, `deve`, `deverá`, `tiene que`, `tem que` are refused by the script** — B.6.2.6 is Annex B guidance and promoting it would change what the standard asks |
| **`drift` stays out** | `deriva` and `desvío` / `desvio` are refused. Your word change exists so the paragraph does not borrow the term this certification teaches, and a translation that reintroduced it would undo that |
| **both cases stay separate** | `, o ` in es and `, ou ` in pt are asserted present. B.6.2.6 distinguishes *a purpose other than the designed one* from *a way that was not anticipated*, and collapsing them changes the clause |
| **terms kept** | `criterios de desempeño` / `critérios de desempenho`, `contexto`, `apropiado` / `adequado` |

**One rendering choice worth your eye:** *go wrong* became **`empezar a fallar`** in
Spanish and **`falhar`** in Portuguese. Both mean *to fail* rather than *to go
wrong*, which is slightly narrower — the English allows "still working, just no
longer the right thing". If you want the wider sense, `dejar de ser adecuado` /
`deixar de ser adequado` carries it, at the cost of repeating *adecuado* two
sentences before `apropiado`.

## The remaining order

1. ~~English~~ — done, serving at 7w
2. ~~re-scan~~ — done, run 7 on all three rows
3. **you read these four spans** ← here
4. apply the two translated rows, byte read-back
5. record a `lesson_translation_reviews` row per row so the review arm re-opens
6. the group serves in all three languages

Nothing serves in es or pt until step 5.
