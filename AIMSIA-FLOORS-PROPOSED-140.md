# AIMS-IA floors to held counts -- DRY RUN

**Ruled PROMPT-140 s3. NOT APPLIED.** The director applies this after ruling on R4b.
Census refreshed PROMPT-140 (`AIMS-IA-SATURATION.json`): the previous one was written before
any insert and read every task at held 0.

## Floors that would be set (18)

| task | old floor | held | new floor | short by | exhausted or capacity-bound |
|---|---|---|---|---|---|
| 1.4 | 6 | **4** | **4** | 2 | capacity-bound |
| 1.5 | 8 | **7** | **7** | 1 | exhausted |
| 2.1 | 8 | **6** | **6** | 2 | capacity-bound |
| 2.5 | 8 | **6** | **6** | 2 | capacity-bound |
| 3.3 | 8 | **7** | **7** | 1 | exhausted |
| 3.4 | 8 | **5** | **5** | 3 | capacity-bound |
| 4.2 | 6 | **2** | **2** | 4 | capacity-bound |
| 4.8 | 8 | **6** | **6** | 2 | capacity-bound |
| 4.10 | 6 | **3** | **3** | 3 | exhausted |
| 4.11 | 4 | **2** | **2** | 2 | exhausted |
| 4.12 | 8 | **6** | **6** | 2 | exhausted |
| 4.13 | 8 | **5** | **5** | 3 | capacity-bound |
| 5.1 | 8 | **7** | **7** | 1 | capacity-bound |
| 5.2 | 8 | **2** | **2** | 6 | capacity-bound |
| 5.3 | 6 | **2** | **2** | 4 | exhausted |
| 5.4 | 8 | **3** | **3** | 5 | capacity-bound |
| 5.5 | 8 | **7** | **7** | 1 | capacity-bound |
| 5.7 | 6 | **4** | **4** | 2 | exhausted |

## NOT set -- holding fewer than 2 (2)

Ruled PROMPT-140 s3: "any task holding fewer than 2: don't set it, report it".

| task | held | floor | short by | why | assignable slots |
|---|---|---|---|---|---|
| **4.5** | **0** | 4 | 4 | exhausted | 0 |
| **5.6** | **0** | 4 | 4 | thin map | 4 |

## Left alone -- room still available (4)

| task | held | floor | short by | assignable slots |
|---|---|---|---|---|
| 1.3 | 5 | 8 | 3 | 6 |
| 3.6 | 5 | 8 | 3 | 7 |
| 2.2 | 7 | 8 | 1 | 8 |
| 2.4 | 7 | 8 | 1 | 5 |

These four have map room left; no round is planned, so they stay short unless the director
orders another. They are NOT exhausted.

