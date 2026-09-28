# Translation term lint

Read-only. `scripts/lint-translation-terms.mjs`, glossary `scripts/lib/translation-glossary.json`.
Nothing was written.

| | |
|---|---|
| rows examined | 18453 (approved, not retired, es-419 + pt-BR, pool=all) |
| rows with no English sibling | 5 |
| findings | 3519 |
| FORBIDDEN (gate failure) | 572 |
| MIXED (flag) | 2079 |
| UNTRANSLATED (flag) | 868 |
| UNCHECKED (could not run) | 0 |
| distinct rows involved | 1584 |

**UNCHECKED is a third state, not a pass.** It is a row carrying `deveria` whose English sibling is
missing, so the relative modal rule could not run. A rule that cannot see its source abstains.

**The Scrum family is EMPTY and checks nothing.** The official 2020 es-419 and pt-BR Guides ARRIVED
2026-09-28 at `reference/scrum-guide-2020-es-419.pdf` and `-pt-br.pdf`, but having the guides is not
having the terms: the family is still unseeded, so nothing Scrum is linted. `SCRUM-GLOSSARY-NEEDED.md`
lists what to extract.

**`fair presentation` in pt-BR is declared UNVERIFIED** -- the ABNT NBR ISO 19011 edition is not
held, so `apresentação justa` is a house form and is only ever a flag.

## Per certification and language

| certification | language | forbidden | mixed | untranslated | unchecked | rows |
|---|---|---|---|---|---|---|
| AIE-I | pt-BR | 0 | 92 | 0 | 0 | 55 |
| AIGRM-I | es-419 | 49 | 32 | 80 | 0 | 58 |
| AIGRM-I | pt-BR | 306 | 490 | 82 | 0 | 274 |
| AIHR-I | es-419 | 0 | 2 | 0 | 0 | 2 |
| AIHR-I | pt-BR | 0 | 421 | 0 | 0 | 160 |
| AIMS-F | es-419 | 10 | 5 | 232 | 0 | 114 |
| AIMS-F | pt-BR | 54 | 356 | 219 | 0 | 240 |
| AIMS-IA | es-419 | 84 | 0 | 131 | 0 | 155 |
| AIMS-IA | pt-BR | 58 | 393 | 124 | 0 | 316 |
| ISMS-F | pt-BR | 2 | 131 | 0 | 0 | 92 |
| ISMS-IA | es-419 | 9 | 0 | 0 | 0 | 3 |
| ISMS-IA | pt-BR | 0 | 157 | 0 | 0 | 115 |

## Per term

| term | class | occurrences |
|---|---|---|
| aims_acronym.aims-acronym | untranslated | 866 |
| eu_ai_act.provider `fornecedor` | mixed | 859 |
| iso_vocabulary_pt.standard-noun `padrão` | mixed | 315 |
| eu_ai_act.high-risk `alto risco` | mixed | 272 |
| eu_ai_act.provider-provedor `provedor` | mixed | 159 |
| eu_ai_act.act-name `EU AI Act` | forbidden | 157 |
| aims_acronym.aims-acronym `SGSIA` | forbidden | 146 |
| eu_ai_act.provider `fornecedor` | forbidden | 124 |
| eu_ai_act.deployer `implantador` | mixed | 124 |
| iso_vocabulary_pt.should | mixed | 119 |
| clause_reference_pt.clause-word | mixed | 83 |
| iso_vocabulary_pt.standard-noun `padrões` | mixed | 69 |
| eu_ai_act.deployer `implantador` | forbidden | 51 |
| eu_ai_act.deployer `desplegador` | mixed | 39 |
| eu_ai_act.deployer `implantadores` | forbidden | 30 |
| eu_ai_act.deployer `desplegador` | forbidden | 24 |
| eu_ai_act.deployer `implantadores` | mixed | 24 |
| eu_ai_act.act-name `AI Act` | forbidden | 22 |
| aims_acronym.aims-acronym `SGia` | forbidden | 16 |
| eu_ai_act.deployer `deployer` | mixed | 16 |
| iso_vocabulary_pt.accreditation `credenciamento` | forbidden | 2 |
| eu_ai_act.provider | untranslated | 1 |
| eu_ai_act.provider-provedor | untranslated | 1 |

## FORBIDDEN by term and certification

| term | AIGRM-I es | AIGRM-I pt | AIMS-F es | AIMS-F pt | AIMS-IA es | AIMS-IA pt | ISMS-F pt | ISMS-IA es | total |
|---|---|---|---|---|---|---|---|---|---|
| eu_ai_act.provider `fornecedor` |  | 174 |  |  |  |  |  |  | 174 |
| eu_ai_act.act-name `EU AI Act` | 25 | 82 | 2 | 55 |  |  |  |  | 164 |
| aims_acronym.aims-acronym `SGSIA` |  |  |  |  | 86 | 62 |  | 15 | 163 |
| eu_ai_act.deployer `implantador` |  | 58 |  |  |  |  |  |  | 58 |
| eu_ai_act.deployer `implantadores` |  | 34 |  |  |  |  |  |  | 34 |
| eu_ai_act.deployer `desplegador` | 26 |  |  |  |  |  |  |  | 26 |
| eu_ai_act.act-name `AI Act` |  | 24 |  |  |  |  |  |  | 24 |
| aims_acronym.aims-acronym `SGia` |  |  | 8 | 3 | 4 | 1 |  |  | 16 |
| iso_vocabulary_pt.accreditation `credenciamento` |  |  |  |  |  |  | 2 |  | 2 |

Every blank cell is a certification where that term is not a gate failure: either it does not occur,
or the Regulation-scope rule and `not_gated_in` downgraded it to a flag. A blank is therefore a
SCOPE statement, not an absence of rows -- the flags are in the per-term table above.

## What is auto-fixable and what is not

A ONE-TO-ONE substitution of a forbidden variant may go in the bulk pass. Anything whose correct
replacement depends on which SENSE the row means cannot, and the glossary marks those:

- `vendor` / `provider` in Spanish: `proveedor` is correct for the Regulation's ROLE and wrong for a
  commercial vendor, and nothing mechanical tells the two apart. FLAG, never substituted.
- `deveria`: correct wherever the English does not say `should`.
- the clause word: the corpus is 104:1 for `cláusula` in items and 17:1 the other way in lessons, so
  the house word is NOT imposed corpus-wide. Only a row that mixes two is reported.

