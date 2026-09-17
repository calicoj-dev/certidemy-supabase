# IP-POSITION

**What Certidemy reproduces from ISO standards, what it does not, and how that
is measured.**

Written 2026-09-13, when this stopped being an internal discipline and became
load-bearing for a product: a courseware MCP that would serve this material to
partner agents on request. A rule nobody can check is a rule that has already
been broken somewhere; this document is the check.

**It is written to be honest about its limits.** Everything below states what the
method can establish and what it cannot. A reader who needs certainty this
document does not offer should stop at section 5.

---

## 1. The rule

It predates this audit and is stated in `AIGRM-I_BOK.md`, in a table
distinguishing sources by their legal nature:

> **IP note:** NIST, EU-Act, and OECD texts are public and freely usable as
> facts. ISO standards are *copyrighted and paywalled* — we teach the concepts
> (AIMS, dual risk/impact assessment, the family structure) from public summaries
> and never reproduce standard clauses verbatim. This is the same
> facts-not-expression discipline that governed the Scrum work, applied a notch
> more carefully for ISO.

`jta/ISMS-IA_BoK_v1.md` states the operational half: *"Define in our own words
and name 27001 / 27002 / 27005 where the authoritative home matters."*

**Facts-not-expression is the doctrine.** What a clause *requires* is a fact
about the world and is not ownable. The *sentence in which ISO expresses it* is
ISO's. Certidemy teaches the first and attributes the second.

**This is not a licence claim.** Certidemy holds no licence to redistribute ISO
text and does not assert one. It relies on the ordinary position that facts are
free and that short attributed quotation for teaching and criticism is
permissible. Where those limits sit is a question for counsel, not for this
document; what this document establishes is **how much text is involved and how
it is presented.**

---

## 2. What was measured

`scripts/audit-quotations.mjs` and `scripts/audit-quotations-unmarked.mjs`, both
read-only. Every English lesson, Body of Knowledge, Job Task Analysis, scheme
document, concept description, task statement and exam item of the four
ISO-derived certifications — **ISMS-F, ISMS-IA, AIMS-F, AIMS-IA** — compared
against the full text of ISO 19011:2026, ISO/IEC 27001:2022 and
ISO/IEC 42001:2023.

The method finds **contiguous runs of identical words**, normalised to lowercase
with punctuation removed and clause numbers retained.

**5,041 runs of five words or more, across 437 documents.**

### The threshold has no elbow, and that is a finding

```
>= 5 words : 5041      >=12 words :  458      >=20 words :   70
>= 8 words : 1390      >=15 words :  208      >=25 words :   26
```

Counts decay smoothly at roughly ×0.75 per added word. **There is no length at
which the population changes character**, so no threshold can be justified by the
curve alone. The reason is substantive rather than statistical: *"documented
information"*, *"interested parties"* and *"risk treatment process"* are ISO's
words **and the only words for those things**. A short run measures the
vocabulary of the field, not copying.

The threshold used below — **20 words** — was chosen by reading runs at each
length and finding where they stop being terminology and start being sentences.

---

## 3. What it found

### Not where it was expected

| location | runs | longest | ≥12 words |
|---|---:|---:|---:|
| lesson prose | 2107 | 69 | 282 |
| exam items | 1795 | 22 | 61 |
| concept descriptions | 422 | 31 | 59 |
| JTA | 431 | 22 | 33 |
| task statements | 239 | 22 | 20 |
| scheme documents | 39 | 22 | 3 |
| **Body of Knowledge** | **8** | **10** | **0** |

The expectation was that reproduction would concentrate in the JTAs — the
structured metadata a machine endpoint would most naturally expose. It does not.
It is in the teaching prose.

**The Bodies of Knowledge are the cleanest documents in the corpus**: eight runs,
a ten-word maximum, nothing at twelve. The documents that state the rule follow
it.

### Of the long runs, all are attributed

At twenty words and above there are **50 runs in lesson prose**. Every one of
them names the clause or the standard within six lines.

**34 are visibly set off as quotation**, in one of three conventions the corpus
uses:

```
> **When it is not possible for internal auditors to be independent...**
- **When it is not possible for internal auditors to be independent...**
- b) **determine all controls that are necessary** to implement...
```

**16 are attributed in prose without being visually set off.** These are the
residue. They are not silent reproduction — each names its clause — but they
present ISO's sentence in the same typography as Certidemy's own.

**Nothing found was unattributed.** Across 5,041 runs, the audit found no passage
that reproduces ISO text while concealing its source.

### The translations mirror the marking

Spanish and Portuguese carry **162 lessons and 118 blockquote markers each**,
identical to English, with bold emphasis within two markers across ~4,870. **A
passage marked as quotation in English is marked in both translations.** The
concern that marking would be applied in the language people read and omitted in
the ones they do not is measurably unfounded.

---

## 4. Three instrument errors, and why they are in this document

The audit was wrong three times before it was right. They are recorded because a
reader deciding how much weight to give a number should know how the number
behaved.

1. **A seed-length bug returned a false all-clear.** The search for long runs
   used a twenty-word key against a twelve-gram index, so nothing could match.
   It reported **zero** unmarked runs. Caught only because zero contradicted an
   earlier count.
2. **Blockquote continuation was not tracked.** Markdown allows a quote to
   continue without repeating the marker; those lines read as prose.
3. **Two of the corpus's three quotation conventions were invisible.** The mask
   recognised `>` and treated bulleted-and-bolded quotations as prose. **This
   alone accounted for eight of what were reported as twenty-four unmarked
   runs** — a third of the apparent problem was the measuring instrument.

**Each error made the corpus look worse than it is, except the first, which made
it look perfect.** That asymmetry is the reason for stating them: an audit that
has only ever been wrong in the reassuring direction should not be trusted.

