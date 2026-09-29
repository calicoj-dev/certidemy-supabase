# AIMS-F: kept items already over the within-task anchor cap

**Report only. Nothing is dropped**, as ruled. Cap = 2 secure items per (source, clause) per task.

The census counts items the audit KEPT plus items already inserted as `pending_review`, whose anchors
are read from `item_grounding`. A breach is a property of the SET, not a defect in any one item --
each passed every gate on its own -- so which of an over-cap group to retire is a coverage judgement.

| task | source | clause | items | which |
|---|---|---|---|---|
| 2.7 | 42001 | `6.1.4` | **9** | 4d866548 (kept), 5fde13d2 (kept), 801661a1 (kept), 927415b8 (kept), c462e19d (kept), c94c2382 (kept), e7177f02 (kept), f6672984 (kept), d124df3c (pending_review) |
| 2.4 | 42001 | `5.3` | **7** | 17b73169 (kept), 255323d0 (kept), 5e9f5723 (kept), bb261a0a (kept), be93a05a (kept), fdc45841 (kept), 3359b050 (pending_review) |
| 2.6 | 42001 | `6.1.4` | **7** | 89837081 (kept), a335a9a2 (kept), b1ea2bf8 (kept), cec14c1b (kept), ea67eb46 (kept), f0075905 (kept), 17f802fb (pending_review) |
| 3.4 | 42001 | `8.1` | **7** | 1253931b (kept), 703c8787 (kept), 858fc400 (kept), 9a01f641 (kept), 9a66d2f4 (kept), db12e8ae (kept), ab040514 (pending_review) |
| 4.2 | 42001 | `6.1.3` | **7** | 4b17a768 (kept), 52a41005 (kept), adcc51b5 (kept), c4aec876 (kept), d91f0ab8 (kept), e68630fe (kept), 9bd5796f (pending_review) |
| 5.4 | 42001 | `10.2` | **7** | 1080ad8f (kept), 271bf759 (kept), 726ba04f (kept), aaf67ba6 (kept), abcb88f8 (kept), e412ffd4 (kept), f073235b (kept) |
| 3.1 | 42001 | `7.2` | **6** | 3fbd1080 (kept), 653a00e0 (kept), 88ef5543 (kept), f75f5026 (kept), fce10a55 (kept), 3ca45f4c (pending_review) |
| 3.5 | 42001 | `B.10.3` | **6** | 04816f41 (kept), 20ad8d94 (kept), 4e995733 (kept), 7ecc3faa (kept), aad10225 (kept), 4c69db20 (pending_review) |
| 5.1 | 42001 | `9.1` | **6** | 5d504d63 (kept), 987e23d6 (kept), b7d1c5da (kept), cc4d8f76 (kept), e9fc201f (kept), ef2a9c5d (pending_review) |
| 2.2 | 42001 | `4.3` | **5** | 145fa273 (kept), 8cfbdd7e (kept), cf6e4f73 (kept), d85dbfa8 (kept), ce86479f (pending_review) |
| 2.3 | 42001 | `5.2` | **5** | 144ef67c (kept), 4752d3f8 (kept), 537246ff (kept), ec233801 (kept), f2265782 (kept) |
| 2.5 | 42001 | `6.1.2` | **5** | 965e4d08 (kept), c9dabe55 (kept), edb840b2 (kept), ffaa8a5f (kept), 4467ac24 (pending_review) |
| 3.2 | 42001 | `7.3` | **5** | 3619a258 (kept), 470d5d29 (kept), ccb8a8b3 (kept), d93ef793 (kept), 1ea0ea64 (pending_review) |
| 3.3 | 42001 | `7.5.3` | **5** | 064f34ac (kept), 2b69401f (kept), 388b7724 (kept), 9625779e (kept), adac7749 (kept) |
| 3.8 | 42001 | `8.2` | **5** | 57042560 (kept), 8ca02e02 (kept), a90aee16 (kept), d13d9a82 (kept), d48a4f53 (pending_review) |
| 5.2 | 42001 | `9.2.2` | **5** | 04495679 (kept), a9d76703 (kept), bf39a313 (kept), e18c7e37 (kept), 07561e42 (pending_review) |
| 5.3 | 42001 | `9.3.2` | **5** | 17b183f2 (kept), 23fdd105 (kept), 2b85823e (kept), 3e1dc277 (kept), 4b317d6c (pending_review) |
| 2.1 | 42001 | `4.1` | **4** | 1ad52afa (kept), 7d4492fa (kept), f50f74e8 (kept), 4acadf6b (pending_review) |
| 4.5 | 42001 | `A.8.2` | **4** | 69503a03 (kept), 9159156a (kept), aebebd62 (kept), e4dd8856 (kept) |
| 1.2 | 42001 | `4.1` | **3** | c97c7af7 (kept), d1108661 (kept), 9cbef19e (pending_review) |
| 2.8 | 42001 | `6.1.3` | **3** | 1ce517bd (kept), cbfcb33f (kept), 1f2f7dc7 (pending_review) |
| 3.2 | 42001 | `7.4` | **3** | 4ddff75d (kept), e001ba3c (kept), f74447c0 (kept) |
| 3.3 | 42001 | `7.5.2` | **3** | 45f0ede4 (kept), bce9e93f (kept), fd65b423 (pending_review) |
| 4.1 | 42001 | `6.1.3` | **3** | 8486980b (kept), 87c740c9 (kept), b40e412a (kept) |
| 4.6 | 42001 | `A.10.2` | **3** | 430a65d2 (kept), 528c0183 (kept), f93d06cc (pending_review) |

**25 group(s) over the cap**, 78 item(s) in excess.

## At the cap exactly (no room for another item)

13 group(s). These are not breaches; they are clauses a future run may not anchor in.

- 1.1  42001 `1`
- 1.4  42001 `D.2`
- 2.3  42001 `6.3`
- 2.5  42001 `6.1.1`
- 3.6  42001 `B.7.2`
- 3.8  42001 `8.3`
- 4.1  42001 `A.1`
- 4.1  42001 `B.1`
- 4.3  42001 `A.3.3`
- 5.2  42001 `9.2.1`
- 5.3  42001 `9.3.1`
- 5.5  42001 `1`
- 5.6  42001 `6.1.2`

