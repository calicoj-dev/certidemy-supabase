certidemy-supabase

Two jobs, in this order. Section 1 is small and closes the `verify-invariants.mjs`
findings you reported and correctly did not fix. Sections 2 onward are ISMS-F, which is
the Friday-relevant work: Hexasec's practice is 27001 and 42001, and ISMS-F is the
27001 Foundation surface they will read.

---

# PART A — `verify-invariants.mjs`, the three findings

You reported these and held them for a ruling. Here are the rulings. Do all three in one
commit.

## A.1 — `PAGE = 1000` at the PostgREST cap

**Ruling: the page size is not the fix. The count assertion is the fix.**

Lowering `PAGE` to 500 would move the coincidence, not remove it. The loop would then be
correct because 500 is under 1000, which is the same kind of fact nobody asserts — and if
`db-max-rows` were lowered to 500 the identical silent truncation returns. Any fix that
still reasons *"PAGE is small enough"* is a fix that depends on a number in a config file
Postgres does not know about.

What makes the loop safe regardless of either number is asserting the total:

- `getAll` sends `Prefer: count=exact` on its **first** request and parses the total out of
  `content-range`.
- It keeps paging until it has that many rows.
- On exit it asserts `rows.length === total`, and **throws** on mismatch, naming the path,
  the expected count and the received count.
- The termination test stops being `page.length < PAGE`. Termination becomes
  `rows.length >= total`, with `page.length === 0` as a stall guard that throws rather than
  returning short.

That removes both findings at once: A.2 is not a separate fix, it is this fix. With the
assertion in place, `PAGE` may sit at 1000 or anywhere else and a lowered cap produces a
loud failure on the first table instead of silent truncation on all seven.

Set `PAGE = 1000` explicitly with a comment stating that its value is now a throughput
choice and not a correctness one, and that the correctness rests on the count assertion
below it. Someone will otherwise "optimise" it back and believe they had to think about
the cap.

Report, after the change: the seven `count(*)` totals and the seven `rows.length` values,
from the run. They matched at 13 / 1730 / 509 / 59 / 1793 / 2984 / 12 before; they must
match after, and the assertion must be the thing that says so rather than you.

Then **prove the assertion fires.** Point `getAll` at one table with `PAGE` temporarily set
to a value that forces at least two pages and a deliberately wrong total — or simpler,
truncate the loop after one page behind a test flag — and show the throw. A count assertion
nobody has seen fail is the same object as a gate nobody has seen fire.

After this lands, **PAGED-NO-ASSERT should be an empty class.** Re-run the read audit and
report the class counts. If any of the 11 do not move into SAFE-PAGED, name them and say
why — they may be reads that legitimately cannot count, in which case that is a third class
and not a leftover.

## A.2 — folded into A.1

## A.3 — the suite exits 1 on a correct state

**Ruling: delete `migration tip vs disk`.**

Its subject was removed deliberately, and replaced by a probe that reads the database
instead of a number a human maintains in Markdown. The invariant now asserts that a line
which was correctly deleted is still present. An invariant that outlived its subject is
worse than no invariant, because it trains people to read a red suite as normal.

Delete it, and in the commit message say what replaced it — `check-migration-state.mjs`
against the live tip — so the deletion reads as a succession rather than a removal of
coverage.

**`match term uniqueness` — do not delete. Make it non-vacuous.**

`match_terms` being empty platform-wide is a true fact and a check over it is not wrong;
what is wrong is that emptiness prints `PASS`. That is the recurring shape of this whole
programme in miniature: an instrument reporting success while not looking at anything.

Change the runner, not just this check:

- every invariant returns its **denominator** — the number of rows, files or objects it
  actually examined
- the runner prints it beside the result: `PASS (509 examined)`
- a result whose denominator is zero prints **`VACUOUS (0 examined)`** and is a distinct
  status from `PASS`
- `VACUOUS` does not fail the suite, but it is counted and summarised at the end:
  `6 pass, 1 vacuous, 0 fail`

Then report how many of the remaining invariants come back `VACUOUS` today. I expect
`match term uniqueness` and I would like to know whether it is alone. If three more are
vacuous, the suite has been reporting six passes over three real checks and I want that
number before Friday, not after.