---

## 5. What this method cannot establish

**Contiguous matching cannot see paraphrase.** A clause reordered into different
words is invisible to it — and that is precisely what a careful writer produces
when trying not to quote. The audit is therefore blind to the technique most
likely to be used by someone deliberately staying inside the rule.

**Semantic matching is not an available substitute, and that is measured rather
than assumed.** Embedding-based matching was tried on this corpus for a different
purpose and failed badly enough to earn a standing prohibition, recorded in
`CLAUDE.md`:

> Automatic skill matching against ESCO **was tried and failed** — embedding
> curriculum concepts returned "audio mastering" for "Scrum Master serves the
> Product Owner". A human picks. **Do not try it again.**

The failure mode is structural here, not incidental: a lesson *about* clause
6.1.3 is semantically close to clause 6.1.3 **by design**, so similarity ranks
correct teaching and close paraphrase identically. Signal and noise are the same
quantity.

**Detecting paraphrase is therefore a human read, irreducibly.** What the
contiguous audit provides is not a verdict but a *bounded starting set* — the
clauses this corpus engages most closely — so a reader checks a list of passages
rather than 162 lessons.

**The audit is English-only.** The ISO sources held are the English editions. A
Spanish or Portuguese lesson reproducing the UNE, NTC or ABNT adoption of the
same standard **would not be detected**. What is known about the translations is
structural (markup mirrors English exactly), not textual.

**Three standards, not the family.** ISO/IEC 27002, 27005, 27000, 22989, 23894
and 42006 are cited across the corpus and are not held, so reproduction from them
is unmeasured.

> **A clean audit is evidence, not proof.** It establishes that no *verbatim*
> reproduction of the three held standards exists in the English corpus without
> attribution. It establishes nothing about paraphrase, about the other
> languages, or about the rest of the family.

---

## 6. The MCP boundary

A courseware MCP changes the character of the activity. A student reading one
lesson that quotes eight attributed words is quotation by any reading. **An
endpoint that returns that lesson on demand, in bulk, to any caller, is
redistribution** — and the fact that a human would have been within their rights
to read it does not settle what a machine may be served.

The operating rule:

> **An MCP returns Certidemy's prose and clause ADDRESSES. It never returns
> clause TEXT.**

*Address* means the identifier — `ISO/IEC 42001:2023 clause 6.1.3 e)`, `Annex A`,
`A.5.19`. An address is a fact and a citation; it is how a reader finds the
authoritative source, which they must hold themselves.

This is machine-checkable. `scripts/lib/citation-index.mjs` already parses the
three standards into the set of addresses that exist, and `items.citations` in
`verify-cert` already verifies every address a bank cites. The same index inverts
into a leak detector for any MCP response.

**What follows from the rule:**

- Lesson prose is returnable. It is Certidemy's expression.
- Quoted clause text inside a lesson is **not** returnable through an MCP, even
  though it is defensible inside the lesson. Same words, different act.
- The Bodies of Knowledge are the safest content in the corpus, measured.
- **AISM-I cites no ISO standard at all** — 226 concepts, 1,098 items, zero
  citations — and is wholly original. It carries no question this document needs
  to answer.

---

## 7. Standing obligations

1. **Run the audit before exposing new ISO-derived content**, and after any
   content generation run touching the four certifications.
2. **The sixteen unmarked runs are known and unremediated.** They are attributed;
   marking them is presentation, not correction. Recorded here so the number is
   not rediscovered as a surprise.
3. **If an MCP is built, the address-not-text rule is enforced in code**, not in
   a prompt. A rule stated in an instruction is advisory; this repository has
   already paid for that distinction more than once.
5. **THE BLUEPRINT SURFACES ARE UNGATED, AND THAT IS AN ACCEPTED RISK WITH A
   DATE ON IT.** Decided 2026-09-17, deliberately, to make a partner meeting.

   `lessons.mcp_servable` (migration 332) gates lesson bodies: default false, a
   CHECK that makes servable-without-evidence impossible, and a trigger that
   clears the flag whenever `content_md` changes. **`concepts` and `tasks` have
   no equivalent.** No column, no trigger, no scan record.

   So `concepts.description` and `tasks.knowledge` -- which `get_syllabus`,
   `explain_task`, `get_concept` and `search_blueprint` all return, to callers
   holding no lesson licence -- are clean because they were *measured clean on a
   particular afternoon*, not because anything prevents them from stopping being
   clean. **A future content edit can reintroduce an ISO quotation into a
   partner-facing surface silently.** Nothing would fail, nothing would log, and
   the next measurement is whenever someone thinks to take one.

   This is the exact shape the rest of this document exists to close: a property
   that holds by circumstance rather than by construction, indistinguishable
   from one that holds by design right up until it does not. It is recorded here
   so it is not rediscovered as a novelty.

   **What closing it looks like**, for whoever picks it up: the same three
   pieces as 332 -- a `mcp_servable` column on `concepts` and on `tasks`, a
   trigger clearing it when `description` / `knowledge` / `statement` changes,
   and the predicate in `mcp.concept` and `mcp.task`. The scanner already knows
   how to measure these fields; `scripts/apply-blueprint-repairs.mjs` measures
   both certifications end to end in its own post-conditions.

   **Until then the honest statement is narrow**: ISMS-F and AIMS-F blueprints
   carried 26 runs of 10+ words between them (1 and 25), all repaired on
   2026-09-17, and were verified clean immediately afterwards. That is a fact
   about that moment and about nothing since.

6. **The Scrum Guide's licence has not been verified.** The BoK states the Scrum
   work ran under the same facts-not-expression discipline, which would make the
   licence inapplicable — there is no derivative work to license. That reasoning
   is sound and unconfirmed.
