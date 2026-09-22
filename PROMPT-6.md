certidemy-supabase

Supersedes PROMPT-5 §B.3 and §B.4. The census changed the scope, and PROMPT-5 was written
before it. §B.1, §B.2 and §B.6 stand as written; §B.5 is deferred with a reason.

## 0 — What the census changed, stated plainly so it is arguable

PROMPT-5 said: rewrite only the rows the leak gate and the gloss test named. 24 distinct
rows. That was wrong, and the census is what makes it wrong.

**The 11 leak fires are a lower bound.** The index is monolingual, 27000 is the 2018
edition against a 2022 standard that references it undated, and near-wording from editions
not held is unreachable at any threshold. The gate's own gap list says all three.

**The gloss test is a lower bound with different sensitivity.** 17 tier-A. It overlaps the
leak set on 4 of 24. Two instruments sampling one population from different angles and
agreeing on a sixth of what they find is evidence the population is larger than either sees.

**The census gives the population directly.** 174 of 192 carry no teaching move; median 59
characters; 192 of 192 are one sentence or fewer. The fire lists are samples of that.

So the unit of repair is the description set. 192 rows.

If you think this is wrong, say so before writing anything — the census is yours and you
have read it and I have not. What would change my mind: evidence that a meaningful share of
the 174 are teaching-adequate at Foundation tier despite carrying no detectable teaching
move, i.e. that the 174 figure is a detector artifact rather than a property of the text.

## 1 — The 21 initialisms. Apply now.

`Iso`, `Isms`, `Cia`, `Pdca`, `Soa`, `Saas`, `Ai` — 21 rows, one carrying two.

The assertion is yours and it is the right shape: **no concept name contains a
not-fully-uppercase initialism**, asserted **per token, not per name**, because
`Saas ai in scope` fails twice and a per-name assertion reports it once and clears on the
first fix.

**Drop the slug-derived guard entirely.** Do not narrow it. The narrow form fires on zero
rows corpus-wide and the broad form fires on 521 across ten certifications, which makes it a
description of a naming convention rather than a defect detector. A guard that must be
calibrated to fire on exactly one certification is a guard fitted to its training set.

Report the per-token firing count before and after. Before should be 22 tokens across 21
rows. If it is not, the assertion and the census disagree and neither gets applied until
that is resolved.

## 2 — The template is ratified. Write 20 against it.

`security-control` as it now stands is the house style:

```
An answer to a risk the organization chose not to accept; judged by whether the
risk moved, not by whether the control is present.
```

130 characters. It states what the thing is **for**, and what it is contrasted **against** —
presence versus effect. A candidate who reads it knows something the ISO definition does not
tell them, which is the whole test.

Write 20 and send them before continuing. Pick the 20 to be adversarial, not
representative: include all 4 rows that fire both instruments, the 2 coverage-1.00
reproductions, and the shortest rows in the census. If the style cannot carry the hardest
rows there is no point writing the easy ones.

For each of the 20 send: current text, its leak-gate result with matched span and source
clause, its gloss-test result, and the proposed replacement. I will read all 20.

**Sources, in order:** ISMS-F's own 35 lessons; its tasks with knowledge, skills and
abilities; ISMS-IA's descriptions, which are citation-bearing prose on the same standard and
can be drawn down to Foundation tier; the 27001 PDF last.

## 3 — The remaining 172, in batches, with the instruments re-run per batch

Not one pass over 172. Batches of roughly 40, and after each batch re-run both instruments
over the whole 192 and report:

- leak fires, with span, run length, coverage and source clause per fire
- gloss tier-A count
- the length distribution, against the 28 / 59 / 131 baseline

**The numbers to watch are not "fires went down".** Watch for a fire appearing on a row that
did not fire before — that is the AIMS-F failure mode, where a rewrite drifts toward the
standard's wording because the standard's wording is the obvious way to say it. If a rewrite
introduces a fire, stop the batch and show me that row.

Assert, as a post-condition on every batch, that no two rewritten descriptions share a
suffix or an opening clause across more than 5 rows. That is how a template reintroduces
itself as a stub in different clothing, and it is what the AIMS-F retranslation assertion
was guarding against on the other side.

## 4 — Deferred, with the reason recorded

**No retranslation.** Both ISMS-F draws are blocked and withheld, so English is the only
exposed surface and the only one that matters this week. Retranslating into a blocked draw
puts work behind a gate nobody can see through.

**The §B.5 interaction question still wants an answer, as a finding and not a gate.** Can a
row be both blocked-by-review and withheld-by-`en_hash` at once, and what does the endpoint
serve in that state? If the two mechanisms can mask each other — if clearing the block would
silently release rows whose English has moved — that is a real defect and I want it written
down before Friday even though nothing acts on it.

## 5 — B.6, after the 20-row batch

The 11 misattribution candidates. Read-only, and unchanged from PROMPT-5 §B.6. Do it after
the 20 land, not before — it is my reading, and I would rather read it against text that is
not about to change underneath it.

## 6 — Rules to record

**Rule — a claim that a check "fires on X and nowhere else" is a claim about the population
and requires a population measurement.** The slug-derived name guard was recorded as firing
on ISMS-F's 192 and on nothing else in 1,730. Measured: the narrow form fires on 0 rows
corpus-wide, and the form that yields 192 fires on 521 rows across ten certifications. The
figure was read off one certification and asserted of the corpus. Mechanism: a guard's
firing count is recorded per certification with the denominator, never as a single number,
and a guard whose count is distinctive only on one certification is a guard fitted to it.
Fourth instance this week of a conclusion drawn from a partial read: per-language blocking
(base of 3, real rate 2 of 4), the description-collision guard, the `en_hash` grain, this.

**Rule — an unreproducible number is withdrawn, not carried.** "13 of 16 concept-scale gate
fires are ISMS-F" could not be reconstructed; the measured figure is 11 of 15 over 1,729
live concepts, and the difference is partly the `security-control` repair and partly unknown.
A number that cannot be re-derived from the corpus is commentary and will be quoted back as
evidence. Mechanism: a recorded count names the script that produces it, and a count that no
longer reproduces is struck with its replacement beside it rather than footnoted.

**Rule — a hardcoded fact inside an instrument goes stale by default.** The concept gate
printed "ISO/IEC 27000 ... NOT ON DISK" and "ISO/IEC 22989 ... NOT ON DISK" directly beneath
an INDEX line naming both as indexed, and had done since the corpus widened. A reported gap
that has been closed argues against buying something already owned and invites a reader to
discount a real fire as unreachable. Mechanism: coverage facts derive from
`iso-corpus-manifest.json`; an instrument never carries a second copy of what it reports on.

## 7 — Out of scope

- **The 521 broad-form name fires across ten certifications.** ISMS-F at 100% against
  ISMS-IA at 0% is a real corpus-wide question about naming convention and it is worth
  asking later. Do not start it inside this prompt.
- The 916-row full read across the six blocked draws.
- The monolingual leak gap.
- 42006.
