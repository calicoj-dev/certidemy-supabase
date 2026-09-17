# HANDOFF v12.8 — the grain of a number

2026-09-17. This arc began with "can partners use our content" and ended with
ten certifications served, a gate that tells the truth per language, and 271
distinct ISO passages measured across four certifications with 84 repaired.

**Every plan in this arc was changed by a counting error, and none of them was a
wrong count.** Each number was correct at the grain it was taken; each was then
used at a grain it did not describe. That is the through-line and it is worth
more than the delivery.

---

## 1. The five grain errors, in order

### 484 runs are 271 passages

The leak detector reports RUNS — contiguous stretches shared with a standard.
Repairing is per PASSAGE: if clause 10.2 is quoted in six lessons, that is one
editorial decision made six times, and a shorter cut of the same clause
elsewhere is the same passage again.

Mapping the runs back to their position in the standard and merging overlaps
gave **271 distinct passages from 484 runs**, reuse factor 1.79.

A plan built on 484 would have budgeted 78% more work than exists.

### Longest-per-field read as one-per-field

The blueprint scan reported the LONGEST run in each `tasks.knowledge` field. It
was written up as though that meant one run per field. Repairing the longest
exposed a second underneath it in **eight of seventeen** AIMS-F tasks: 18 became
26.

Same error as the first, in the opposite direction. There the unit was too fine;
here too coarse. **A maximum is not a count, and a count is not a maximum.**

### Passages estimate work; runs are what the gate measures

Batch 2 was sized at "two passages per lesson" and delivered twelve runs across
six lessons, because `05-03` carries three runs that merge into two passages.

Both numbers were right. Neither was the other. The estimate wants passages; the
gate wants runs; a batch file has to carry runs.

### Reuse was the wrong axis, and it was the axis I recommended

The corpus-wide leverage curve showed the top 10 passages covering 16% of runs,
top 50 covering 44% — a strong argument for sequencing by reuse.

Scoped to AIMS-F alone: **84 of its 105 passages are quoted exactly once**,
maximum reuse four, zero shared with any other certification. The leverage was
entirely the IA certifications quoting the same clauses as each other.

**The right axis was passages per lesson**, because the gate is per
`lesson_group_id` and a lesson three-quarters repaired is still withheld — so
finished lessons are the only unit that converts work into servable content.
Then even that was superseded: sequencing **by module** beat sequencing by cost,
because a partner clicking into a module and hitting withheld lessons reads as
broken where a complete module with a visible stop reads as work in progress.
Nine lessons bought three whole modules where module 3 alone would have cost
seven for one.

### And a count read through `tail`

`02-02` was recorded as carrying one run. It carries two; the dump that found
the first was read through `tail -60` and the second scrolled past. **A scan read
through `tail` is a scan read in part.**

---

## 2. The thing to keep: the `behind_by` line

Migration 334 widened the MCP views to ten certifications while
`courseware-read` still knew eight. The cold-start check compares the two.

That check used to be an EQUALITY, and on 2026-09-16 it took the whole
curriculum surface down: migration 328 widened the views to eight, the function
said four, and it refused to serve **all eight** — the four that had worked for
weeks went down with the four being added. There was no ordering that avoided
it, because an equality across a deploy boundary makes a two-copy list
unshippable in either direction. The predicate was the mistake, not the
sequence.

It was rewritten asymmetric: served-superset-of-expected serves the intersection
and logs loudly; served-subset still refuses. **And then it never ran, because
there was no widening between then and now.**

Before deploying the function at ten, the question was whether 334 had actually
committed — because if it had not, the function would be a superset of the views
and that is the direction that refuses everything. The log answered it:

```json
{"fn":"courseware-read","event":"connected",
 "certifications":["AIE-I","AIGRM-I","AIHR-I","AISM-I","SD-AI-I","SM-AI-I","SM-AI-II","SPO-AI-I"],
 "behind_by":["AIMS-F","ISMS-F"]}
```

**That log line was the decision, not the reassurance.** A branch built after an
outage, never exercised in the safe direction, read before acting precisely
because the other direction is an outage. Deploying first and checking after
would have been the same two commands in the order that cannot tell you
anything.

Keep it. The next person widening this will face the same question and the same
log answers it in one read.

---

## 3. What shipped

**Migrations 332-335.** 332 added `lessons.mcp_servable` with a CHECK making
servable-without-evidence impossible and a trigger clearing it on any
`content_md` change — so the flag is a fact about the CURRENT bytes, never a
memory of a past review. 333 put the predicate in `mcp.lesson`. 334 widened to
ten. 335 made the gate per-language.

**The gate lives in the view, not in an `if`.** 315/316's argument: the grant
decides. A lesson whose body may not be redistributed is not in `mcp.lesson` at
all, so no function, refactor or new caller can serve it by forgetting a check.

**Threshold 10 words, calibrated on the acquitted.** IP-POSITION section 2
already established the curve has no elbow and settled on 20 by reading. This
ships stricter, on a control instead: AISM-I cites no ISO standard and its
longest shared run is EIGHT words across 183 lessons. Ten is the first length a
known-independent corpus cannot reach. It rescues nobody — at 10, ISMS-IA still
fails 31 of 38 — which is what distinguishes it from a number chosen until the
accused pass.

**The obligation guard**, and it is the piece most likely to be misunderstood
later. Repairing a leak means replacing quoted clause text with our own words,
and a good paraphrase scores ZERO on the leak index — which is exactly what a
paraphrase that has dropped the obligation also scores. It fired six times
across the arc and was right four:

