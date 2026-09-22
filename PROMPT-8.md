certidemy-supabase

Four items. §1 and §2 are instrument work and gate nothing downstream except their own
re-runs. §3 and §4 run in parallel — §3 produces a file for me to read while you write §4.

## 1 — The gate: adopt `gap <= 0`, with two source-side conditions

Your measurement is right and `gap <= 0` is the right threshold. Abutting runs in the
description can only arise from a reproduction the seed window could not span — provided the
runs actually come from the same place in the source.

That proviso is not decoration. We have already paid for its absence: the cross-document
chaining defect, where greedy extension over a union of nine gram sets chained runs across
junctions present in no single standard, and reported a 14-word fragment where the longest
real one was 9. Union scoring reintroduces exactly that opportunity from the other end, and
`pdca-cycle` at gap<=4 is the small version of it already visible in your own data.

**Take the union only when all three hold:**

1. the runs abut in the **description** — gap <= 0
2. they come from the **same source document**
3. they are near-contiguous **in the source** — source-side gap <= 3 words, which is what an
   interpolation like *or disclosed* costs

Report:

- whether `confidentiality` satisfies all three, with the source-side gap stated
- whether the source-side conditions drop any of the +6 that `gap <= 0` adds corpus-wide
- the per-certification breakdown of the final fire set

If the conditions drop none, say so — I will treat them as cheap insurance rather than a
filter, and that is a fine outcome. If they drop several, those several were coincidences
and we avoided manufacturing them.

Record the union rule beside the existing run and coverage parameters, with the three
conditions and the reason for each, so nobody later "simplifies" it back to a raw union.

## 2 — The extractor defect, and what it calls into question

A request for main-body clause 5.2 returning Annex A control A.5.2 is not a bug in one
check. `audit-aimsf-claims.mjs` uses this extractor, and that instrument returned **81
claims: 67 OK, 0 FAIL, 14 UNVERIFIABLE** for AIMS-F — the audit I accepted as clearance for
154 rewritten descriptions that are now released and serving in three languages.

If the extractor can silently return the wrong clause body, some of those 67 may have been
scored against Annex A text.

**2.1** Fix the extractor. The last-occurrence rule that skips the table of contents must
not walk on into Table A.1. Main-body clauses and Annex A controls occupy the same numeric
space and have to be addressed distinctly.

**2.2** Then **re-run the AIMS-F claim audit** and report the new split beside the old one:
OK / FAIL / UNVERIFIABLE, and name every claim whose verdict moved. 0 FAIL out of 81 was
reassuring and I want to know whether it still is. If any claim moves to FAIL, stop and
report — those rows are released and serving.

**2.3** Record the rule, because this is the second time this PDF has defeated a text test.
The first was `4.1Understanding` extracting with no space behind the licence watermark
column, so `clauseText` returned null for every clause and *"27001 clause 4.1 does not
mention roles"* scored OK against an empty string. Now the 5.2 heading is unreachable by any
line test for the same reason.

**Rule — a clause the extractor cannot locate is UNRESOLVABLE and loud, never empty and
silent.** An extraction returning nothing must fail the check that requested it, not satisfy
it. Mechanism: `clauseText` returns a discriminated result, and every caller treats
"not found" as a failure of the check rather than as an empty haystack. Occasion: twice on
ISO/IEC 27001:2022, whose licence watermark column merges into heading text.

## 3 — The 28 newly-visible rows. Send me a file.

28 of the 30 rows the union measure newly exposes are ISMS-IA and AIMS-IA. Both are cleared,
both serve English to unauthenticated callers, and AIMS-IA is 42001 — the other standard
Hexasec practises.

A reproduction is a different severity class from a thin gloss. A gloss is embarrassing; a
reproduction is an IP position we have written a document about. So these go ahead of
ISMS-F's remaining 152 in **my** queue, not in yours.

Produce `CONCEPT-UNION-FIRES.json` with one row per fire, carrying:

- slug, certification, current description text
- every matched run: the run's words, its position in the description, its position in the
  source, the source document and clause address
- description-side gap and source-side gap between consecutive runs
- longest-run coverage and union coverage, side by side
- whether the row fires under the current rule, the union rule, or both

Do not judge them and do not fix anything. Send me all 30, including the 2 outside ISMS-IA
and AIMS-IA. I will read them.

State the limit with the file, as before: the index is monolingual, 27000 is the 2018
edition, and a span that does not match is not thereby original.

## 4 — Batch 2. Write it while §3 runs.

40 rows from the 152. Same discipline as batch 1:

- current text, both instrument results with source clause named, proposed replacement
- score the proposals before sending — no replacement that introduces a fire
- post-condition: no two rewritten descriptions share an opening clause or a suffix across
  more than 5 rows
- re-run both instruments over all 192 afterwards; stop and show me any row that fires and
  did not fire before

**Style, from the batch-1 read:** for an ISO defined term an item can test on the
definition, the description carries both halves — what the thing **is**, in our own words,
then the teaching move. For a term whose name reads in plain English, teaching-move-only is
fine. Two failures to avoid, both of which appeared in batch 1: a pointer with no antecedent
(*"both halves matter"*, *"cuts both ways"*) and an absolute that the row's own example
contradicts.

**Pace:** I spot-read ten per batch. Every row making a clause, Annex or control-ID citation
comes to me in full regardless of that count — both batch-1 verification flags were citation
claims, and one of them was a real misattribution.

## 5 — Recorded, from your last report

**The tier-A gloss list reads concept NAMES, not description text.** I have been treating
"17 tier-A" as a measurement of the descriptions, and I asked for an overlap figure between
it and the leak fires as though both instruments read the same input. They do not. **The 17
is withdrawn as evidence about description quality** — it is a candidate list derived from
the blueprint and it is useful as that and only that. Strike it wherever it was recorded as
a text measure, with the replacement beside it.

The scope ruling cited it as one of three legs. The other two — median 59 characters, 192 of
192 one sentence or fewer — are text measures and carry the ruling on their own. 152 rewrite
/ 18 keep / 0 trim stands.

**Trim being empty is a result, not a gap**, and the classifier refusing to report a split
when a calibration case lands in the wrong bucket is the correct behaviour. Keep it.

## 6 — Out of scope

The 916-row full read. The monolingual leak gap. 42006. ISMS-F retranslation — both draws
are blocked and English is the only exposed surface this week.
