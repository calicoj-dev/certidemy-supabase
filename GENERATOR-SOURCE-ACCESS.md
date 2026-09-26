# What the item generator knows when it writes a secure item

**Measured 2026-09-26. Report only; nothing changed.**

Juan's question: does the generator get the **text of the cited source**, or only the
task statement and rubric? And is there **any verification pass against the source**
before an item is approved?

## The answer

> **Memory is all it had.** The generator never opens a source document. Not the ISO
> PDFs, not the Scrum Guide. Four stages run before an item is written and **none of
> them compares a claim against a source text** — they check shape, option balance
> and internal coherence. The rows are then inserted with `status: "approved"`.

---

## The code path

`scripts/gen-cert-secure.mjs` is the only thing in the repository that writes
`pool: "secure"` (grep-confirmed). Its call chain:

```
gen-cert-secure.mjs
  └─ sourceMisconceptions({ callClaude, concepts, certName })      ← model call
  └─ buildCleanItems({ callClaude, concepts, k, certName,
                       kind:"secure", task, tier, cueCfg,
                       misconceptions })                            item-pipeline.mjs:616
        ├─ Stage 2  draft          callClaude(draftSystem(...), draftUser(...))
        ├─ Stage 3  critiqueAndRevise                               ← model call
        ├─ Stage 3b keepOrRepair                                    ← shape/schema only
        └─ Stage 4  auditItem(item, cueCfg)                         ← the CUE GUARD
  └─ translate to es-419 and pt-BR                                  ← model calls
  └─ INSERT with status: "approved", is_exam_scope: true            gen-cert-secure.mjs:461
```

### What the draft prompt actually contains

`draftSystem(kind, certName, task, tier)` builds it from, in full:

| input | what it is |
|---|---|
| `concepts` | concept **names and descriptions** from the blueprint |
| `task` | the task statement, skills, code, and `bloom_level` from the JTA |
| `certName`, `tier` | strings, used to pick the grounding and the item contract |
| `misconceptions` | distractor material, itself produced by a **model call** |
| `cueCfg` | the cue thresholds (length margin, spread) |
| `groundingFor(certName, tier)` | **hand-written prose** naming the standard and its forbidden claims |

**`groundingFor` is the closest thing to a source, and it is prose about the standard
rather than the standard.** Measured: the five generator files contain **zero**
references to `pdftotext`, `citation-index`, `iso-locator`, `PDFS`, `clauseText` or
`leak-score`.

```
scripts/gen-cert-secure.mjs                       0
functions/_shared/item-rules/item-pipeline.mjs    0
functions/_shared/item-rules/item-grounding.mjs   0
functions/_shared/item-rules/item-task-context.mjs 0
functions/_shared/item-rules/item-profile.mjs     0
```

**The nine ISO PDFs are on disk and the generator never opens one.** So is the 2020
Scrum Guide. Every clause number, every "the standard requires…", every Guide
quotation in 12,462 secure rows was written from recall.

### What the four gates actually check

| stage | what it is | does it check a claim against a source? |
|---|---|---|
| `sourceMisconceptions` | a model call for realistic wrong answers | no |
| draft | a model call | no |
| `critiqueAndRevise` | a **hostile reviewer, same model** | **no — same memory** |
| `keepOrRepair` | JSON shape, option count, ceiling length | no |
| `auditItem` | the cue guard: length spread, key dominance, absolute-word tells | no — structural |

> **The critique stage is the one that looks like verification and is not.** A second
> pass by the same model over the same recall can catch an incoherent item — a stem
> that contradicts itself, an option that is obviously right — and cannot catch a
> false fact, because it has nothing to check against. That is exactly the shape of
> what the two audits found: fluent, well-formed items asserting requirements the
> standards do not contain.

## And this explains the error profile precisely

Every Tier A cluster is a memory failure, not a reasoning failure:

- **2017 Scrum Guide wording** — the 2017 edition is far more represented in training
  data than the 2020 one, so recall regresses to it. `66de9c82` ("traumatic and
  rare"), `c10b3203` (Developers rather than Scrum Teams).
- **19011:2018-style clause numbers** — the renumbering in the 2026 edition is recent
  and thinly represented. 11 of the AIMS-IA and ISMS-IA Tier B findings are clause
  numbers off by a subclause.
- **Invented requirements** — `3f0430cf` (an AI-specific 9.3.2 review input that does
  not exist), `1dddb20e` (a 42001 control about drift that does not exist),
  `e7d7e400` (a documentation duty Amd 1:2024 does not impose). A model asked what a
  standard requires will produce something plausible rather than nothing.

**None of these is detectable without the text.** All three are what a confident
recall looks like.

## The one check that does touch items, and what it does not do

`scripts/verify-citations.mjs` resolves every cited clause and annex reference in a
bank against the PDFs, and it **is** wired into `verify-cert` as `items.citations`
(FAIL on secure, WARN on practice, SKIP where the PDFs are absent).

**It is not in the generation path**, and its own header states the limit:

> *IT CHECKS EXISTENCE, NOT MEANING. "Clause 6.7 exists in ISO 19011:2026" is
> mechanical; "clause 6.7 says what this item claims" is not.*

So an item citing a clause that exists passes, whatever it claims the clause says.
**Every Tier A finding in both audits is a content error, and `items.citations` is
blind to all of them by construction.** The clause numbers in `1dddb20e` and
`3f0430cf` resolve; what the items say about them does not.

## What would close it — not built, for Juan's decision

Three options, cheapest first. **None of these is implemented and none should be
started without a decision**, because each changes what the generator accepts.

**1. Retrieve the clause into the prompt.** `citation-index.mjs` already extracts
clause text from the PDFs, and `iso-locator.mjs` already resolves an address to a
body — the two defences the repository built after the table-of-contents decoy. The
generator could pass the cited clause's *actual text* alongside the task. This is the
smallest change and it attacks the cause: the model would be quoting rather than
recalling.

**2. A content-correspondence gate after drafting.** For every clause an item cites,
extract that clause and ask whether the item's claim is supported. This is the check
`verify-citations` explicitly declines to be. It needs a model call per citation, and
it is the only one of the three that would have caught the invented requirements.

**3. Retire 2017-era recall structurally.** The Scrum certifications cite one 41-page
document. Passing the relevant Guide section verbatim is cheap and would close the
largest single cluster.

> **A caution that belongs with the proposal.** Every one of these makes the generator
> better at the sources it is given, and none of them makes it right about a source
> that is not on disk. ISO/IEC 17021 and 17024 are not held; the EU AI Act, NYC LL144
> and Colorado SB 24-205 — which three Tier A findings turn on — are not held either.
> For those, retrieval cannot help and the SME is the only instrument.
