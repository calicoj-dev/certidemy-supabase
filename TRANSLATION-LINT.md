# Translation term lint

Read-only. `scripts/lint-translation-terms.mjs`, glossary `scripts/lib/translation-glossary.json`.
Nothing was written.

| | |
|---|---|
| rows examined | 18453 (approved, not retired, es-419 + pt-BR, pool=all) |
| rows with no English sibling | 5 |
| findings | 3689 |
| FORBIDDEN (gate failure) | 139 |
| MIXED (flag) | 2682 |
| UNTRANSLATED (flag) | 868 |
| UNCHECKED (could not run) | 0 |
| distinct rows involved | 1810 |

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
| AIE-I | pt-BR | 0 | 94 | 0 | 0 | 55 |
| AIGRM-I | es-419 | 2 | 32 | 80 | 0 | 40 |
| AIGRM-I | pt-BR | 127 | 490 | 82 | 0 | 250 |
| AIHR-I | es-419 | 0 | 2 | 0 | 0 | 2 |
| AIHR-I | pt-BR | 0 | 421 | 0 | 0 | 160 |
| AIMS-F | es-419 | 0 | 5 | 232 | 0 | 106 |
| AIMS-F | pt-BR | 0 | 371 | 219 | 0 | 231 |
| AIMS-IA | es-419 | 0 | 4 | 131 | 0 | 93 |
| AIMS-IA | pt-BR | 0 | 394 | 124 | 0 | 291 |
| AISM-I | pt-BR | 0 | 3 | 0 | 0 | 3 |
| ISMS-F | pt-BR | 2 | 132 | 0 | 0 | 93 |
| ISMS-IA | es-419 | 0 | 2 | 0 | 0 | 2 |
| ISMS-IA | pt-BR | 0 | 158 | 0 | 0 | 116 |
| SD-AI-I | es-419 | 5 | 157 | 0 | 0 | 116 |
| SD-AI-I | pt-BR | 1 | 24 | 0 | 0 | 25 |
| SM-AI-II | es-419 | 0 | 107 | 0 | 0 | 41 |
| SM-AI-II | pt-BR | 0 | 29 | 0 | 0 | 23 |
| SM-AI-I | es-419 | 1 | 146 | 0 | 0 | 90 |
| SM-AI-I | pt-BR | 1 | 15 | 0 | 0 | 16 |
| SPO-AI-I | es-419 | 0 | 90 | 0 | 0 | 51 |
| SPO-AI-I | pt-BR | 0 | 6 | 0 | 0 | 6 |

## Per term

| term | class | occurrences |
|---|---|---|
| aims_acronym.aims-acronym | untranslated | 866 |
| eu_ai_act.provider `fornecedor` | mixed | 859 |
| scrum_2020.developers-es `Desarrolladores` | mixed | 445 |
| iso_vocabulary_pt.standard-noun `padrão` | mixed | 315 |
| eu_ai_act.high-risk `alto risco` | mixed | 272 |
| eu_ai_act.provider-provedor `provedor` | mixed | 159 |
| eu_ai_act.provider `fornecedor` | forbidden | 124 |
| eu_ai_act.deployer `implantador` | mixed | 124 |
| iso_vocabulary_pt.should | mixed | 119 |
| clause_reference_pt.clause-word | mixed | 83 |
| iso_vocabulary_pt.standard-noun `padrões` | mixed | 69 |
| scrum_2020.scrum-team `Equipo Scrum` | mixed | 48 |
| scrum_2020.scrum-team `Equipe Scrum` | mixed | 46 |
| eu_ai_act.deployer `desplegador` | mixed | 39 |
| scrum_2020.scrum-team `Time Scrum` | mixed | 28 |
| eu_ai_act.deployer `implantadores` | mixed | 24 |
| iso_22989_roles.ai_provider-provedor `provedor de IA` | mixed | 20 |
| eu_ai_act.deployer `deployer` | mixed | 16 |
| text_quality.doubled-word | mixed | 10 |
| scrum_2020.development-team-retired `Equipo de Desarrollo` | forbidden | 6 |
| scrum_2020.developers-es `Equipo de Desarrollo` | mixed | 6 |
| eu_ai_act.act-name `EU AI Act` | forbidden | 5 |
| iso_vocabulary_pt.accreditation `credenciamento` | forbidden | 2 |
| scrum_2020.development-team-retired `Time de Desenvolvimento` | forbidden | 2 |
| eu_ai_act.provider | untranslated | 1 |
| eu_ai_act.provider-provedor | untranslated | 1 |

## FORBIDDEN by term and certification

| term | AIGRM-I es | AIGRM-I pt | ISMS-F pt | SD-AI-I es | SD-AI-I pt | SM-AI-I es | SM-AI-I pt | total |
|---|---|---|---|---|---|---|---|---|
| eu_ai_act.provider `fornecedor` |  | 174 |  |  |  |  |  | 174 |
| scrum_2020.development-team-retired `Equipo de Desarrollo` |  |  |  | 5 |  | 1 |  | 6 |
| eu_ai_act.act-name `EU AI Act` | 2 | 3 |  |  |  |  |  | 5 |
| iso_vocabulary_pt.accreditation `credenciamento` |  |  | 2 |  |  |  |  | 2 |
| scrum_2020.development-team-retired `Time de Desenvolvimento` |  |  |  |  | 1 |  | 1 | 2 |

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

