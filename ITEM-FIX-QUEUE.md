# Item fix queue — Tiers C, D and E

From the director's read of the 480-item audit sample, 2026-09-26. **Nothing here is
drafted yet** — this is the worklist, grouped by fix type so one pass can close a whole
group rather than one item at a time.

Tier A is retired (`AUDIT-480-RETIRED.json`, 33 rows across 11 groups). Tier B is in `ITEM-REVIEW-QUEUE.md` and needs an SME, not a fix.

| tier | what it is | count | who fixes it |
|---|---|---|---|
| **C** | the key is sound, the explanation states something false or cites the wrong clause | 54 | a writer with the source open |
| **D** | item-writing flaw: give-away, missing facts, contradiction, near-duplicate | 31 + 8 pairs | a writer, and one group belongs in the RUBRIC |
| **E** | more than ten consecutive words verbatim from a standard | 5 | paraphrase, then the leak gate measures it |

**Every one of these is a defect in the English**, so a fix reaches all three languages.
Editing a translated row is never the remedy for any of them.

---

## Tier C — explanation fixes, key sound

### wrong clause number — 7

| cert | id | task | detail |
|---|---|---|---|
| AIMS-IA | `6bb38458` | 3.1 | 19011 6.6 misquoted |
| AIMS-IA | `8f69a850` | 5.2 | 3.11 should be 3.10 |
| AIMS-IA | `d2dbb301` | 4.9 | B.7.3 should be B.7.4; also carries the false "Annex B is should throughout" line |
| ISMS-IA | `cc0731c2` | 1.2 | 4.3 should be 4.6 |
| ISMS-IA | `a068c9c2` | 5.3 | 4.3 should be 4.6 |
| ISMS-IA | `f500242f` | 5.5 | 10.2 e should be d |
| ISMS-F | `7fd48dc2` | 2.6 | 5.2 should be 7.3 a |

### arithmetic — 1

| cert | id | task | detail |
|---|---|---|---|
| ISMS-IA | `33570616` | 5.4 | 3,800 of 4,000 is 95%, not half |

### 2017 content in an explanation — 9

| cert | id | task | detail |
|---|---|---|---|
| SD-AI-I | `e7b74555` | 2.5 | stakeholders "the PO considers relevant" |
| SD-AI-I | `288ebb29` | 5.8 | "forecast" |
| SD-AI-I | `ce153e80` | 5.8 | "forecast" |
| SM-AI-I | `a5e99117` | 4.8 | the 10% refinement rule |
| SM-AI-I | `5535addc` | 5.4 | servant leadership |
| SM-AI-I | `b3cf23ec` | 3.4 | 2017 content |
| SM-AI-II | `24ab3b5e` | 1.4 | 2017 content |
| SPO-AI-I | `c6f35101` | 2.3 | 2017 content |
| SPO-AI-I | `0858d045` | 4.1 | "never complete" |

### other false statement — 37

