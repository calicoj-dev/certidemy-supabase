# MATCH-TERMS: the decision

**`concepts.match_terms` stays empty. This is a decision, not an open item.**

Recorded 2026-09-13. It is written down because the column's emptiness is
invisible in every output that depends on it, and because the next person to
find it empty will otherwise read it as an unfinished task and fill it.

---

## 1. What the column is, and what it has actually been doing

`functions/_shared/analyzer/concepts.ts:181,292` builds the surface forms a
partner document is matched against:

```ts
const surfaces = [concept.name, ...(concept.matchTerms ?? [])];
```

`match_terms` is the synonym channel: the names a *competitor's* document uses
for a concept our own blueprint names analytically.

**It is empty on all 1,730 concepts across all twelve certifications, and always
has been.** So that expression has always reduced to `[concept.name]`, and the
analyzer has been running name-only matching since it was written. Two things
follow that were not previously visible:

- **The uniqueness invariant has been passing vacuously.** It checks that no
  term is claimed by two concepts in a certification. Over an empty column there
  is nothing to collide.
- **The es-419 conclusion was accidentally true.** "Translating concept names
  alone is sufficient" was reached without knowing the synonym channel was dark.
  It is a correct description of the system as it runs, and it is not evidence
  about the system as it was designed.

---

## 2. The decision, and the argument for it

**Populating `match_terms` from `scripts/propose-match-terms.mjs` was measured
and rejected.** The script is sound and its doctrine is right: it proposes only
terms that appear in our own lesson prose, because inventing terms from model
knowledge is the attribution failure that produced the false
"ISO 19011 requires..." claims. `drift_rules.authority_citation_id NOT NULL` is
the same rule expressed in the schema.

Measured against AISM-I, with the extractor reading the format the corpus
actually uses (see section 4), it proposes candidates for 165 of 226 concepts.
**They are the wrong kind of string.** AISM-I's lesson labels are pedagogical
sentences, not terminology:

```
AI Model Supplier Risk  ->  The AI-Model Supplier Risk        (restates the name)
AI As Service Action    ->  The AI's Output Is Your Service Action
AI Adoption Judgment    ->  The Principles as the AI-Adoption Filter
AI Infused Service      ->  Service and Product               (1 shared token)
```

No partner syllabus prints any of those. The strong candidates restate the
concept name, which `emit-match-terms-sql.mjs` already refuses. The weak ones
are the dangerous class: `Service and Product` shares exactly one token with
`AI Infused Service`, and `service` appears in **34 of AISM-I's 226 concept
names**, `value` in 14, `management` in 11. A single-token overlap on a term of
that frequency credits coverage to any ITIL document in existence.

**Neither guard catches that, and the reason is structural.** The proposer flags
terms of one token (`GENERIC_MAX_TOKENS = 1`); the emitter refuses terms with
fewer than two significant tokens. **Both measure the term's LENGTH. The risk is
the term's DOCUMENT FREQUENCY.** A two-word phrase can be far more generic than
a one-word one, and the inflation it causes is invisible in the output because
it makes the number look better rather than worse.

**The terms that would actually help are the ones the proposer structurally
cannot reach.** A partner document writes `SVS`, `CAB`, `XLA`, `KCS`,
`known error`, `major incident`, `SLO`, `SLI`. The proposer requires a candidate
to share a stemmed token with the concept name, so an acronym or a true synonym
scores zero and is dropped before any other test runs. **This is not a bug in
the proposer.** It is the attribution doctrine doing its job: those strings are
not in our prose, so proposing them means inventing them.

**And our prose does not ground them.** AISM-I's 61 English lesson bodies contain
exactly **one** parenthetical acronym definition: `SLA = service-level
agreement`. There is no grounded in-corpus source for the rest.

So the choice is between a list that is groundable and useless, and a list that
is useful and ungrounded. **Empty is better than either**, because an empty
column produces an honest undercount while a bad one produces a confident
overcount that reads as a good result.

---

## 3. What would make a curated list legitimate

**A curated list is groundable in principle, and the blocker is licence and
effort rather than doctrine.** This is the part that must not be lost, because
"we decided against match_terms" will otherwise be read as "synonyms are
forbidden", which is not what was decided.

`SVS` is not a Certidemy claim about the world. It is a fact about what a named
external source calls a thing, and a fact with a citable authority is exactly
what this repo already knows how to hold: `drift_rules.authority_citation_id` is
NOT NULL for this reason. A match term carrying the source that uses it is the
same shape.

**What that would require:**

1. **A per-term authority, not a per-list one.** `match_terms` is a bare
   `text[]`. Carrying authority means a table -- concept, term, source, and the
   locator within it -- so a reviewer can check any single term rather than
   trusting the batch. The same argument that made `item_translation_reviews` a
   table rather than a column.