## A.4 — one rule to record

**Rule — a check that passes over an empty input reports VACUOUS, not PASS.** A pass is a
claim that something was examined and held. When the denominator is zero the check examined
nothing and the claim is empty, but it renders identically to a real pass and inflates the
apparent coverage of every suite it sits in. Mechanism: every check returns the count of
things it examined; the runner renders a zero denominator as a distinct status and
summarises the three counts separately. Occasion: `match term uniqueness` passed over 0
authored terms in a suite whose other six invariants cover 5,000+ rows.

**Rule — a paging loop asserts its total, and does not reason about the server's row cap.**
`getAll` terminated on `page.length < PAGE` with `PAGE` set exactly at the PostgREST cap. It
was correct only because the two numbers coincided, and nothing in the program stated the
dependency; lowering `db-max-rows` would have silently truncated all seven reads at once.
Mechanism: `Prefer: count=exact` on the first request, terminate on reaching the total,
throw on mismatch. Page size becomes a throughput choice. Occasion: found by reading the
loop after an audit misclassified it, in the same week `check-migration-state.mjs` reported
271 cleared against a true 2,544 from the same cap.

---

# PART B — ISMS-F

## B.0 — what this is, and what it is not

ISMS-F is **not** AIMS-F. AIMS-F had 154 placeholder descriptions and the job was to write
definitions that did not exist. ISMS-F's 192 descriptions exist, are real prose, and have
been serving since they were written. The problem is the opposite shape: some of them are
too good, because they are ISO's.

The evidence that points here, all of it already measured by you:

- 13 of 16 concept-scale leak gate fires are ISMS-F
- both coverage-1.00 reproductions are ISMS-F
- 14 of 23 tier-A candidates are ISMS-F
- `security-control :: a measure that modifies risk` is ISO/IEC 27000's definition of
  *control*, near-verbatim, and was live and unauthenticated when I made it the house-style
  template for 154 more rows
- the narrow slug-derived-name guard — byte-equal to slug-with-spaces **and no
  capitalisation** — fires on ISMS-F's 192 names and on nothing else in 1,730

So ISMS-F carries two defects at once: **names that are raw slug text**, and **descriptions
that include verbatim standard text on the most exposed surface in the system**. Both are
what a 27001 practice reads first.

**Sections B.1 and B.2 are read-only and gate everything after.** Do not rewrite a
description until both have reported. I have been wrong four times this week by ruling from
a partial read, and three of those four were about ISMS-F.

## B.1 — Census the 192 descriptions. Read only.

I am not going to tell you what the 192 contain, because I have not read them and the last
time I described a corpus from a sample it cost a migration.

Report, for all 192 ISMS-F concept descriptions:

- length distribution — how many are one-liners in the `security-control` shape, how many
  are multi-sentence, the character-count histogram
- how many are byte-identical to another description in the corpus, in any certification
- how many contain a clause number, an Annex reference or a control ID, and whether each is
  a citation (*"required by 5.1"*) or a bare number
- how many read as **definitions** — the shape `X :: <noun phrase>` with no verb of
  teaching — versus explanations. The definitional ones are the leak-exposed class, because
  a definition of a defined term has one obvious correct wording and it is the standard's
- how many are byte-identical or near-identical to the corresponding AIMS-F or ISMS-IA
  description, which would mean one was copied from the other

Then run the **concept-scale leak gate** — seed 4, refuse at run ≥ 4 words and coverage
≥ 0.60 — across all 192 and report every fire with: the slug, the matched span, the run
length, the coverage, and **which standard and which clause** the span came from. I want the
source named per fire, not a count.

State the limit with the finding, as you did on AIMS-F: the corpus holds English editions
only, 27000 is the 2018 edition, and a span that does not match the corpus is not thereby
original — it may be from an edition or a standard we do not hold.

## B.2 — The anti-gloss rule, applied as an instrument

The amended anti-gloss rule exists because of `security-control`. Before rewriting anything,
turn it into a check and measure it:

A description is a **gloss** when it is the definition of an ISO defined term and nothing
else — it states what the term means and does not state what a candidate must do with it,
when it applies, or what it is contrasted against. A gloss is both the highest leak risk and
the lowest teaching value, which is why the two problems are one problem.

