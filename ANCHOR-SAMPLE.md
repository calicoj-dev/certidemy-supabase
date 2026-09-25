# The anchor sample — did the audit-sentence rewrite land?

PROMPT-55 §5. Read-only; nothing was written. Instruments:
`scripts/check-anchor-sample.mjs` against the live English, and
`scripts/verify-audit-note-attribution.mjs` against the ISO PDFs.

`apply-audit-sentence-rewrite.mjs` set out to fix **two defects in one sentence**:
a 17-word reproduction of ISO/IEC 27000:2018, and — in two of the three lessons —
an attribution of that sentence to ISO 19011:2026, which the script's header
states "contains neither half of it".

---

## Verdict

| lesson | targets | verdict |
|---|---|---|
| `aims-ia-01-01-who-commissioned-it` | 2, both in checkpoint explanations | **LANDED — both** |
| `isms-ia-01-01-audit-parties` | 2 (prose + checkpoint explanation) | **DIFFER — the wording landed, the attribution did not** |

Three states were available per target and the middle one is the finding: the
`to` is present (**LANDED**), the `from` is still present (**NEVER LANDED**), or
neither is (**DIFFER**). Collapsing DIFFER into "not found" would have read as a
lost edit and sent someone to re-apply it.

## `aims-ia-01-01-who-commissioned-it` — both targets landed

```
`to` occurrences     2      (expect 2)
`from` occurrences   0
19011 mentions       5      27000: 0      42001: 10
```

Both were inside **checkpoint explanations**, so the misattribution had been
taught as the answer twice in one lesson. Both now read *"ISO/IEC 42001 carries
the same allowance in its note on audit…"*.

**That citation is sound**, checked rather than assumed: ISO/IEC 42001:2023
carries the distinctive phrase *"or by an external party on its behalf"*. The
`expect: 2` guard in the apply script is what made this verifiable — a
replace-all with no count would have hidden that there were two.

## `isms-ia-01-01-audit-parties` — and the rewrite's premise was wrong

```
`to` occurrences     0
`from` occurrences   0
shared tail          2      <- present twice
19011 mentions      10      27000: 0      42001: 0
```

Neither anchor is present, but **the last 99 characters of the declared `to` are
there, twice.** The live English reads:

> ISO 19011:2026 **clause 3.1** defines audit, and a note there allows an
> internal audit to be run in-house or handed to an outside party engaged to
> carry it out.

The declared replacement was byte-identical from *"defines audit"* onward, with
**ISO/IEC 27000:2018** in place of **ISO 19011:2026 clause 3.1**. So the wording
change landed — the 17-word reproduction is gone, which was the leak — and the
attribution change did not. The citation even became *more* specific, gaining a
clause number.

### Verified against the PDF: ISO 19011 is the CORRECT citation

**ISO 19011:2026 clause 3.1, Note 1 to entry**, read out of the standard:

> *"internal audits, sometimes called first-party audits, are conducted by, or on
> behalf of, the organization itself."*

*"by, or on behalf of"* **is** the allowance the lesson describes. The live
sentence is accurate, and naming clause 3.1 makes it checkable.

For comparison, **ISO/IEC 27000:2018** Note 2 to entry carries the same substance
in the wording that was being reproduced:

> *"an internal audit is conducted by …"*

| probe | 19011:2026 | 27000:2018 | 42001:2023 | 27001:2022 |
|---|---|---|---|---|
| the full 17-word sentence | – | – | – | – |
| `or by an external party on its behalf` | – | **FOUND** | **FOUND** | – |
| `conducted by the organization itself` | – | **FOUND** | – | – |

**A positive control was found in all four documents before any absence was
reported.** Its first run refused to report at all: the 42001 control phrase
*"artificial intelligence management system"* is not contiguous in the
extraction, because the title reads *"artificial intelligence — management
system"* with an em dash. A control phrase is itself a claim about the document
and has to be checked like one.

### So the attribution "fix" was the mistake, and not landing it was correct

`apply-audit-sentence-rewrite.mjs` tested **contiguity** — does 19011 contain
these exact words — and concluded **misattribution**. It does not, and the
citation is sound anyway, because 19011 says the same thing in its own words.

> **This is CLAUDE.md's own rule arriving again: an expression-matching
> instrument finds REPRODUCTION, never ATTRIBUTION.** "Cited the wrong standard"
> and "cited the right standard, reproduced another standard's wording" produce
> an identical signal from a contiguity scan. That rule is already recorded with
> 23 instances; this is the 24th, and the first where the *correction* was the
> error rather than the finding.

**No repair is needed on `isms-ia-01-01-audit-parties`.** The reproduction is
gone, the citation is right, and the surviving text is better than what the
script proposed. What remains is a record defect, not a content one: the apply
script still asserts in its header that 19011 "contains neither half of it",
which is false and would mislead the next reader.

**Not corrected in this pass**, because the script is a record of what ran and
editing its reasoning after the fact is the thing CLAUDE.md warns about. It wants
an inline marker, and that is a one-line change for your approval rather than
something to slip into a queue commit.

## What this says about the other three lessons in that family

| lesson | citation now | sound? |
|---|---|---|
| `05-02-aims-internal-audit` (×2) | **no standard named.** Prose: *"The standard provides one route directly. A note to **its** definition of audit…"*. Checkpoint explanation: *"A note to **the** definition of audit…"* | **substance yes, citation implicit** |
| `aims-ia-01-01-who-commissioned-it` (×2) | ISO/IEC 42001, named | **yes** — 42001 carries the phrase |
| `isms-ia-01-01-audit-parties` (×2) | ISO 19011:2026 clause 3.1, named | **yes** — Note 1 to entry |

Four of the six occurrences name a standard the PDFs support. **The `05-02` pair
names none** — the referent is "the standard", which in an ISO/IEC 42001
Foundation lesson is 42001 by context, and 42001 does carry the allowance. So the
claim is true, and the apply script's note that its attribution was "correct
already" is correct.

That is a weaker state than the other four and worth saying rather than rounding
up: it relies on the reader carrying the antecedent, and the checkpoint
explanation drops even the possessive. **Not a defect** — a lesson body may lean
on its own context in a way a served-alone concept description may not. Recorded
because "all six are attributed" would have been the flattering summary and it is
not what I measured.

None of the six reproduces the ISO wording.
