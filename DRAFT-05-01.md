# Draft: `05-01-aims-monitoring-and-measurement` (AIMS-F)

**Nothing is written. Two English spans for your approval.**

This lesson is withheld in **all three languages** — `mcp_servable = false`,
`mcp_iso_longest_run = 12` on every row. The English carries a 12-word
reproduction of ISO/IEC 42001:2023, and the leak index is English-only, so the
two translations take their verdict from it.

Draft-scored before you read it: `scripts/score-0501-drafts.mjs`, with a positive
control that reproduces the known 12 and 9 first. No writes anywhere.

---

## What is held, and by exactly what

Both spans come from **ISO/IEC 42001:2023 Annex B, B.6.2.6, *AI system operation
and monitoring*** — the guidance for control A.6.2.6. Located in the PDF, not
remembered: offsets 100755 and 98945, same heading 4.6k and 2.8k characters
above.

**The lesson names no clause at all.** `A.6.2.6`, `B.6.2.6` and `Annex B` each
appear **zero** times; it says "the guidance" seven times. So the drafts add the
attribution as well as removing the reproduction — the same weakness
`ANCHOR-SAMPLE.md` records for the `05-02` pair.

### Span 1 — 12 words, over the floor. This is the blocker.

**The standard (B.6.2.6):**

> the organization should consider the performance of non-AI systems or processes
> in operation and use them as potentially relevant context when establishing
> performance criteria

**The lesson now** — 12 contiguous words shared, from *"the organization"* to
*"processes"*:

> The guidance warns against a specific error in choosing performance criteria:
> the organization should consider the performance of non-AI systems or processes
> already in operation and use them as relevant context. A model with 88% accuracy
> sounds mediocre until you learn the manual process it replaced ran at 71%.
> Absolute numbers without a baseline mislead in both directions.

**Draft — scores 4w:**

> ISO/IEC 42001 Annex B, B.6.2.6 warns against a specific error in choosing
> performance criteria. Whatever the AI system displaced is usually still running
> somewhere — a manual workflow, a rule engine, an older model — and how well it
> performs should be treated as context when the criteria are set. A model with
> 88% accuracy sounds mediocre until you learn the manual process it replaced ran
> at 71%. Absolute numbers without a baseline mislead in both directions.

### Span 2 — 9 words. Under the floor, inside the drafting margin.

Not withholding anything today. It is redrafted because a draft at 9w is one word
from a refusal, and because it is the same clause and the same edit.

**The standard (B.6.2.6):**

> where AI systems are being used for purposes other than those for which they
> were designed or in ways that were not anticipated, the appropriateness of such
> uses should be considered

**The lesson now** — 9 contiguous words, *"systems are being used for purposes
other than those"*:

> The guidance adds a related item that is easy to miss: where systems are being
> used for purposes other than those they were designed for, or in ways nobody
> anticipated, whether those uses are appropriate should be considered. That is a
> monitoring obligation about **use**, not about the model, and no technical
> metric surfaces it.

**Draft — scores 4w:**

> B.6.2.6 adds a related item that is easy to miss. A system can drift because
> people started pointing it at something else, not because the model moved: a job
> it was never designed to do, or one nobody foresaw. Whether such a use is still
> appropriate should itself be considered. That is a monitoring obligation about
> **use**, not about the model, and no technical metric surfaces it.

## What the drafts preserve, asserted rather than claimed

| | |
|---|---|
| **the modal** | `should` survives in both. B.6.2.6 is **Annex B guidance**, so this is a recommendation and not a requirement — a draft that promoted it to `shall` or `must` would change what the standard asks for. The script fails on any such promotion |
| **`performance criteria`** | kept verbatim; it is the term the clause is about |
| **`appropriate`** | kept. The obligation is that the *appropriateness* of an unintended use be considered, not that the use be stopped |
| **`context`** | kept — the point of the span is that prior performance is context for setting criteria, not a target |
| **the teaching point** | unchanged in both: a baseline makes an absolute number meaningful, and unintended use is a monitoring obligation about use rather than about the model |

## Scores

```
                        current   draft
span 1                    12w      4w
span 2                     9w      4w
WHOLE BODY, both spliced  12w      7w      <- clears the 10w floor and the 8-9w margin
```

The whole-body figure is the one that matters: a per-span score cannot see a run
that exists only **across** a seam. 7w is against 27001:2022, not 42001, and is
ordinary technical English.

## If you approve, here is what happens — and nothing goes dark

- **All three rows are already withheld.** So this is a pure improvement with no
  live regression: there is no window in which something served stops serving.
- The English edit fires `trg_lessons_clear_mcp_servable`, which nulls
  `mcp_scanned_at`. **`scan-iso-leaks` must be re-run** or the row stays withheld
  with no error and no queue — the silent trap CLAUDE.md records. `pdftotext` is
  on PATH and all nine PDFs are present, checked.
- `en_content_hash` moves, so both translations' provenance goes stale. They are
  already withheld, so nothing changes for a reader.
- **The translations still carry the reproduction, translated**, and the index
  cannot see it:
  - es-419: *"la organización debería considerar el desempeño de los sistemas o
    procesos no basados en IA que ya están en operación y utilizarlos como
    contexto relevante"*
  - pt-BR: *"convém que a organização considere o desempenho de sistemas ou
    processos não baseados em IA já em operação e os utilize como contexto
    relevante"*

  Both are faithful renderings of the English being replaced, so **both spans
  need retranslating after the English lands** — two spans × two languages. Until
  then the group stays withheld, which is the correct state rather than a
  problem.

**The order matters and it is the safe one:** English first, then re-scan, then
retranslate, then review. Nothing serves until the last step, so there is no
window where a reader meets half a repair.

## The one judgement I want you to check

Span 2's draft moves *"a job it was never designed to do, or one nobody foresaw"*
away from the clause's own phrasing, which is the point — but the clause
distinguishes **two** cases: used for a purpose other than the designed one,
**and** used in a way that was not anticipated. My draft keeps both as two
alternatives joined by *or*, so the conjunction is preserved. If you read the
second as a subset of the first rather than a separate case, say so and I will
collapse it.
