certidemy-supabase

# PROMPT 4 — Full read of the four blocked draws

566 rows: AIE-I/pt-BR (47), AIMS-IA/pt-BR (158), ISMS-F/es-419 (192), ISMS-IA/es-419 (169).

## 4.1 — What triggered each block

From `CLEARANCE-PLAN.json` → `block[].blocking_rows`. All four are rung-2 defects: right
language, wrong referent, invisible to every mechanical guard.

| Draw | Slug | Defect |
|---|---|---|
| AIE-I / pt-BR | `genai-limitations` | "quotations" → `transcrições` (transcripts) |
| ISMS-F / es-419 | `risk-acceptance-criteria` | `a partir de los cuales` inverts the threshold |
| ISMS-IA / es-419 | `ia-awareness-clause-7-3` | "not conforming" → `la no conformidad`, the ISO defined term |
| AIMS-IA / pt-BR | `aia-ai-policy-requirements` | clause→`Seção` substitution killed the clause-vs-control contrast |

In all three cases where the same concept was also drawn in the other language, **the other
language was correct.** That is why the block is per certification+language rather than per
certification, and it means these are per-row defects, not a systematic generator fault.

## 4.2 — Generate the read files

One file per blocked draw, same shape as `CONCEPT-SAMPLE.json`, **all** rows in that
certification+language, `en_description` beside `tr_description`, empty `verdict` and `note`.
Send them to me.

Order them largest-signal-first within each file: rows whose English contains a normative modal
(`shall`, `should`, `may`), a clause citation, or a defined term first, because that is where
rung-2 defects concentrate. Put the already-identified blocking row at the top of its file with
its note attached.

## 4.3 — Do not pre-fix

Do not repair the four known defects before generating the files. If they are fixed first, the
full read loses its anchor — I want to see whether the same hand made the same class of error
elsewhere in the same draw, and a repaired row hides that.
