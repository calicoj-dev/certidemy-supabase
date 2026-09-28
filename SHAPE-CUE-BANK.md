# Code shape cues over the live bank

`scripts/count-shape-cues-bank.mjs`, read-only, pool=secure, English, approved, not retired.
**Every rule is a FLAG. Nothing here rejects or changes an item.**

| | |
|---|---|
| items examined | 4155 |
| items with a resolvable single key | 4155 |
| multi-select or unresolvable key (not scored) | 0 |
| items carrying at least one cue | 2201 (53.0% of scored) |

**THE RULES WERE SILENT ON EVERY LIVE ROW UNTIL 2026-09-28.** `keyIndex` resolved `correct_index`
and `is_correct` but not `correct_answer`, which is the only one a `quiz_questions` row carries, so
a bank-wide run before today would have reported ZERO on every certification and read as clean.
This is the first count that means anything.

## Per certification, per rule

| certification | clang | agreement | opposite-pair | key-length | only-hedged | odd-verdict | any |
|---|---|---|---|---|---|---|---|
| AIE-I | 56 | 0 | 2 | 5 | 18 | 21 | 102 |
| AIGRM-I | 164 | 0 | 10 | 25 | 48 | 14 | 261 |
| AIHR-I | 112 | 0 | 3 | 17 | 21 | 25 | 178 |
| AIMS-F | 101 | 0 | 13 | 14 | 20 | 11 | 159 |
| AIMS-IA | 200 | 0 | 18 | 22 | 27 | 6 | 273 |
| AISM-I | 200 | 0 | 8 | 19 | 47 | 18 | 292 |
| ISMS-F | 132 | 0 | 17 | 19 | 28 | 18 | 214 |
| ISMS-IA | 185 | 0 | 18 | 23 | 22 | 3 | 251 |
| SD-AI-I | 140 | 0 | 7 | 12 | 26 | 20 | 205 |
| SM-AI-I | 164 | 1 | 21 | 31 | 20 | 19 | 256 |
| SM-AI-II | 201 | 0 | 1 | 18 | 29 | 7 | 256 |
| SPO-AI-I | 135 | 0 | 12 | 16 | 23 | 12 | 198 |
| ZZ-TEST-I | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| **total** | **1790** | **1** | **130** | **221** | **329** | **174** | |

A cue count is not a defect count: these are flags, and the rate at which each fires is part of its
definition. A rule firing on the majority would be a design error rather than a backlog.

## Members of the two NEW rules, for reading

House rule: a count is read before it is reported. 10 members per new rule, spread
deterministically across the list rather than taken from its head.

### `only-hedged` -- 329 firing

By arm: hedge 300, absolute 29.

- `00bb4699` SD-AI-I 1.4 -- the key is the only hedged option (can)
- `145fa273` AIMS-F 2.2 -- the key is the only hedged option (can)
- `330d8ca7` AIHR-I 4.3 -- the key is the only hedged option (can)
- `43facba0` AISM-I 3.3 -- the key is the only hedged option (can)
- `6380da0f` AISM-I 5.1 -- the key is the only hedged option (can)
- `7b379738` SPO-AI-I 3.7 -- the key is the only hedged option (can)
- `99a47cdd` SPO-AI-I 1.4 -- the key is the only hedged option (can)
- `b208bf10` AIE-I 3.4 -- the key is the only hedged option (may)
- `ca275188` ISMS-IA 4.8 -- the key is the only hedged option (may)
- `e75a1d0d` ISMS-F 3.5 -- the key is the only hedged option (may)

### `odd-verdict` -- 174 firing

- `065f018d` AIHR-I 4.3 -- all three distractors open "blanket ban" and the key opens "facially neutral ban"
- `1ae845a8` AISM-I 5.9 -- all three distractors open "no" and the key opens "yes harmful degradation"
- `36dab01b` AIHR-I 3.5 -- all three distractors open "the" and the key opens "only that less"
- `560dcf1d` AIE-I 2.6 -- all three distractors open "proceed because" and the key opens "use ai to"
- `6cca0060` SM-AI-II 3.1 -- all three distractors open "accept" and the key opens "decline the ordering"
- `83471a46` SM-AI-I 2.4 -- all three distractors open "acceptable" and the key opens "problematic because combining"
- `977bbf59` AISM-I 4.13 -- all three distractors open "logging satisfies" and the key opens "neither oversight mode"
- `b22eddf7` AIMS-F 2.1 -- all three distractors open "only" and the key opens "all jurisdictions where"
- `cbbbca49` AIE-I 2.6 -- all three distractors open "ai tool because" and the key opens "calculator or spreadsheet"
- `e9ac466f` AISM-I 4.7 -- all three distractors open "deflection rate" and the key opens "100 deflection is"

