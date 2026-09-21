certidemy-supabase

# PROMPT 3 — AIMS-F content repair

The big one. Run it after Prompt 1 has given the real `stub_count`.

## 3.1 — What is and is not broken

AIMS-F's 154 concepts are **good concepts**. The names are specific and considered —
`competence-does-not-carry` names the real trap for a 27001 shop moving into 42001. The task
code mappings are correct. The domain structure is correct.

**Do not change names, slugs, task mappings or domain structure.** The inventory is done. What
is missing is 154 descriptions. Every one currently reads as its own name plus
` as required or described by ISO/IEC 42001:2023 and taught in the AIMS-F blueprint.`

## 3.2 — House style

Not AIMS-IA's paragraphs. **ISMS-F's one-liners**, which are the proven Foundation-level style:

```
security control          :: a measure that modifies risk
management system maturity:: the progression from documented to genuinely operating
exclusion justification   :: the stated reason a control is not necessary
risk acceptance criteria  :: the thresholds at which a risk may be retained
```

One line. States what the thing *is*, not that the standard mentions it. A candidate who reads
it learns something they did not know from the name alone — that is the bar, and
`competence-does-not-carry` is the test case: if the description does not say *what* does not
carry and *why*, it has failed.

While you are there: `risk acceptance criteria` above is the ISMS-F English whose Spanish
rendering is one of the four blocking defects (Prompt 4). The English is loose — "the thresholds
at which a risk may be retained" does not say which side of the threshold. Tighten it, and the
Spanish defect becomes easier to fix correctly.

## 3.3 — Sources

- `iso42001.pdf` in the project
- the existing AIMS-F lesson bodies — the teaching material exists even though the concept
  definitions do not
- AIMS-IA's concept descriptions, which are correct, citation-bearing prose on the same
  standard, and can be drawn down to Foundation level

## 3.4 — The leak rule does not move

Run `scan-iso-leaks.mjs` over the new descriptions before anything is written. These are served
over MCP at contractVersion 2 to any caller — they are partner-visible, unauthenticated
blueprint content. A description must not reproduce ISO clause text. All four ISO corpora
currently stand at 0 refused; they stay there.

Note the gap you flagged earlier and have not closed: the 10-word threshold is close to
meaningless against descriptions this short. For a one-line description the n-gram seed needs to
be shorter, or the check needs a different instrument. **Tell me what you propose before you
rely on it** — do not write 154 descriptions behind a gate that cannot see them.

## 3.5 — Then re-translate, after deleting what exists

The 308 existing AIMS-F `concept_translations` rows render a placeholder. They are not a
starting point. Delete them, then regenerate from the new English.

Apply the template rule from Prompt 1.5 in reverse: there is now no shared tail, so each
description is translated on its own — but assert afterwards that no translated suffix is shared
by more than 20 rows, which would mean a stub was reintroduced.

## 3.6 — Then re-sample

New seed, `2026-<date>-aims-f`, 20 rows per language, same file shape as
`CONCEPT-SAMPLE.json` — `en_description` and `tr_description` side by side, empty `verdict`
and `note`. Send it to me and I will read it.

Do not clear AIMS-F on the strength of this prompt. The hold row from 1.3 is released by a
human read of the new sample, not by the repair having run.
