# Translation term lint

Read-only. `scripts/lint-translation-terms.mjs`, glossary `scripts/lib/translation-glossary.json`.
Nothing was written.

| | |
|---|---|
| rows examined | 18453 (approved, not retired, es-419 + pt-BR, pool=all) |
| rows with no English sibling | 5 |
| findings | 3675 |
| FORBIDDEN (gate failure) | 1950 |
| MIXED (flag) | 858 |
| UNTRANSLATED (flag) | 867 |
| UNCHECKED (could not run) | 0 |
| distinct rows involved | 1584 |

**UNCHECKED is a third state, not a pass.** It is a row carrying `deveria` whose English sibling is
missing, so the relative modal rule could not run. A rule that cannot see its source abstains.

**The Scrum family is EMPTY and checks nothing.** The official 2020 Spanish and Portuguese Scrum
Guides are not on disk, and the ruling forbids reconstructing official terms from memory. The terms
needed are in `SCRUM-GLOSSARY-NEEDED.md`.

**`fair presentation` in pt-BR is declared UNVERIFIED** -- the ABNT NBR ISO 19011 edition is not
held, so `apresentação justa` is a house form and is only ever a flag.

## Per certification and language

| certification | language | forbidden | mixed | untranslated | unchecked | rows |
|---|---|---|---|---|---|---|
| AIE-I | pt-BR | 83 | 9 | 0 | 0 | 55 |
| AIGRM-I | es-419 | 106 | 0 | 80 | 0 | 58 |
| AIGRM-I | pt-BR | 699 | 176 | 81 | 0 | 274 |
| AIHR-I | es-419 | 2 | 0 | 0 | 0 | 2 |
| AIHR-I | pt-BR | 420 | 1 | 0 | 0 | 160 |
| AIMS-F | es-419 | 17 | 0 | 232 | 0 | 114 |
| AIMS-F | pt-BR | 349 | 112 | 219 | 0 | 240 |
| AIMS-IA | es-419 | 84 | 0 | 131 | 0 | 155 |
| AIMS-IA | pt-BR | 179 | 272 | 124 | 0 | 316 |
| ISMS-F | pt-BR | 2 | 131 | 0 | 0 | 92 |
| ISMS-IA | es-419 | 9 | 0 | 0 | 0 | 3 |
| ISMS-IA | pt-BR | 0 | 157 | 0 | 0 | 115 |

## Per term

| term | class | occurrences |
|---|---|---|
| eu_ai_act.provider `fornecedor` | forbidden | 983 |
| aims_acronym.aims-acronym | untranslated | 866 |
| iso_vocabulary_pt.standard-noun `padrão` | mixed | 315 |
| eu_ai_act.high-risk `alto risco` | mixed | 272 |
| eu_ai_act.act-name `AI Act` | forbidden | 179 |
| eu_ai_act.deployer `implantador` | forbidden | 175 |
| eu_ai_act.provider `provedor` | forbidden | 159 |
| eu_ai_act.act-name `EU AI Act` | forbidden | 157 |
| aims_acronym.aims-acronym `SGSIA` | forbidden | 146 |
| iso_vocabulary_pt.should | mixed | 119 |
| clause_reference_pt.clause-word | mixed | 83 |
| iso_vocabulary_pt.standard-noun `padrões` | mixed | 69 |
| eu_ai_act.deployer `desplegador` | forbidden | 63 |
| eu_ai_act.deployer `implantadores` | forbidden | 54 |
| aims_acronym.aims-acronym `SGia` | forbidden | 16 |
| eu_ai_act.deployer `deployer` | forbidden | 16 |
| iso_vocabulary_pt.accreditation `credenciamento` | forbidden | 2 |
| eu_ai_act.provider | untranslated | 1 |

## What is auto-fixable and what is not

A ONE-TO-ONE substitution of a forbidden variant may go in the bulk pass. Anything whose correct
replacement depends on which SENSE the row means cannot, and the glossary marks those:

- `vendor` / `provider` in Spanish: `proveedor` is correct for the Regulation's ROLE and wrong for a
  commercial vendor, and nothing mechanical tells the two apart. FLAG, never substituted.
- `deveria`: correct wherever the English does not say `should`.
- the clause word: the corpus is 104:1 for `cláusula` in items and 17:1 the other way in lessons, so
  the house word is NOT imposed corpus-wide. Only a row that mixes two is reported.

