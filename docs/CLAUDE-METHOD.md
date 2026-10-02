# Instrument discipline

**Split out of `CLAUDE.md` 2026-10-01** to bring the auto-loaded file under its 25k budget. These are
rules, not history: they were in `CLAUDE.md` and are still in force. They live here rather than inline
because they are the most general and the least repo-specific of the rule set, and because every one of
them is recorded in full, with its measurement, in `docs/CLAUDE-HISTORY.md`.

**`CLAUDE.md` §16 carries the six that bite most often and points here for the rest. Read this file
before building any check, gate, probe, census or report.**

Reasons: `docs/CLAUDE-HISTORY.md` § Working style, § Scripts, § Reading a bank versus sweeping it.

---

The recurring failure mode of this system is **silent success**.

- A green result carries no information unless something proves the check ran; give every instrument a POSITIVE CONTROL.
- An instrument that has never failed is an untested instrument.
- A check that passes over an empty input is VACUOUS, not pass. Return the count examined.
- The denominator is what the check actually iterates.
- A coverage gap reads as a PASS. Exercise every branch; write the branch list down.
- Three outcomes, never two: yes, no, or COULD NOT ANSWER. Name the third.
- A step that could not START is not a step that failed.
- A measurement without an expectation is a record, not a test; no expectation ⇒ UNASSERTED.
- A count is READ before it is reported; an unread count is reported as UNREAD.
- An enumeration is not a slower count. Where a change is described by what it moves, name the rows.
- Report a new check's firing count in the same commit. Too many = DESIGN ERROR; zero against a known
  instance = broken instrument.
- A guard that fires on the normal case is deleted by the first person it inconveniences.
- A guard that manufactures the failure it reports is worse than no guard.
- Guards match code shapes, never English words; the property is positional or structural.
- Prose a guard checks can quote the thing it forbids.
- A computation with a stated invariant has exactly one implementation.
- Derive, never duplicate, when two lists mean one thing.
- Run the check as the party the property is about; the credential the test holds IS the hypothesis.
- A branch unreachable because a precondition is unmet reads exactly like one that works.
- A delta measurement changes one thing. Run the new instrument on the OLD input first.
- Two instruments disagreeing is a STOP CONDITION: read ONE case in both before tuning anything.
- A threshold is justified against what it can hide, in the same breath it is set. `THRESHOLDS.md`.
- A number whose name does not say what it is measured over is half a fact. Name the population IN THE KEY.
- A finding stated as a difference from a control is re-measured against the FULL POPULATION.
- When a change replaces A with B, COUNT B FIRST.
- Select the field that would CONTRADICT the number.
- A verdict comes from the producer's DECLARED SUMMARY, never a regex over its output.
- A static classifier follows the PROGRAM, not the file; a helper body ends at the next helper.
- No throwaway measurement's number reaches a report.
- A script that prints and persists does the WRITE FIRST, or asserts the two agree.
- An emitted artifact goes stale against its source exactly as a stored hash does.
- A measurement override may not write.
- An error in the CONSERVATIVE direction is not self-correcting; READ over-refusals too.
- A gate whose refusals have never been read is UNVALIDATED regardless of direction.
- A control founded on a coverage gap expires the day the gap is filled.
- A control that depends on a defect remaining in production forbids repairing it; controls run on FIXTURES.
- A control built around the defect that prompted it tests the defect, not the class.
- An instrument's error modes are a function of input size; widening an index is a RE-CALIBRATION.
- An instrument pointed at the wrong corpus reports a catastrophe.
- A hardcoded fact inside an instrument goes stale by default; coverage facts DERIVE from the manifest.
- A check that can PIN a defect must say which direction is the finding, and assert both.
- A hash gate proves only the side it hashes.
- A gate that cannot be re-closed forbids maintenance. *Open: the LESSON review arm uses plain md5 where
  everything else uses `translation_hash`; unifying it invalidates all 41 reviews at once.*
- A hypothesis offered by whoever is directing biases the evidence collected for it.
- A lexical proxy works on the corpus that motivated it; a lexical count is a draft until someone reads its members.
- A lexical detector cannot measure whether prose teaches.
- A per-subject completeness count says nothing about per-field completeness.
- A loader verifies its own work.
- A pre-deploy check that is not in the deploy path is a RULE, not a check.
- A check constraint is a control that cannot go stale.
- Where a control can be proved on SYNTHETIC input, it should be.
- A recorded count names the script that produces it; one that no longer reproduces is STRUCK.
- A figure in a commit implies a method — name the predicate.
- Measurement grain is part of what a gate measures. Fields pair by ID, never position; an unpaired field
  is its own finding; a block that does not parse returns null. Machine fields are a separate verdict.
- Every regenerated word is an unreviewed word; report drift outside the requested span as its own list.
- A model refusal is not a translation — `lib/refusal-pattern.mjs`. Luck is not a check.
- A translation structurally RICHER than its English is evidence about the ENGLISH.
- ASCII-only protects a TRANSPORT. It is not a spelling, and a model will imitate it.


---

## Claims and corrections

Moved out of `CLAUDE.md` §17 in the same split. Still in force.

- Mark claims about the present; leave observations dated to a moment. The test is whether a reader
  could act on the sentence today and be wrong.
