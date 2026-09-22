certidemy-supabase

Batch 3 approved whole. Four returned rows approved. Then ISMS-F closes and AIMS-IA starts.

## 1 — Apply what is already approved

**1.1 The six from `ISMS-F-REWRITE-BATCH-1-REVISED.json`.** `iso-27005-risk`,
`risk-criteria`, `availability`, `cryptographic-controls`, `proportionality`,
`lessons-learned`. I approved all six and wrote "apply all six"; it fell between turns and
batch 2's apply list does not contain them. Four of them are the four remaining ISMS-F
fires.

Apply them and report the ISMS-F fire count. It should be **0**.

**1.2 The four returned rows** — `top-management`, `pdca-cycle`, `planned-change`,
`access-control`. All approved as written. `access-control` naming least privilege
explicitly is better than avoiding the overlap.

**1.3 Batch 3 whole** — 13 keeps and 11 rewrites, all approved, zero returns. The keeps are
justified individually rather than collectively, which is what I asked for.

One note, not a return: `semantic-vs-syntactic-detection :: detecting meaning rather than
pattern` is the weakest of the 13. The X-vs-Y argument holds, but a candidate does not learn
why it matters here — that prompt injection is semantic by construction. Leave it and record
it for a later pass.

Then re-run the instruments over all 192 and report. **After this, ISMS-F is closed as an
exposure matter** and its remaining tail is quality work that waits.

## 2 — One rule to record, from the exemption

Your first title-class definition excused `availability` — a genuine nine-word reproduction
of ISO/IEC 22989 — because a terms-and-definitions entry extracts as a short line with no
terminal punctuation, which is exactly what a Table A.1 title looks like.

**Rule — an exemption is defined by what the thing IS, not by what it looks like in the
extraction.** A shape-based exemption will let a different thing past, because two unrelated
constructs can share a shape once a PDF has been flattened to text. Mechanism: an exemption
states the property it exempts (this span is a heading or contents entry, and the description
carries no sentence from the clause body) and its firing count is read row by row before it
is adopted. Occasion: the title-class exemption, which excused a reproduction on its first
run; third exemption in this corpus to need narrowing after adoption.

Also record, against my name rather than yours: I predicted the 8 annex rows would need the
exemption widened. They reproduce annex **body prose**, not titles —
*"Audit sampling takes place when it is not practical or cost-effective to examine all
available information"* is a sentence. I reasoned from the label and not from the spans.
*Inside Annex A* and *is a title* are different properties.

## 3 — AIMS-IA and ISMS-IA: the sequence

105 rows. **Primary sort: longest run descending. Within a bucket: the 22 unattributed rows
first**, because those carry the plagiarism question on top of the reproduction one.

| batch | bucket | rows |
|---|---|---|
| **A** | 20+ | **10** |
| B | 16–19 | 22 |
| C | 13–15 | 29 |
| D | 10–12 | 39 |

**Batch A first, and alone. Do not start B until I have read A.**

Ten rows carrying the worst reproductions in the system, topped by the 37-word
`aia-clause-6-1-4-impact-assessment`. It is small enough that I read every one, and it
answers the question the other 95 depend on: **can a requirement statement keep its normative
force without the standard's sentence?** If it cannot, the policy needs revisiting before 95
more rows are written against it, and I would rather find that out at 10.

### How to write a requirement statement

This is the hard class — 46 of the 105 — and it is different from a definition.

A requirement statement has to preserve three things: **who** is obliged, **what** they must
do, and **the modal force** — *shall* is a requirement, *should* is a recommendation, and a
candidate who learns one as the other fails an item. What it must not preserve is the
standard's sentence.

So: name the clause, state the obligation in our own words, keep the modal distinction
explicit where it is examinable, and add the teaching move that makes it more than a
paraphrase — when it applies, what it is contrasted against, or what the common failure is.

A worked shape, not a template to copy:

```
was : "Clause 6.1.4 requires the organization to <thirty-seven words of 42001>"
aim : "<What the organization is obliged to do, in our words>. <Why an auditor
       looks for it, or what a candidate gets wrong>. Clause 6.1.4."
```

**The clause number is the citation. The sentence is not.**

### What to send me

For each of the ten: current text, the matched run with its length, source and clause, the
content class (definition / requirement / guidance), whether it names a clause, and the
proposed replacement. Score the proposals before sending — none may fire, and none may
introduce a fire elsewhere.

Where a replacement loses something you think is examinable, **say so rather than losing it
quietly.** That is the finding I most want out of batch A.

## 4 — The pace rule, sharpened to the risk rather than the count

From batch B onward:

- **Read in full:** every **requirement statement** — normative force is what can be lost —
  and every row making a citation claim.
- **Spot-read ten:** the 14 definitions, which restate freely and which we have already done
  well, and the 45 guidance-and-commentary rows, where nothing normative hangs on the
  wording.

`keep-on-read` applies here too, but I expect it to be rare: a row whose text is a
reproduction cannot be kept on the grounds that it teaches well.

## 5 — Standing

The not-withholding decision stands with its 2026-09-25 expiry. If the 20+ and 16–19 buckets
are not clear by Thursday, those rows get withheld rather than shipped, and that is a timing
judgement rather than a finding about the rows.

## 6 — Out of scope

ISMS-F batches 4 and beyond. The 916-row full read. The monolingual leak gap. 42006. ISMS-F
and AIMS-IA retranslation.
