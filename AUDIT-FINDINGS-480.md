# Audit of the 480-item sample — director read, 2026-09-26

The sample is `AUDIT-SAMPLE.md`: 40 English secure items per certification, stratified by
domain, seed 20260926. It was read in six parallel passes against each certification's
cited source. ISO/IEC 42001 and ISO 19011:2026 were checked against the project PDFs. I
verified every Tier A finding myself before it was listed; the 42001 9.3.2 input list, for
example, was re-read from the PDF. Ids are prefixes of English rows. Resolve each one to its
group, and treat an ambiguous or missing prefix as a hard error.

## Rates (480 items)

| class | count | rate | meaning |
|---|---|---|---|
| A — wrong key | 11 | 2.3% | the keyed answer is false against the source, or no option is correct |
| B — contested | ~45 | ~9% | two options are defensible, or the key rests on a claim the source doesn't make |
| C — false explanation | ~50 | ~10% | the key is fine, but the explanation states something false or cites the wrong clause |
| D — item-writing flaw | ~35 | ~7% | the stem gives away the key, the key is the only longer option, the item depends on facts not in the stem, or near-duplicates |
| E — reproduction | 5 | 1% | more than 10 consecutive words verbatim from a standard |

This confirms the 342-read rate (1.5% wrong keys, 8.8% Tier B) on a sample drawn at random
from every certification. **Every certification has defects.** The errors cluster by
**source**: 2017 Scrum Guide wording across the Scrum certifications, 19011:2018-style clause
numbering in AIMS-IA and ISMS-IA, and invented "requirements" in the ISO items.

## Tier A — retire (whole group, all languages), after the feasibility check

| # | id | cert | why the key is wrong |
|---|---|---|---|
| 61 | `05e3cd2e` | AIGRM-I | EU AI Act Art. 50 places labelling duties on providers (50(2)) and deployers (50(4)). No provision labels a redistributor that used no AI. The key invents that duty. |
| 62 | `1331b1f7` | AIGRM-I | Art. 53(2) exempts open-source GPAI (without systemic risk) from the **documentation** duties in 53(1)(a)–(b), and they keep copyright policy and the training summary. The key says the reverse. |
| 81 | `9bcd2f15` | AIHR-I | A hand-written keyword filter isn't an AEDT/AI system under NYC LL144 rules, Colorado SB 24-205 or AI Act Art. 3(1). The key calls it in scope. |
| 123 | `3f0430cf` | AIMS-F | 42001 9.3.2 has **no** AI-specific review input (checked against the PDF: a–e are the harmonised list). No option is correct. |
| 152 | `1dddb20e` | AIMS-F | The stem cites a 42001 control "requiring responses to AI-specific incidents such as … drift". No such control exists: A.8.4 is about communicating incidents to users. |
| 249 | `e7d7e400` | ISMS-F | Amd 1:2024 requires determining **whether** climate change is relevant, with **no** documentation requirement. The key says documenting it is a standing requirement. |
| 349 | `57eb5129` | SD-AI-I | `ioutil.ReadAll` was **deprecated**, not removed, in Go 1.16. It still compiles. The stem and key premise are false, and distractor a is true. |
| 382 | `66de9c82` | SM-AI-I | "Traumatic and rare" cancellation is 2017 text, removed in 2020. No option is correct against the 2020 Guide. |
| 400 | `c10b3203` | SM-AI-I | The 2020 Guide: Scrum **Teams** "internally decide who does what, when, and how". The key says Developers only, and distractor c is the Guide's wording. |
| 220 | `de570ed8` | AISM-I | The stem says the policy **raises** the risk threshold (more tolerance), but the key lowers the autonomous limit. The key reads the opposite of the stem. |
| 475 | `a3f8c31e` | SPO-AI-I | There's no target date, and for any reasonable target the higher-throughput team B is more likely to finish. The key (A) depends on information that isn't there. |

## Tier B — SME review queue (add to ITEM-REVIEW-QUEUE.md, no rescoring)

- **AIE-I:** `fdcd8167` + `494911a3` (#3 and #5 contradict each other on whether rule-based
  systems are AI), `8523c745`, `3479ebab` (a "written approval" rule is invented).
- **AIGRM-I:** `875f45e1` (the Annex III triage scope, plus the missing Art. 25(1)(c) provider
  shift), `39d91b5b` (42001 6.1.2 covers individuals and societies too), `6ebc2e8b`.
- **AIHR-I:** `ef0212f7` (jurisdiction-dependent), `ab1030f1`, `5abec73c` (the ADA requires
  accommodation, not a pre-built equivalent path).
- **AIMS-F:** `b97b25ea` (invented AI-partner definition), `66fea350`, `ab6263f0` + `dd09940d`
  (B.7.5 says "can include", not must), `be876cdf`, `a90aee16`, `b965acf2` (there is no human-oversight
  Annex A control), `52004aae` (A.3.3 sits inside A.3), `591b9767` (provenance is A.7.5, not
  A.6.1), `430a65d2`, `83f159c4` (a date-dependent AI Act fact), `f50f74e8`.
- **AIMS-IA:** `e5ac972c` (the 19011 5.3 citation should be 5.5.1 g / 5.6), `1b3204d6`,
  `d3a7d8d1` (contradicts #180), `f78251d1` (6.3.1 should be 6.4.6), `a60747a4`, `b5cb06e4`
  (6.4.5 / A.16 should be 6.5.1 / 4.3), `251b199e`, `10b5f922` (3.26 puts the justification in
  the SoA), `40f77ab2` (B.1: no rationale required), `106ba660`, `1fd382be` (A.7.6 is a
  "shall", so a nonconformity is defensible).
- **AISM-I:** `0c57c72e`, `0ce9ffa3`.
- **ISMS-F:** `82b3a221` (Annex A has no "unchanged by AI" label), `08073000` (9.3.3 names
  no resource outputs), `309bf077`.
- **ISMS-IA:** `62d3f05f`, `1d72ac82`, `1b990908` (the stem makes option a also correct),
  `324e7cbc`, `809cfdb7`, `40e07225` (10.2 b) 3) makes c defensible).
