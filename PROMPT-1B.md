certidemy-supabase

Correction to migration 356. Two draws it cleared should not have cleared, and both are
serving a meaning defect right now. This prompt re-provisions them, then runs the check that
found them across every slug the review touched.

`CLEARANCE-PLAN.json` in the repo root has been revised — re-read it. It now says
**16 clear (2,236 rows) / 6 blocked (916 rows) / 2 held (308 rows)**, still summing to 3,460.
Its `rule` field has been rewritten and supersedes what 356 recorded.

## 1 — Why this happened, because the mechanism matters more than the two rows

The reviewer found 4 meaning defects. For 3 of them the same concept also appeared in the
other language's draw, and all 3 siblings were correct. From that the reviewer concluded the
defects were per-row rather than rooted in the English, and refined the blocking rule to
per-certification+language.

The 3 observations were exactly the concepts that happened to land in both independent draws.
Your targeted sibling check on all 4 blocking slugs returned **2 hits**. The inference was
drawn from a base of 3 and the real rate is 2 of 4.

Both draws that cleared on that reasoning are serving the defect:

- `ISMS-F` / `pt-BR` / `risk-acceptance-criteria` — *"os limiares a partir dos quais um risco
  pode ser retido"*, the same threshold inversion that blocked es-419
- `AIMS-IA` / `es-419` / `aia-ai-policy-requirements` — *"Este es un requisito de apartado"*,
  the same mechanical clause-substitution that blocked pt-BR, destroying the same
  normative-clause versus selected-control contrast

## 2 — Migration 357: re-provision and re-block

- Set `is_provisional = true` for all 192 `ISMS-F` / `pt-BR` and all 158 `AIMS-IA` / `es-419`
  concept translation rows.
- Update their `concept_translation_reviews` rows from `approved` to `blocked`, carrying the
  blocking slug and note from the revised plan, plus the `found_by` field, which records that
  the 20-row draw did not find these — a targeted sibling check did.
- Do not delete the superseded review rows. A clearance that was withdrawn is a fact about
  this corpus and the next person needs to see that it happened, not find a gap.

Same discipline as 356: generate the data block from the revised plan rather than typing it,
post-conditions as a checksum over rows the migration is not authorised to change, every
post-condition under `set local role mcp_reader`.

Then verify on the wire, and report what the endpoint returned rather than what the migration
intended: both rows must now fall back to English, and `ISMS-F` / `es-419` must still fall back
while a still-cleared draw still serves.

## 3 — Then run the sibling check across everything the review touched

The check cost one query and returned 50% on the 4 slugs it was pointed at. It has not been run
on the other 25.

`CONCEPT-SAMPLE-REVIEWED.json` carries 29 rows with a verdict of `wrong` or `reword`. For every
one of those 29 slugs, pull the **sibling language's** row for the same concept slug in the same
certification and put it beside the English and beside the flagged rendering. Send me all 29 as
one file, same shape as the sample — I will read them.

Do not judge them yourself and do not fix anything. Two of these siblings are already known
defective; I want to see the other 27 with my own eyes, because I am the reason the first two
got through.

Report, before the file: how many of the 29 siblings exist at all (some concepts may not be
translated into both languages), and how many sit inside a draw that is currently cleared. That
second number is the size of the exposure.

## 4 — Record the corrected rule, replacing what 356 wrote

**Rule — a defect rooted in the English traps both languages, so a blocking slug's sibling is
checked before any draw containing it is cleared.** Mechanism: for every row a review marks
`wrong` or `reword`, the same slug in the other language is pulled and read in the same pass.
Measured yield on the first four: 2 of 4. A sample cannot find this on its own — independent
per-language draws are structurally blind to it, because the whole point of an independent draw
is that the two languages see different concepts.

**Rule — cross-language contrast is the instrument, so future concept draws are paired, not
independent.** The 2026-09-20 sample drew each language independently, maximising distinct-slug
coverage at 35 concepts per certification instead of 20. Every one of the reviewer's four
findings was confirmed or refuted by looking at the same concept in the other language — that
contrast did the work, and the independent draw supplied it only by accident, on 5 of 20
concepts in AIMS-F and similar elsewhere. Mechanism: the next sampler draws N concept slugs per
certification and emits both languages of each, so every row read carries its own control.
Coverage drops from ~35 slugs to N; evidence per slug doubles. Record the trade-off explicitly
in the sampler so nobody "fixes" it back to independent draws later.

Also correct the CLAUDE.md entry 356 wrote about per-language blocking, which rests on the
inference this prompt withdraws. Do not delete it — strike it through and say what replaced it
and why, so the reasoning error is legible rather than erased.

## 5 — One small live defect, while you are in there

`taskBlock(task)` ends with:

> "Every item must measure THIS task. The concepts below are the material the task draws on —
> they are the substance, but the TASK is the target."

Inside the generator that sentence is followed by `draftUser`'s concept list. In `get_rubric`
the task block is served on its own, so a paying partner receives a sentence pointing at a
concept list that is not there.

Fix the served copy so it does not promise content the payload does not carry. This is a
partner-facing surface at contractVersion 2 — if the wording change alters the served rubric
bytes, `check-prompt-parity.mjs` stage D2 asserts byte-parity of the served rubric, so update
that assertion in the same commit rather than letting it fail afterwards.

You could not verify `get_rubric` on the wire because the service key is not `courseware:rubric`
scoped, and you were right to refuse to report "no stub text found" from a 401 body. Mint a
rubric-scoped test key for verification, use it, and revoke it in the same session — do not
leave it live, and do not print it.

## 6 — What this prompt does not do

It does not touch AIMS-F, the item pipeline, or the 631 items. That finding is real and it is
bigger than this correction; Prompt 3 is being rewritten around it. Nothing about AIMS-F changes
until that lands.
