# The certification bank pipeline

Eight stages, in order. Each has ONE gate that decides whether the stage is done, and ONE script that
runs it. `scripts/run-cert-bank.mjs --cert <CODE> --stage <n>` wraps them; it is dry by default and
adds no logic of its own.

**Supersedes `AIMSF-PATH-TO-LIVE.md`** (deleted: it was AIMS-F-specific and every claim in it had gone
stale once the work it planned was done). Rules live in `CLAUDE.md` §13–§14; this file is the order.

| # | stage | the gate — done means | script |
|---|---|---|---|
| 1 | **library completeness** | every source the task map cites is held, and the declared population per source matches what is extracted. A clause the library DECLARES missing is `pass: null`, not a failure | `check-library-completeness.mjs` |
| 2 | **task map and floors** | every in-scope task has primary passages; each task's floor is `min(default_floor, 2 × effective primaries)` or a `ruled_in` override. A task below three effective primaries is `too_thin` — a map question for the director, not work | `rollout-shortfall.mjs`, floors via `lib/task-floors.mjs` |
| 3 | **generation rounds** | survivors of six code gates plus a blind solver, landing `status='draft'`. Raw writer output is persisted BEFORE any gate (`*-raw.json`), so `--from` re-gates free | `gen-grounded-items.mjs` |
| 4 | **the director's read** | every item carries `item_grounding.review_verdict` — `accept`, `reject`, or a tier finding. A `read` is not an acceptance. Rejections go in `<CERT>-DIRECTOR-REJECTIONS.json` | `emit-pilot-report.mjs` → `record-grounded-verdicts.mjs` |
| 5 | **translation** | every accepted English item has an es-419 and a pt-BR sibling sharing its group, option ids, key, pool, visibility and scope; zero glossary pins | `translate-grounded-items.mjs`, repair with `retranslate-flagged.mjs` |
| 6 | **approval** | all conditions per item, re-gated against TODAY's library, promoted as a GROUP with `item_origin='grounded'` in the same write. Nothing is approved by rule | `approve-grounded-items.mjs --cert <C>` |
| 7 | **cutover** | the target pool is SERVABLE (step 2b), zero duplicate stems, and 20 forms per language fill to `num_questions` under the domain weights and the enemy rule — checked BEFORE any write. Not-kept items leave via `retired_at`, recorded for one-command rollback | `cutover-aimsf.mjs`, undo `rollback-cutover.mjs` |
| 8 | **verify-cert** | 0 fails. Floors read from `TASK-FLOORS-<CERT>.json`; the length cue is `keyLengthEscape`/`cueConfigFor` and nothing else | `verify-cert.mjs --cert <C>` |

## What each stage may write

Stages 1–2 write **nothing**. Stage 3 writes drafts. Stage 4 writes verdicts only. Stage 5 writes
siblings as `pending_review`. Stage 6 is the first stage whose output a candidate can be examined on.
Stage 7 is the only stage that removes anything from circulation, and it never deletes.

## The three measurements kept per stage

`PIPELINE-METRICS.json` — cost in USD, session time, and the count the director sent back. Recorded
per stage per certification from PROMPT-109 on, so the second certification can be estimated from the
first rather than guessed.

## Two things the pipeline does not do

- **It does not re-gate old items against a changed library.** That delta is unattributable; generate
  afresh (§13).
- **It does not decide an item is supported.** The model may write the item; the pointing is checked by
  code, and the acceptance by a person.
