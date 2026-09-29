# pdftotext options, against the build that is actually installed

**Read-only static analysis.** Ruled PROMPT-89 s2.

Installed: `pdftotext version 4.00 | Copyright 1996-2017 Glyph & Cog, LLC`

CLAUDE.md documents the dependency as **poppler**. This is **Glyph & Cog Xpdf**, a different program
with a different option set. Nothing has broken because `-layout` exists in both -- that is luck, not
compatibility.

The supported list is read from `pdftotext --help` on this machine, never typed.

| script | options passed | unsupported | spread args |
|---|---|---|---|
| `apply-blueprint-repairs.mjs` | -layout | none | - |
| `audit-aimsf-claims.mjs` | -layout | none | - |
| `audit-quotations-unmarked.mjs` | -layout | none | - |
| `audit-quotations.mjs` | -layout | none | - |
| `build-iso-manifest.mjs` | -layout | none | yes -- not statically visible |
| `census-isms-f-concepts.mjs` | -layout | none | - |
| `check-cited-clauses-resolve.mjs` | -enc -q | none | - |
| `check-definitional-citations.mjs` | -layout | none | - |
| `check-library-completeness.mjs` | -enc -layout -q | none | yes -- not statically visible |
| `check-open-items.mjs` | - | none | - |
| `check-pdftotext-options.mjs` | -v | none | yes -- not statically visible |
| `diagnose-run-splitting.mjs` | -layout | none | - |
| `extract-source-passages.mjs` | -enc -layout -q | none | yes -- not statically visible |
| `gate-concept-descriptions.mjs` | -layout | none | - |
| `gen-iso-repair-spec.mjs` | -layout | none | - |
| `gen-lesson-repair-spec-aimsf.mjs` | -layout | none | - |
| `gen-misattribution-read.mjs` | -layout | none | - |
| `gen-union-fires.mjs` | -layout | none | - |
| `iso-passage-census.mjs` | -layout | none | - |
| `lib/citation-index.mjs` | -layout -v | none | - |
| `lib/iso-locator.mjs` | -layout | none | - |
| `lib/leak-score.mjs` | -layout | none | - |
| `list-defined-term-glosses.mjs` | -layout | none | - |
| `measure-blockquote-exemption.mjs` | -layout | none | - |
| `measure-blockquote-omission.mjs` | -layout | none | - |
| `measure-concept-leak-sensitivity.mjs` | -layout | none | - |
| `measure-index-widening.mjs` | -layout | none | - |
| `measure-ksa-review-cost.mjs` | -layout | none | - |
| `probe-0501-clause.mjs` | -enc -q | none | - |
| `probe-0501-source.mjs` | -enc -q | none | - |
| `scan-concept-iso.mjs` | -layout | none | - |
| `scan-iso-leaks.mjs` | -layout | none | - |
| `triage-missing-addresses.mjs` | -layout | none | - |
| `verify-audit-note-attribution.mjs` | -enc -q | none | - |
| `verify-cert.mjs` | - | none | - |
| `verify-citations.mjs` | - | none | - |
| `verify-claim-content.mjs` | -layout | none | - |
| `verify-recovered-27001-controls.mjs` | -enc -layout -q | none | - |

**38 script(s) shell out to pdftotext; 0 pass an option this build does not advertise.**

## What this cannot see

Options built at runtime, or passed through a spread such as `...args`, are invisible to a static
reader. Scripts with a spread are marked; for those, the absence of a finding is not evidence.

