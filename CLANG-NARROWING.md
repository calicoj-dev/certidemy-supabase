# Clang, narrowed: the proposal and its measurement

`scripts/measure-clang-narrowing.mjs`, read-only. **NOTHING IS ADOPTED HERE.** Ruling A says the
narrowing is adopted only when a read shows the members are real cues, so this prints the members.

## The rule

Current: an echoed stem word counts if it is 5+ characters, not a function word, present in the key
and absent from EVERY distractor.

Proposed: the same, **and the word must not appear in the task statement or in any concept name
linked to the item**. A word in the task's own statement is the subject the item is required to be
about, so its presence in the key is the topic rather than a cue.

## What it does to the count

| | items |
|---|---|
| secure English items scored | 4155 |
| clang fires today | 1790 (43.1%) |
| clang fires under the narrowing | 1618 (38.9%) |
| **dropped by the narrowing** | **172** |

| certification | now | narrowed |
|---|---|---|
| AIE-I | 56 | 52 |
| AIGRM-I | 164 | 159 |
| AIHR-I | 112 | 109 |
| AIMS-F | 101 | 92 |
| AIMS-IA | 200 | 186 |
| AISM-I | 200 | 174 |
| ISMS-F | 132 | 116 |
| ISMS-IA | 185 | 174 |
| SD-AI-I | 140 | 121 |
| SM-AI-I | 164 | 141 |
| SM-AI-II | 201 | 182 |
| SPO-AI-I | 135 | 112 |

## Two further variants

| rule | items firing | share of the bank |
|---|---|---|
| clang today | 1790 | 43.1% |
| + topic words excluded | 1618 | 38.9% |
| + at least 2 echoed words | 583 | 14.0% |
| + at least 3 echoed words | 184 | 4.4% |

**THE VERDICT ON THE PROPOSED RULE: IT IS NOT ENOUGH, AND I AM NOT PROPOSING ITS ADOPTION.**
Excluding task and concept words moves 43.1% to 38.9% -- 172 items of 1790 -- and the members that
survive read exactly like the ones that motivated the narrowing: `review`, `items`, `client`,
`feedback`, `routing`, `director`, `owner`, `developers`. Ordinary scenario vocabulary.

**The diagnosis is that the rule's premise is wrong, not its threshold.** "A content word present in
the key and in no distractor" describes every item whose distractors talk about different things --
which is what good distractors do. Tightening the word list cannot fix a premise.

**The principled fix is DOCUMENT FREQUENCY, not length or topic membership**, and this repository
already records that exact lesson against the match-terms pipeline: *both guards measure a term's
LENGTH when the risk is its DOCUMENT FREQUENCY*. A word echoed from stem to key is a cue when it is
RARE in the corpus and noise when it is common. That is a real measurement to do -- per-certification
document frequency over stems and options -- and it is the proposal I would bring back, not this one.

Until then clang stays out of the trigger set and stays in check 3, where the rate does not matter.

## 20 members the narrowing DROPS

These are the ones to read first: if they are topic words, the narrowing is right.

- `01ab3c39` ISMS-IA 2.5 -- echoed "audit", all in the task statement or a concept name
- `08a223ca` AIMS-IA 5.7 -- echoed "review", all in the task statement or a concept name
- `121b8cf6` ISMS-IA 3.8 -- echoed "leaves", "unverified", all in the task statement or a concept name
- `2036d4c9` AIHR-I 1.1 -- echoed "talent", all in the task statement or a concept name
- `3032b81e` AISM-I 6.1 -- echoed "service", all in the task statement or a concept name
- `3dfb0541` SM-AI-I 2.2 -- echoed "effectiveness", all in the task statement or a concept name
- `423162b7` AIMS-F 5.6 -- echoed "audit", all in the task statement or a concept name
- `5720a960` ISMS-F 3.9 -- echoed "information", all in the task statement or a concept name
- `675815c8` AISM-I 3.1 -- echoed "activities", all in the task statement or a concept name
- `70bebaa1` AISM-I 3.10 -- echoed "waste", all in the task statement or a concept name
- `84b6a027` ISMS-F 4.8 -- echoed "model", all in the task statement or a concept name
- `9447d2ac` SPO-AI-I 3.6 -- echoed "product", all in the task statement or a concept name
- `9c6b4f8b` SPO-AI-I 3.6 -- echoed "value", all in the task statement or a concept name
- `a9ea2ea4` SPO-AI-I 2.1 -- echoed "product", all in the task statement or a concept name
- `b5385979` AIE-I 2.3 -- echoed "generative", all in the task statement or a concept name
- `c26bd7f9` AISM-I 1.1 -- echoed "service", all in the task statement or a concept name
- `d0e16963` SM-AI-II 3.1 -- echoed "owner", all in the task statement or a concept name
- `e2611a75` SPO-AI-I 4.1 -- echoed "product", all in the task statement or a concept name
- `ed1332f7` SD-AI-I 4.5 -- echoed "tests", all in the task statement or a concept name
- `f23cb9f6` ISMS-F 4.11 -- echoed "controls", all in the task statement or a concept name

## 20 members that STILL fire

If these read as subject vocabulary too, the narrowing is not enough and clang needs a different
rule rather than a tighter one.

- `0053308f` AIMS-IA 4.13 -- echoed "documented", "firms'", "certifications"
- `0d3fcaec` AISM-I 1.7 -- echoed "review"
- `1a4f6e67` SM-AI-I 1.7 -- echoed "items"
- `25fb9637` AIE-I 3.4 -- echoed "client"
- `33ea79ff` SPO-AI-I 5.3 -- echoed "churn", "revenue"
- `41099eea` SM-AI-I 1.7 -- echoed "eight", "without"
- `4dab4e08` AISM-I 2.7 -- echoed "delegated"
- `5b1898df` AIGRM-I 5.8 -- echoed "feedback"
- `683a738d` AISM-I 4.10 -- echoed "routing"
- `758dd184` SM-AI-II 3.3 -- echoed "director"
- `815e16c0` SM-AI-I 4.2 -- echoed "owner" (topic words removed: "product")
- `8fd10a55` SM-AI-I 2.5 -- echoed "developers"
- `9b4f8fe0` AIHR-I 2.6 -- echoed "compliant", "validated", "scoring", "norms"
- `a6975983` AIHR-I 3.6 -- echoed "status"
- `b20540df` SD-AI-I 1.5 -- echoed "creates"
- `c0e2014f` SM-AI-I 2.1 -- echoed "product"
- `cd8f7439` ISMS-IA 5.4 -- echoed "entries", "examined", "anomaly", "score"
- `dab54290` AIMS-IA 4.10 -- echoed "record"
- `e7752caa` SD-AI-I 4.7 -- echoed "'none'"
- `f4eaac1c` AIGRM-I 3.5 -- echoed "downstream"