- **SD-AI-I:** `0a37670f`, `c55258bb`, `e5102d70` (the DoD applies to the Increment, so
  distractor d is Guide-correct).
- **SM-AI-I:** `41099eea`, `59c4cd39`, `b33f6f7b`, `d199b366` (omits the PO negotiation the
  Guide requires).
- **SM-AI-II:** `8313061d`, `70f3d16e`, `8ad54965`, `d43baa5d`, `75504c35`, `7940031c`.
- **SPO-AI-I:** `c08b0309` (conflicts with #455), `21f9d683`, `949e36dd` (EBM lists Release
  Frequency under Time to Market, and the key is mislabelled Lead Time), `f7fc872b`.

## Tier C — explanation fixes (key sound): draft, don't write

- **Wrong clause numbers:** AIMS-IA `6bb38458` (19011 6.6 misquoted), `8f69a850` (3.11
  should be 3.10), `d2dbb301` (B.7.3 should be B.7.4); ISMS-IA `cc0731c2` + `a068c9c2` (4.3
  should be 4.6), `f500242f` (10.2 e should be d); ISMS-F `7fd48dc2` (5.2 should be 7.3 a).
- **Arithmetic:** ISMS-IA `33570616` (3,800 of 4,000 is 95%, not half).
- **2017 content in an explanation:** SD-AI-I `e7b74555` (stakeholders "the PO considers
  relevant"), `288ebb29` + `ce153e80` ("forecast"), SM-AI-I `a5e99117` (the 10% refinement
  rule), `5535addc` (servant leadership), `b3cf23ec`, SM-AI-II `24ab3b5e`, SPO-AI-I `c6f35101`,
  `0858d045` ("never complete").
- **Other false statements:** SM-AI-I `80ed1834` (the DoD is a commitment, not an artifact),
  `fc76c765`; SPO-AI-I `e9032f24` (one PO per **product**, not per team) — **this one is in
  the key text, so treat it as Tier B**; AIE-I `6e696561`, `9ab28dc8`, `06a72d49`, `461c2428`;
  AIGRM-I `941b4528`; AIHR-I `25724ce4`, `065f018d`, `976cd01e`; AIMS-F `379b53fe`, `87c740c9`;
  AIMS-IA `1a214870`, `bcbc3ebe`, `3db07420`, the "Annex B is 'should' throughout" line (B.7.6
  is a shall) in `40f77ab2`/`d2dbb301`/`1fd382be`; ISMS-F `74123396`, `f23cb9f6` (clear
  desk/screen is one control, 7.7), `229609f9`, `eb32ef37`, `19903f81`; ISMS-IA `17c54d3c`,
  `00ae33a8`; SM-AI-II `6481e78e`, `cf225690`, `94a1d8e2`, `1e6e87d0`, `2c7de35c`; SPO-AI-I
  `4c41886a`, `525e5dc3`, `25d1158e`, `afef2ca2`; SD-AI-I `b20540df`, `42248e2b`; SM-AI-I
  `7d8e2f57`; AISM-I `fe476461`; ISMS-F `db3fb179`.

## Tier D — item-writing flaws

- **The odd-one-out pattern** (three distractors share a verdict, and only the key differs):
  AIE-I `4a9fd209` `cbbbca49` `4d2a1e34` `eb2175f4` `1d93b7ea` `3479ebab` `5ac02fec`; AIGRM-I
  `05e3cd2e` `7d28e906`. **This is a generator pattern, so fix it in the rubric.**
- **Stem gives away the key / the key is the only long option:** AIGRM-I `941b4528`; AIMS-F
  `87c740c9`; AISM-I `0e10f3e8`, `80643999`; SM-AI-I `bece4ebf`, `6ac08824`; SM-AI-II
  `63b59512`.
- **Depends on facts not in the stem:** AIHR-I `a48fc07d`; AIGRM-I `143df4b8`; AIMS-F
  `e001ba3c`; AIMS-IA `4b9737de`; SM-AI-II `466b4336`, `0d9e74c0`.
- **Contradictory stem or broken option:** ISMS-F `1b1f5e01` (explanation for a different
  stem); ISMS-IA `4fa74813`, `5bdac5e4`, `07d2434c`, `75fd2b0f`; SM-AI-II `0659a1b0`
  (Retrospective "midway through a Sprint"), `4d6e1c5e`; SM-AI-I `b8c82f34` (the PO decides
  architecture), `19402b7a`.
- **Near-duplicates** (both could land on one form): AIMS-IA `b80199aa`/`e560d1c7`; ISMS-IA
  `cc0731c2`/`?283`, `00ae33a8`/`?297`; SM-AI-I `0908734a`/`5cc15507`, `08766949`/`4ba360d9`;
  SPO-AI-I `0246d9f1`/`d182038c`, `238f60f7`/`64ebf86f`, `bfeef7c5`/`c08b0309`. The
  stem-identity dedupe only catches identical English stems, so these pass it.

## Tier E — reproduction (paraphrase)

AIMS-F `87c740c9` (B.1), `79209585` (9.3.3, 13 words); AIMS-IA `3db07420` (6.1.4, 17 words),
`18904585` (8.2, 11 words, borderline); ISMS-IA `12b13dd2` (the 19011 audit-evidence
definition).
