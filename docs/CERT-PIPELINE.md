# The certification bank pipeline

Nine stages, in order. Each has ONE gate that decides whether the stage is done, and ONE script that
runs it. `scripts/run-cert-bank.mjs --cert <CODE> --stage <n>` wraps them; it is dry by default and
adds no logic of its own.

**Supersedes `AIMSF-PATH-TO-LIVE.md`** (deleted: it was AIMS-F-specific and every claim in it had gone
stale once the work it planned was done). Rules live in `CLAUDE.md` §13–§14; this file is the order.

| # | stage | the gate — done means | script |
|---|---|---|---|
| 1 | **library completeness** | every source the task map cites is held, and the declared population per source matches what is extracted. A clause the library DECLARES missing is `pass: null`, not a failure | `check-library-completeness.mjs` |
| 2 | **existing-bank audit** | every existing secure item is classified **keep / drop / provisional / unexamined, with a reason**, and the keep list is written by id. Keep = anchors cleanly AND the blind solver picks the key | `report-survivors.mjs --cert <C>` (needs `anchor-existing-items.mjs --cert=<C> --all-secure` first) |
| 3 | **task map and floors** | every in-scope task has primary passages; floor is `min(default_floor, 2 × effective primaries)` or a `ruled_in` override. **"Held" = audit-KEPT + ACCEPTED GROUNDED only; an unaudited old item counts 0.** Below three effective primaries is `too_thin` — a map question, not work. An override may carry `temporary: true` + a `reason`: a ruled shortfall that goes live and is WARNed by name, never a pass (PROMPT-123 s3) | `check-task-map.mjs --cert <C>`, floors via `lib/task-floors.mjs` |
| 4 | **generation rounds** | survivors of six code gates plus a blind solver, landing `status='draft'`. Raw writer output is persisted BEFORE any gate (`*-raw.json`), so `--from` re-gates free | `gen-grounded-items.mjs` |
| 5 | **the director's read** | every item carries `item_grounding.review_verdict` — `accept`, `reject`, or a tier finding. A `read` is not an acceptance. Rejections go in `<CERT>-DIRECTOR-REJECTIONS.json` | `emit-pilot-report.mjs` → `record-grounded-verdicts.mjs` |
| 6 | **translation** | every accepted English item has an es-419 and a pt-BR sibling sharing its group, option ids, key, pool, visibility and scope; zero glossary pins | `translate-grounded-items.mjs`, repair with `retranslate-flagged.mjs` |
| 7 | **approval** | all conditions per item, re-gated against TODAY's library, promoted as a GROUP with `item_origin='grounded'` in the same write. Nothing is approved by rule. **A row already `approved` is a counted NO-OP, not a refusal** — as a refusal it blocked every re-run after the first success (PROMPT-124). `<CERT>-WITHHELD.json` is a THIRD disposition that can only ever withhold; its rows are retired out of the pool by `retire-withheld.mjs` and brought back by `release-withheld.mjs` | `approve-grounded-items.mjs --cert <C>` |
| 8 | **cutover** | the target pool is SERVABLE (step 2b), zero duplicate stems, and 20 forms per language fill to `num_questions` under the domain weights and the enemy rule — checked BEFORE any write. Not-kept items leave via `retired_at`, recorded for one-command rollback | `cutover-aimsf.mjs`, undo `rollback-cutover.mjs` |
| 9 | **verify-cert** | 0 fails. Floors read from `TASK-FLOORS-<CERT>.json` and the DERIVED floor is applied here too — it was not, so stage 3 and this stage disagreed on any task with fewer than four effective primaries (PROMPT-123). **Only `approved` rows count toward a floor:** a pending row sits in the pool, cannot be served, and used to pad three tasks to floor. The length cue is `keyLengthEscape`/`cueConfigFor`; every check measures the **served** pool (`lib/verify-cert-population.mjs`) unless its label says history | `verify-cert.mjs --cert <C>` |

**Writer: Opus.** Sonnet-5 tested as writer in R6 (ruled PROMPT-119, settled PROMPT-120): 89 attempted but
only 48 generated, and a **31% director reject against ~3% for R3–R5**. `--writer-model` /
`--solver-model` exist; the solver is the quality filter and stays on Opus. `claude-sonnet-5-5` is priced
in the table ($2/$10 per Mtok) and **has not been tested as a writer**.

**SUPERSEDED — writer: `claude-sonnet-5-5` (ruled PROMPT-128 s4, from ISMS-IA on). The solver stays
Opus.** Settled by a SAME-TASK CROSSOVER: ISMS-IA R2 gave both writers the same ten tasks and both
survived 13 of 20, so R1's 25-point gap was the task mix, not the model. Over R1+R2 the cost per
director-ACCEPTED item was **$0.23 against Opus's $0.48**. **Tripwires — either one sends that
certification back to Opus:** a director reject rate **above 15% in any round**, or a task scoring
**0 Sonnet survivors from 4 or more asked** (that task alone reverts). Sonnet-**5** is a different
model and was refused in R6 on the numbers above.

## What each stage may write

Stages 1–3 write **nothing** to the item tables (stage 2 writes a keep-list artifact). Stage 4 writes
drafts. Stage 5 writes verdicts only. Stage 6 writes siblings as `pending_review`. Stage 7 is the first
stage whose output a candidate can be examined on. Stage 8 is the only stage that removes anything from
circulation, and it never deletes.

## The three measurements kept per stage

`PIPELINE-METRICS.json` — cost in USD, session time, and the count the director sent back. Recorded
per stage per certification from PROMPT-109 on, so the second certification can be estimated from the
first rather than guessed. **ISMS-F is closed in `certification_summaries`** with its per-round director
reject rate (273 read, 248 accepted, 9%).

**What the measurement could NOT answer for ISMS-F: the translation stage's cost.** The spend happens on
the run that makes the calls; the artifact is written by the run that writes the rows, which resumes from
the checkpoint and legitimately spends $0 — so all eleven `ISMSF-TRANSLATION-*.json` record `usd: 0` over
304 item-translations. Named rather than estimated. Fixed from PROMPT-125: the checkpoint carries
`usd_cumulative` and the artifact carries `spend.usd_round`.

## Two things the pipeline does not do

- **It does not re-gate old items against a changed library.** That delta is unattributable; generate
  afresh (§13).
- **It does not decide an item is supported.** The model may write the item; the pointing is checked by
  code, and the acceptance by a person.