Report:

- the gloss firing count across all 1,730 concepts, per certification
- of ISMS-F's fires, how many also fire the leak gate — the overlap is the number I care
  about most
- its false-positive rate against a control set of descriptions you know are original
- what it costs to run

If the gloss test cannot be made to fire reliably without judgement, say so and report the
leak-gate fires alone rather than inventing a score. I would rather have 16 named fires than
192 numbers nobody trusts.

## B.3 — The 7 initialism names, deferred by migration 358

`ai` → `AI`, `annex a` → `Annex A`, and the five others you listed in 358's header. Apply
them now. They are the cheapest correct thing in this prompt and they are on the surface a
partner reads first.

Then apply the narrow guard as a standing assertion — **no concept name is byte-equal to its
slug with hyphens replaced by spaces, with no character capitalised** — and report its
firing count before and after. It should be 192 before and 0 after, and if it is not 192
before, the guard and the census disagree and I want to know which is wrong before anything
is written.

Do **not** apply the broad form. Slug-derived names are the convention across the corpus and
the broad guard fires on roughly 653 of 1,730. The guard is narrow on purpose; record that
in the assertion's own comment so nobody widens it later believing it was an oversight.

## B.4 — Rewrite only what B.1 and B.2 named

Not all 192. Only the rows the leak gate fired on and the rows the gloss test fired on.
Everything else stays as written — it is real prose that has been serving and there is no
finding against it.

For each row to be rewritten, show me **the current text, the matched span with its source
clause, and your proposed replacement**, in one file, before applying any of it. The test for
the replacement is not that it evades the gate. It is that a candidate who reads it knows
something the definition alone does not tell them: what the thing is for, when it applies,
or what it is contrasted against.

`security-control` is the worked example and I want to see your version of it first, alone,
before the rest. If we cannot write that one well the house style is still wrong and 154
AIMS-F rows were written against it.

**Sources, in order:** ISMS-F's own 35 lessons; its tasks with their knowledge, skills and
abilities; ISMS-IA's concept descriptions, which are correct citation-bearing prose on the
same standard; and the 27001 PDF last, for the same reason as before.

## B.5 — Retranslate what B.4 changed, then sample paired

The `en_hash` gate from 359 should withhold every rewritten row automatically. **Confirm
that it did, per row, on the wire** — do not assume it from the migration. Then regenerate
those rows only.

New seed `2026-<date>-isms-f`. **Paired draws.** Same file shape as
`CONCEPT-SAMPLE-PAIRED.json`, carrying `en_name` and both translated names as well as the
descriptions. Send it to me.

Note the interaction and handle it explicitly: ISMS-F / es-419 and ISMS-F / pt-BR are both
currently **blocked** and sitting inside the 916-row full read. A rewritten English row
re-provisions its translations on top of a block that is already in force. Report how the
two interact — whether a row can be both blocked-by-review and withheld-by-`en_hash`, and
what the endpoint serves in that state. If the two mechanisms can mask each other, that is a
finding and I want it before Friday.

## B.6 — The 11 misattribution candidates

`MISATTRIBUTION-READ.json` carries 11 real misattributions after four extractor fixes and
the substance column. Read them **as candidates, not findings** — the number has fallen
147 → 13 → 11 and every fall was an extractor defect, not a repair.

For each of the 11, put beside it: the exact clause text from the corpus, the exact
description text, and which of the three the mismatch is — wording, substance, or
negative-undecidable. Do not fix any of them. Send me the file.

## B.7 — Out of scope

- The 916-row full read across the six blocked draws. Those rows are withheld and nothing
  there is exposed; it is my reading, not your writing.
- The four awkward AIMS-F names. They are cosmetic and AIMS-F is released.
- The monolingual leak gap — 3,460 translated concept rows and every translated lesson sit
  outside any leak instrument. It is the last structural gap and it is real, but it is not
  Friday's problem and I do not want it started inside this prompt.
- 42006. Three AIMS-F descriptions rest on a preview of a Singapore adoption and 42001 never
  mentions 42006. That is a purchase decision and it is mine.