- Rewrite a stale HEADING rather than marking it, and mark the body — a reader scanning headings never
  reaches a marker.
- A live instruction gets rewritten, not marked; a marker beside it competes with the instruction.
- Preserve the original wording and append the marker; do not rewrite the text around it, or the record
  stops being a record.
- A correction banner does not protect a reader who lands mid-section. Stale sentences need inline markers.
- A claim about what a system DOES — serves, publishes, sends, displays, refuses — must name the path
  that carries it. No route, no endpoint, no file, no grep ⇒ you have a belief.
- A compound claim inherits the credibility of its most-verified part. Split checked from assumed at the
  moment of writing; afterwards the two are indistinguishable.
- A stale claim and a claim that was never true are different defects with different answers. The second
  has no BEFORE, so nothing about it ever looks stale and it survives every re-read.
- A correction is a claim, and is not exempt from the verification the thing it corrects just failed.
- Where a count and an instruction conflict, the INSTRUCTION governs and the conflict is REPORTED.

---

## Source extraction

Moved out of `CLAUDE.md` §14 in the same split, because these are instrument rules about the extractor
rather than facts about the library. `CLAUDE.md` §14 keeps the artifact names and the three hard
constraints. Reasons: `docs/CLAUDE-HISTORY.md` § The source library, § The declared population.

- The population comes from the DOCUMENT: its contents list, Table A.1's rows, its clause-3 headings.
  A count derived from the extraction cannot see what the extraction missed.
- A cross-reference in prose is not a declaration.
- `NO DECLARED POPULATION` is a third state, for sources printing no contents list. Never derive one
  from the extraction, and never report it as a parse defect.
- Coverage is DECLARED, so a partial cannot read as complete.
- A hole in a numbered sequence is a NAMED gap; `annex_gaps` / `sequence_gaps` travel INSIDE
  `SOURCE-PASSAGES.json`, because the gate that refuses an unanchorable citation needs the list.
- The table of contents is a decoy in every indexed PDF, and so is prose opening with the annex name.
  Take the LAST occurrence; reject dot leaders.
- Track the current annex letter while scanning; prefixing everything after Annex A with `A.` lost
  42001's Annexes C and D.
- A control table is identified by its CAPTION, not its shape.
- A substance floor names what it excludes (the table's column headers), never a size — 27001 A.7.8 is
  seven words and is the whole control.
- A junk passage occupying a real address is worse than a missing one, because coverage then says the
  address is held.
- A separator that leaves nothing after it is not a separator; try each occurrence in order.
- A clause whose whole text sits on the heading line is not empty — join the remainder when it carries
  a sentence (a modal or a full stop), which a TITLE has neither of.
- A defined term may open with an initialism.
- The column boundary is a run of spaces and is visible only before collapsing whitespace.
- The text and the title are won separately across extraction modes; a titleless passage can never be
  matched by the thing that matches best.
- The page number is identified by its NEIGHBOUR, never by being a number; ITIL's anchor is the FORM FEED.
- The child separator is part of the id scheme: `8.1` under `8`, `Art. 5(1)` under `Art. 5`,
  `Annex III 1(a)` under `Annex III`.
- No ISO clause number has a zero component except the Introduction (`0.1`–`0.7`), and the test must run
  AFTER the annex prefix is applied.
- A stale row in `source_passages` occupies a real address; the loader is an upsert, so `--prune`
  requires `--apply`, names every identity it will delete, prints the enumeration in the DRY run, and
  asserts both directions afterwards.
- A closed coverage gap is REWRITTEN, not marked — a stale gap argues against buying something already
  owned. Two editions of one standard are never both indexed.
- A lexical furniture probe can fire on the text of the law itself.
- One splitter across three languages: a difference between the EU editions is either a real finding or
  a defect in the instrument, and it was the instrument every time.

---

## Reads that feed a number

Moved out of `CLAUDE.md` 5 in the same split. Still in force. Reasons: `docs/CLAUDE-HISTORY.md` Scripts.

- An unpaged PostgREST read is a FLOOR: the cap is 1,000 rows at HTTP 200, whatever `limit` says.
- Mechanism: `Prefer: count=exact`, terminate on REACHING THE TOTAL, throw on mismatch. Never on a short page.
- Page size is a throughput choice and its comment must say so.
- Fetching rows in order to count them is the defect one level up. Use `countWhere()`.
- This applies in a script written to be deleted.
- Copy `_pg.mjs` (`getAll` / `countWhere`) rather than writing a fifth.
- `PAGED-NO-ASSERT` is a third state. `_PG_TRUNCATE_AFTER_PAGES=1` makes the assertion fail on demand.
- An empty result is a fact about the probe until something proves the probe could have found it.

---

## Probing a live surface

Moved out of `CLAUDE.md` 6 in the same split. Still in force. Reasons: `docs/CLAUDE-HISTORY.md` Edge functions.

- A validation never tested against the input it wrongly rejects looks correct forever.
- Where one error string covers two causes, separate them by PERSISTENCE. Pace the probe.
- A tool description read through a connector is a claim about that connector's cache.
- Verify a request is well-formed against the declared interface before calling a response a defect.
- A false description is a defect in the product whether or not the code is correct. `DESCRIPTION-SWEEP.md`.
