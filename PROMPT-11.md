certidemy-supabase

Run to completion. This prompt covers the rest of the programme and does not stop for review
between batches.

## 0 — What changed, and why

I have been gating every batch, and I am now the slow part. The return rate says I can stop:
batch 2 returned 3 of 40, batch 3 returned 0 of 24, batch A returned 0 of 10. That fall is
not luck — it is the claims verifier with positive controls, scoring proposals before
sending, and post-conditions asserting what must not change. Those catch what I was
catching.

**So: write and APPLY B, C and D without waiting for me.** I read the whole set afterward.
Anything I find gets fixed then; nothing here is irreversible and every row is in git.

**Four things stop and come to me. Only these four.**

1. A claims verification failure, or a positive control that does not fire.
2. A row where you judge something examinable is being lost and you are not confident in the
   trade.
3. A row that fires the gate and did not fire before.
4. An instrument that disagrees with itself, or with another instrument, on the same input.

Anything else, decide it and record the decision. If you are between two readings and both
are defensible, take the one that asserts less.

## 1 — The pairing, re-keyed and re-shaped

**Key on `(standard, address)`, not address alone.** My spec was defective: ISO 19011 numbers
its own clauses 4.x and 5.x in the same space as the harmonised management-system clauses, so
"clause 4.1" merges *context of the organization* with *principles*. You were right to stop
rather than write 47 rows on top of that.

**Shape: one analysis per `(standard, address)` group, and N texts from it where N is the
group size.** Not couples — you measured 3:3 and 1:4 clusters, 55 membership slots over 47
unique rows. A row appearing under two addresses is written once from whichever group is
primary for it; the second group records the cross-reference rather than writing it twice.

Assert per group: no two texts byte-identical, no shared opening clause, and the
description-collision guard clean across the whole corpus afterward.

## 2 — Batches B, C and D, back to back

- **B** — all `(standard, address)` groups, 47 rows.
- **C and D** — the 44 unpaired, by longest run descending, unattributed first within a bucket.

Same discipline throughout, self-applied:

- claims reported per row with what verified each, positive and negative; every negative
  claim carries its own positive control
- proposals scored before applying; none may fire, none may introduce a fire elsewhere
- no two rewritten descriptions share an opening clause or a suffix across more than 5 rows
- `keep-on-read` available but expected to be rare — a row whose text is a reproduction
  cannot be kept on the grounds that it teaches well

After each batch, re-run the instruments over the full corpus and record. After D, report the
clause-text reproduction count. **It should be 0.**

## 3 — Retranslation, and the loop has to close

Rewriting AIMS-IA and ISMS-IA English invalidates their translations, and unlike ISMS-F those
draws are **cleared and serving**. This is not optional cleanup — a Spanish-speaking ISO
practice reading a 42001 Internal Auditor certification that falls back to English is the
thing we are trying not to show them.

**3.1** After D, regenerate every withheld AIMS-IA and ISMS-IA concept translation from the
new English. The generator stamps the hashes because it holds the source it translated from;
nothing else writes them.

**3.2** Confirm on the wire, per row rather than from the migration, that the regenerated rows
are no longer `en_hash`-stale.

**3.3** Generate a **paired** sample — seed `2026-09-22-aims-ia-retranslation` — drawing N
concept slugs and emitting both languages of each, carrying `en_name` and both translated
names as well as the descriptions. Size it at 40 slugs across the two certifications. Send it
to me.

**3.4 Do not clear anything on the strength of this prompt having run.** The regenerated rows
land provisional and stay withheld until I have read that sample. The loop closes with my
read, not with your generation.

Report the translated-surface numbers with the sample: per certification and language, how
many rows serve, how many are withheld, and what share of the whole that is. I asked for a
projection and I am not waiting for one, but I want the actual figure when it exists.

## 4 — The three contradiction candidates

Send me `REQUIREMENT-CONTRADICTIONS.json` now, ahead of everything above. Three rows is a
small read and it is the only class in the corpus that no other instrument covers. Do not fix
them.

The length-bias finding goes in the rules with the others: **a similarity threshold expressed
in absolute terms selects by length rather than by meaning.** A seven-word row loses its
distinctive terms to stopwording before any comparison happens, which is why the first sweep
returned 50 candidates and missed its own founding case. Third instrument this week whose
scoring turned out to be arithmetic wearing the costume of judgement, after coverage-as-ratio
and run-4-on-short-descriptions.

## 5 — Explicitly dropped, so nobody is surprised

**ISMS-F's remaining quality tail.** Roughly a hundred rows still in the `rewrite` disposition
that do not fire anything. That is quality work, ISMS-F has zero reproductions, and it is not
Friday work. It resumes after.

Also staying closed: the 916-row full read across the six blocked draws, 42006, and the
monolingual leak gap.

## 6 — Limits to state, not to chase

Record these where the clearance is recorded, so the claim we make is the claim we can
support:

- The index is **English-only**. Spanish and Portuguese editions of these standards exist and
  we do not hold them, so a translated row's coincidence with ISO's own official rendering is
  unmeasurable. The ordering protects us in practice — the new translations are made from
  clean English rather than from reproductions — but the instrument cannot demonstrate it.
- ISO/IEC 27000 is the **2018** edition against a 2022 standard that references it undated.
- ISO/IEC 42006 is not indexed and must not be reported as covered.
- A score of 0 means *no reproduction of the indexed documents*, never *no reproduction*.

## 7 — What this lands

- ISMS-F — closed, 0 reproductions.
- AIMS-F — released.
- AIMS-IA and ISMS-IA English — 0 reproductions.
- AIMS-IA and ISMS-IA Spanish and Portuguese — regenerated from clean English, sampled,
  cleared after my read.

Batch B tonight, C and D behind it, retranslation after, sample to me first thing Wednesday.
Thursday is buffer, not deadline.
