certidemy-supabase

# PROMPT 1 — Clearance pass, and the AIMS-F census

Read `CLEARANCE-PLAN.json` and `CONCEPT-SAMPLE-REVIEWED.json` in the repo root. A human
read all 480 sampled concept translation rows on 2026-09-21. This prompt acts on that verdict.

## 1.1 — Census first, because it sizes later work

Before writing anything, answer these against the database and show me the numbers:

- How many of AIMS-F's concept descriptions match the stub pattern — the description is the
  concept name followed by ` as required or described by ISO/IEC 42001:2023 and taught in the
  AIMS-F blueprint.`? Report `stub_count` and `total_concepts` for AIMS-F.
- Does any OTHER certification have descriptions matching an analogous name-plus-fixed-tail
  pattern? Group by certification and report the count of rows sharing the longest common
  description suffix within each certification, where that suffix is over 40 characters.
- For AIMS-F, are `tasks.knowledge`, `tasks.skills` and `tasks.abilities` populated, or is the
  concept layer the only hollow one? Report populated vs null counts.

I expect AIMS-F `stub_count` to be 154 of 154. 38 are already confirmed — 35 read in the
sample plus `cause-analysis`, `ai-policy` and `competence-does-not-carry` pulled live over MCP.
If the number is lower, tell me which AIMS-F concepts have real descriptions; those are the
house-style reference for the repair.

## 1.2 — Clear the 18 clean draws

For each entry in `CLEARANCE-PLAN.json` → `clear` (18 certification+language pairs, 2,586 rows):

- Write a row to the concept translation review table recording: certification, language,
  seed `2026-09-20-concepts`, sample size 20, reviewed_on `2026-09-21`, verdict `approved`,
  and the `en_hash` gate so a later English edit makes the review stale automatically —
  same pattern as `lesson_translation_reviews` and migration 352's translation-side hash.
- Set `is_provisional = false` for those certification+language pairs **only**.

The review row must carry the clearance wording from `CLEARANCE-PLAN.json` →
`clearance_claim_wording` verbatim. It says this is 20 rows per certification per language,
not a percentage. Draws ranged from 9% of AISM-I to 43% of AIE-I. Nothing may restate this
clearance as "8% of the corpus".

## 1.3 — Hold AIMS-F in both languages, with the reason in the row

AIMS-F es-419 and pt-BR drew **zero** translation defects. Do not clear them.

Write a review row for each with verdict `held` and the reason from `CLEARANCE-PLAN.json` →
`hold[].reason`: the English source descriptions are placeholder boilerplate, the translations
are faithful renderings of a stub, and clearing them would put review provenance behind text
that teaches nothing. `is_provisional` stays `true` for all 308 AIMS-F rows.

This row exists so that nobody later clears AIMS-F by looking only at a clean sample. The
sample is clean. That is the trap.

## 1.4 — Mark the 4 blocked draws

AIE-I/pt-BR, AIMS-IA/pt-BR, ISMS-F/es-419, ISMS-IA/es-419. Write a review row with verdict
`blocked`, carrying the blocking slug and note from the plan. `is_provisional` stays `true`
for all 566 rows in those four pairs. Prompt 4 works them.

## 1.5 — Record two rules in CLAUDE.md, each with its mechanism

**Rule — a sampling gate is scoped to what the sample can see.** A translation-fidelity sample
cannot clear source adequacy. AIMS-F returned a perfectly clean 40-row draw sitting over 154
placeholder descriptions, and every mechanical check passed: no empties, nothing identical to
English, no number drift, no dropped terms. Mechanism: before a certification enters any
translation queue, a source-adequacy check runs on the English — a description that is its own
name plus a tail shared by more than 20 rows in the same certification is a stub, and that
certification does not enter the queue. Every review row records whether a source gate ran.

**Rule — template-generated English must be template-generated in translation.** AIMS-F's
es-419 rows rendered one fixed English tail four different ways across 20 rows
(`blueprint AIMS-F` / `temario de AIMS-F` / `plan de estudios AIMS-F` / `temario AIMS-F`, and
three variants of `as required or described by`). Mechanism: where more than 20 English rows in
one certification share a description suffix, that suffix is translated once and substituted,
never translated per row. Guard: assert the count of distinct translated suffixes is exactly 1
per language.

## 1.6 — Post-conditions

Post-conditions assert a checksum over rows the migration is **not** authorised to change, not
a hardcoded row count. Four migrations have aborted against a correct database on hardcoded
literals (328, 345, 351, 352); do not make it five. Run every post-condition under
`set local role mcp_reader` — the 341 pattern — because 339 reached production and 500'd
`explain_task` in two languages for two hours.

Then verify on the wire, not from your own output: `get_concept` in all three languages for one
cleared certification (should now serve the translated description), one held AIMS-F concept
(should still fall back to English), and one blocked certification (should still fall back).