| cert | id | task | detail |
|---|---|---|---|
| SM-AI-I | `80ed1834` | 4.3 | the DoD is a commitment, not an artifact |
| SM-AI-I | `fc76c765` | 3.4 | false statement |
| SM-AI-I | `7d8e2f57` | 3.1 | false statement |
| AIE-I | `6e696561` | 1.1 | false statement |
| AIE-I | `9ab28dc8` | 1.6 | false statement |
| AIE-I | `06a72d49` | 1.6 | false statement |
| AIE-I | `461c2428` | 1.7 | false statement |
| AIGRM-I | `941b4528` | 1.7 | false statement; also a Tier D give-away |
| AIHR-I | `25724ce4` | 2.2 | false statement |
| AIHR-I | `065f018d` | 4.3 | false statement |
| AIHR-I | `976cd01e` | 4.4 | false statement |
| AIMS-F | `379b53fe` | 4.3 | false statement |
| AIMS-F | `87c740c9` | 4.1 | false statement; also Tier D and Tier E (B.1) |
| AIMS-IA | `1a214870` | 3.6 | false statement |
| AIMS-IA | `bcbc3ebe` | 3.7 | false statement |
| AIMS-IA | `3db07420` | 4.6 | false statement; also Tier E (6.1.4, 17 words) |
| AIMS-IA | `1fd382be` | 5.4 | the "Annex B is should throughout" line -- B.7.6 is a shall |
| ISMS-F | `74123396` | 3.3 | false statement |
| ISMS-F | `f23cb9f6` | 4.11 | clear desk/screen is ONE control, 7.7 |
| ISMS-F | `229609f9` | 5.3 | false statement |
| ISMS-F | `eb32ef37` | 5.7 | false statement |
| ISMS-F | `19903f81` | 5.7 | false statement |
| ISMS-F | `db3fb179` | 2.9 | false statement |
| ISMS-IA | `17c54d3c` | 2.4 | false statement |
| ISMS-IA | `00ae33a8` | 3.3 | false statement |
| SM-AI-II | `6481e78e` | 3.2 | false statement |
| SM-AI-II | `cf225690` | 3.5 | false statement |
| SM-AI-II | `94a1d8e2` | 4.3 | false statement |
| SM-AI-II | `1e6e87d0` | 4.8 | false statement |
| SM-AI-II | `2c7de35c` | 5.2 | false statement |
| SPO-AI-I | `4c41886a` | 4.5 | false statement |
| SPO-AI-I | `525e5dc3` | 3.3 | false statement |
| SPO-AI-I | `25d1158e` | 3.5 | false statement |
| SPO-AI-I | `afef2ca2` | 4.7 | false statement |
| SD-AI-I | `b20540df` | 1.5 | false statement |
| SD-AI-I | `42248e2b` | 4.10 | false statement |
| AISM-I | `fe476461` | 2.6 | false statement |

---

## Tier D — item-writing flaws

### odd-one-out pattern (FIX IN THE RUBRIC, not per item) — 9

**Fix this in the rubric, not per item.** Three distractors sharing a verdict while only
the key differs is a shape the generator produces, so nine corrected items would be
followed by nine more. `scripts/gen-cert-secure.mjs` is where the item contract lives.

| cert | id | task |
|---|---|---|
| AIE-I | `4a9fd209` | 2.6 |
| AIE-I | `cbbbca49` | 2.6 |
| AIE-I | `4d2a1e34` | 2.6 |
| AIE-I | `eb2175f4` | 3.5 |
| AIE-I | `1d93b7ea` | 3.5 |
| AIE-I | `3479ebab` | 3.5 |
| AIE-I | `5ac02fec` | 3.5 |
| AIGRM-I | `05e3cd2e` | 3.3  **(no longer live)** |
| AIGRM-I | `7d28e906` | 4.11 |

### stem gives away the key, or the key is the only long option — 7

| cert | id | task |
|---|---|---|
| AIGRM-I | `941b4528` | 1.7 |
| AIMS-F | `87c740c9` | 4.1 |
| AISM-I | `0e10f3e8` | 4.2 |
| AISM-I | `80643999` | 4.5 |
| SM-AI-I | `bece4ebf` | 4.1 |
| SM-AI-I | `6ac08824` | 1.6 |
| SM-AI-II | `63b59512` | 5.5 |

### depends on facts not in the stem — 6

| cert | id | task |
|---|---|---|
| AIHR-I | `a48fc07d` | 1.3 |
| AIGRM-I | `143df4b8` | 5.2 |
| AIMS-F | `e001ba3c` | 3.2 |
| AIMS-IA | `4b9737de` | 4.4 |
| SM-AI-II | `466b4336` | 2.2 |
| SM-AI-II | `0d9e74c0` | 5.1 |

### contradictory stem or broken option — 9