- clause 10.1's *shall continually improve* softened to *under review*
- clause 6.1.4's consequences that **can** result stated as consequences
  **arising** — an impact assessment looks for what a system might do
- ISO's *should* enable event logging written as *must*
- `requirements` dropped from a document title, which read as a softening

And wrong twice, both lexical: `require` meaning **need** rather than a duty
imposed. Those are recorded as per-repair overrides carrying their reason, not
by narrowing the vocabulary — narrowing `require` would blind the guard
everywhere it IS normative.

**A defect found by disagreement.** The same repair scored strong 1→1 in Spanish
and Portuguese and 1→0 in English, on "added a requirement to decide". One
meaning, three verdicts: the English vocabulary was missing `requirement` while
carrying `obligation`. Found because three languages disagreed, not because
anyone reviewed the list.

---

## 4. The per-language gate, and the argument holding it up

Repairing English was OPENING the translations. The index is English ISO text,
so a translated row scores zero by construction, the group maximum always came
from English, and the moment a repair landed the gate stopped protecting the
language a Spanish-speaking partner actually pulls.

335 records a HUMAN REVIEW on migration 311's pattern: append-only, verdict
keyed to a hash of the English it was made against, so a later English edit makes
the review STALE rather than erasing it. **Repairing a translation does not clear
the flag — only a recorded review does.** Otherwise someone writes Spanish, the
flag clears, nothing was verified.

It flags only the translations of lessons whose English was repaired — 32 rows
at the time, 64 now — rather than every non-English row, and the reason is:

> A translation's exposure is bounded by its English source's exposure. These
> are translations of OUR English lessons, not renderings from ISO's Spanish.
> Where the English never carried a run of ten words, there was never an ISO
> sentence for a translator to render.

**IT IS REASONING, NOT MEASUREMENT.** Longest English run across the eight live
certifications is eight words, so none of their translations is suspect — which
is the only reason this was affordable rather than withholding two thirds of the
corpus. But it is an inference from a pipeline; nothing in the database records
provenance; and it fails SILENTLY the day someone translates from a Spanish ISO
text, because there is no Spanish index to notice with. Recorded in IP-POSITION
section 7 item 6 so a later reader does not mistake a sentence that sounds
measured for one that was.

Section 7 item 5 records the other accepted gap: `concepts` and `tasks` have no
`mcp_servable` equivalent and no trigger, so the blueprint surfaces are clean
because they were measured clean on a particular afternoon.

---

## 5. Three shapes that recurred often enough to name

**Changing what introduces a run never removes the run.** Four instances in one
day: `Persons` → `Anyone`, `including` → `covering`, a list tail reordered while
its head stood, a lead-in recast while the enumeration behind it survived. All
four were caught because the generator re-measures the WHOLE FIELD after every
span lands, so a partial repair is a refusal rather than a success.

**An enumeration reproduced in order is a run even when every word around it is
ours.** Twenty-odd repairs across the arc were pure reorderings — the cheapest
correct repair available, and available far more often than expected, because
clauses 6.1.4, 7, 9 and 10 are mostly lists.

**A list inside a migration does not notice work done beside it.** 335 was
written naming ten lessons and would have shipped naming ten; batch 2 repaired
six more in between. At ten, the six newest repairs would have opened their
Spanish — the exact defect 335 exists to close, reintroduced by the migration
closing it. That is the argument for the trigger over the list, made concrete
within an hour of writing the trigger. The bilingual queue generator was then
changed to read the database flag rather than a slug array for the same reason,
after that array had already gone stale once.

---

## 6. Open

- **AIMS-F module 4** — 5 lessons, ~24 runs.
- **ISMS-IA and AIMS-IA** — 223 passages between them. Not a batch.
- **The bilingual queue** — 98 rows, Spanish first, read from the flag.
- **The Worker wrapper** — `WEB-SESSION-PASTE.md`. It discards the function's
  detail on 401/403, which is why a withheld body returns 404; and it frames
  every other 4xx as "a fault in the server", which a withheld body is not.
- **`SUPPORTED_CERTIFICATIONS`** still at eight in the web repo. The
  cross-repo check reports this as SAFE and passes, because a validator may
  know more than any sender. Read it as a to-do, not a green light.
- **Concepts have no translation table** — English-only over MCP, pre-existing.

**Carried:** `environment` is a label and not a boundary; per-certification
scope for `courseware:lessons`; `mcp.resolve_api_key` does not touch
`last_used_at`; no rate limiting on `courseware-read`; AIE-I still writing
ungrouped items; `analyze-local.mjs` dead since `3110eec`.

---

## 7. The through-line, seventh statement

- **v12.2:** every defect passed a check, because almost every check reads
  configuration rather than exercises behaviour.
- **v12.3:** the checks that *did* exercise behaviour proved the wrong thing,
  because they ran as the system.
- **v12.4:** a check that cannot run is indistinguishable from one that ran clean.
- **v12.5:** so is a code path — and when data holds it shut, it opens without
  an edit.
- **v12.6:** a rule stated where nothing reads it is not a rule.
- **v12.7:** two halves in two repositories, each tested against itself, are
  both green and still disagree.
- **v12.8:** **a number is only true at the grain it was taken.** Every count in
  this arc was correct and four of them were used to plan work at a grain they
  did not describe. The defence is not more care with numbers; it is asking what
  the unit is before acting on one — and, where a number drives a gate, making
  the gate re-measure rather than trust it.