2. **A source we are entitled to cite.** The useful vocabulary for AISM-I is
   ITIL's, and **ITIL is a licensed trademark over a copyrighted corpus**.
   Recording that a syllabus calls something `SVS` is a fact and almost
   certainly fine; the boundary is not obvious enough to cross without counsel,
   and it is the same question `IP-POSITION.md` section 1 declines to answer for
   ISO. **The Scrum Guide licence is also still unverified** (`IP-POSITION.md`
   section 7 item 4), so the same gap sits under the three Scrum certifications.
3. **Human curation, accepted as a curation act.** No generator can produce this
   list. `CLAUDE.md` already records that automatic matching was tried and
   failed -- ESCO embeddings returned "audio mastering" for "Scrum Master serves
   the Product Owner" -- and that prohibition stands. A human picks, one term at
   a time, across 1,730 concepts.

**So: not principle. Licence, and roughly 1,730 judgements.** If a partner
relationship or a licence makes the vocabulary citable, this is a real project
with a known shape, not a closed question.

---

## 4. What was fixed instead

Three defects found while measuring this, all fixed 2026-09-13. None of them is
the curation.

- **`propose-match-terms.mjs` reported a parse failure as a clean run.** It read
  markdown H2-H4 headings only. **Every certification on the platform authors
  lessons as directive blocks** -- `::concept title="..."` -- with H2-H4
  surviving in five lessons across three certifications, 14 headings against
  1,565 `::concept` titles. Run against AISM-I it read all 61 lessons, extracted
  zero labels, and printed `no candidates 226` as a normal outcome. The
  extractor now reads both formats, and **a lesson that was successfully read
  and yielded no label at all is now treated as evidence about the parser**: all
  labels missing aborts before writing, a majority missing aborts, a minority
  prints a note. The property is asserted on the LESSONS, not on the candidates,
  because "this concept has no candidate" and "this script cannot read this
  format" are different states that looked identical.
- **`emit-match-terms-sql.mjs` printed `-- ASCII-only. Editor-first.` into every
  migration and never checked it.** Five AISM-I lesson titles carry an em dash.
  A reviewer copying one into `approved_terms` would have carried U+2014 into
  the SQL editor, which corrupts multibyte characters on paste. Now a fatal
  refusal that names the offending code points.
- **`scripts/_pg.mjs` did not look in `scripts/.env`** while its siblings in
  `audit-quotations.mjs` did, so every `_pg`-based script exited 1 with
  "key not found" on a fresh shell while the scripts beside it worked. That
  reads as a credential problem and sends the reader to Project Settings
  instead of to the loader.

**The first of those is the one worth remembering.** The extractor had been
reading about 1% of the available labels platform-wide since it was written, and
the evidence was in the record the whole time: the D3 run enabled bold spans,
found "roughly 97% noise", and disabled them again. Headings alone gave SM-AI-I
four labels in one lesson. **Bold spans were not an enrichment; they were
compensation for an extractor pointed at a format the corpus had already left.**
The noise was measured correctly and the diagnosis was wrong.

---

## 5. What this does not license

**Do not read this as "the 8.9% is an undercount".** That measurement describes
today's matcher accurately. It is not evidence about what a populated matcher
would produce, and on the above, a populated matcher is not cheaply reachable.
Any future coverage number must say which of the two it is measuring.

**Do not fill `match_terms` from a generator.** If someone reaches for this
column again, the question to answer first is not "what terms" but "what
authority", and the answer has to survive section 3.

---

## 6. The multiplier changed on 2026-09-20. The decision did not.

Migration 355 created `public.concept_translations` and gave `mcp.concept` a
language dimension. **`match_terms` is not on the new table, deliberately.**

Nothing in sections 1-5 is reopened by this. The argument against filling the
column is about AUTHORITY -- a term needs a citable source the way
`drift_rules.authority_citation_id` carries one -- and adding two more
languages does not supply authority, it multiplies the requirement.

**What changed is only the size of the job this document declines:**

| | before 355 | after 355 |
|---|---|---|
| rows a populated matcher would need | 1,730 | **5,190** |
| human judgements, at one per row | 1,730 | **5,190** |
| licences to clear | ITIL, Scrum Guide | the same, **per language** |

And a third cost that did not exist before: **a term list in three languages is
three lists of one idea, which section 3 of CLAUDE.md's own guidance says
diverge.** `service` appearing in 34 of AISM-I's concept names is the document
frequency problem section 2 records; `servicio` and `serviço` would each carry
their own version of it, and a coverage number computed across all three could
not say which language inflated it.

**So the instruction at the end of section 5 stands unchanged and now applies
three times over.** If someone reaches for this column, the question is still
"what authority", and the answer now has to survive section 3 in Spanish and
Portuguese as well as English.