| cert | id | task |
|---|---|---|
| ISMS-F | `1b1f5e01` | 2.2 |
| ISMS-IA | `4fa74813` | 2.2 |
| ISMS-IA | `5bdac5e4` | 4.4 |
| ISMS-IA | `07d2434c` | 4.10 |
| ISMS-IA | `75fd2b0f` | 2.1 |
| SM-AI-II | `0659a1b0` | 1.9 |
| SM-AI-II | `4d6e1c5e` | 1.6 |
| SM-AI-I | `b8c82f34` | 1.5 |
| SM-AI-I | `19402b7a` | 2.8 |

### near-duplicate pairs — 8, and the dedupe catches none of them

**Measured against the deployed stem-identity dedupe:**

| | |
|---|---|
| caught by the dedupe | **0** |
| in different domains, so not competing for one slot | 1 |
| **can still land on one form** | **7** |

The dedupe keys on the English sibling's stem, first 160 characters. It was built for
VARIANT pairs that share a stem in every language, and **a near-duplicate has no shared
string to match** — so catching none of these is the guard working as specified, not
failing. Seven of the eight sit on the **same task in the same domain**, so the allocator
can draw both for one form.

**Two ids the director marked `?` are resolved from `AUDIT-SAMPLE.md` position, not
guessed**, and each pairs with the item immediately before it on the same task:

| sample position | id | pairs with |
|---|---|---|
| 283 | `bd13b898` | `cc0731c2` (position 284) |
| 297 | `1c6caa16` | `00ae33a8` (position 296) |

| cert | pair | tasks | dedupe | can land together |
|---|---|---|---|---|
| AIMS-IA | `b80199aa` / `e560d1c7` | 1.5 (D1) / 1.5 (D1) | misses | **yes** |
| ISMS-IA | `cc0731c2` / `bd13b898` | 1.2 (D1) / 1.2 (D1) | misses | **yes** |
| ISMS-IA | `00ae33a8` / `1c6caa16` | 3.3 (D3) / 3.3 (D3) | misses | **yes** |
| SM-AI-I | `0908734a` / `5cc15507` | 2.9 (D2) / 2.9 (D2) | misses | **yes** |
| SM-AI-I | `08766949` / `4ba360d9` | 5.2 (D5) / 5.2 (D5) | misses | **yes** |
| SPO-AI-I | `0246d9f1` / `d182038c` | 2.1 (D2) / 2.1 (D2) | misses | **yes** |
| SPO-AI-I | `238f60f7` / `64ebf86f` | 2.8 (D2) / 3.2 (D3) | misses | no |
| SPO-AI-I | `bfeef7c5` / `c08b0309` | 3.7 (D3) / 3.7 (D3) | misses | **yes** |

> **The durable fix is not a wider dedupe.** Matching "similar" stems needs a similarity
> threshold, and this repository has already recorded what an absolute threshold does to a
> corpus that varies in length. These are eight authored duplicates: retire or rewrite one
> of each pair and the problem is gone, with no new judgement in the form assembler.

---

## Tier E — reproduction

| cert | id | task | source |
|---|---|---|---|
| AIMS-F | `87c740c9` | 4.1 | B.1 |
| AIMS-F | `79209585` | 5.3 | 9.3.3, 13 words |
| AIMS-IA | `3db07420` | 4.6 | 6.1.4, 17 words |
| AIMS-IA | `18904585` | 4.8 | 8.2, 11 words, borderline |
| ISMS-IA | `12b13dd2` | 3.1 | the 19011 audit-evidence definition |

These are ITEM bodies. `scan-iso-leaks` measures LESSON bodies, so **no gate currently
sees them** — the item pools have never been leak-scanned. That is its own open item and
is bigger than these five: the same scanner pointed at the item corpus would measure every certification's bank at once.

---

## Rates, for context

| class | count | rate of 480 |
|---|---|---|
| A — wrong key | 11 | 2.3% |
| B — contested | 45 | ~9% |
| C — false explanation | 50 | ~10% |
| D — item-writing flaw | 35 | ~7% |
| E — reproduction | 5 | 1% |

B, C and D are the director's approximate counts; A and E are exact. The queues above
carry the exact ids, which is why the table totals and the queue lengths differ slightly.
