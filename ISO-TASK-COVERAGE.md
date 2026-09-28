# ISO certifications: per-task source coverage

`scripts/report-iso-task-coverage.mjs`, read-only. Nothing was written.

**A task with no PRIMARY passage cannot be generated against.** The anchor gate requires the key to
rest on a primary passage of the task, so `SUPPORTING ONLY` is not generatable either -- it is listed
separately rather than folded into LINKED, because a count of tasks with any link would report
coverage that does not exist.

| certification | tasks | LINKED | SUPPORTING ONLY | ZERO | live secure EN | short of 8 |
|---|---|---|---|---|---|---|
| ISMS-F | 49 | 0 | 0 | 49 | 391 | 1 |
| ISMS-IA | 38 | 0 | 0 | 38 | 304 | 0 |
| AIMS-F | 35 | 35 | 0 | 0 | 278 | 2 |
| AIMS-IA | 40 | 0 | 0 | 40 | 320 | 0 |
| **total** | 162 | 35 | 0 | 127 | 1293 | 3 |

## Tasks with ZERO linked passages

These cannot be generated against at all until they are linked.

| certification | task | live secure EN |
|---|---|---|
| AIMS-IA | 1.1 | 8 |
| AIMS-IA | 1.2 | 8 |
| AIMS-IA | 1.3 | 8 |
| AIMS-IA | 1.4 | 8 |
| AIMS-IA | 1.5 | 8 |
| AIMS-IA | 2.1 | 8 |
| AIMS-IA | 2.2 | 8 |
| AIMS-IA | 2.3 | 8 |
| AIMS-IA | 2.4 | 8 |
| AIMS-IA | 2.5 | 8 |
| AIMS-IA | 2.6 | 8 |
| AIMS-IA | 2.7 | 8 |
| AIMS-IA | 3.1 | 8 |
| AIMS-IA | 3.2 | 8 |
| AIMS-IA | 3.3 | 8 |
| AIMS-IA | 3.4 | 8 |
| AIMS-IA | 3.5 | 8 |
| AIMS-IA | 3.6 | 8 |
| AIMS-IA | 3.7 | 8 |
| AIMS-IA | 3.8 | 8 |
| AIMS-IA | 4.1 | 8 |
| AIMS-IA | 4.2 | 8 |
| AIMS-IA | 4.3 | 8 |
| AIMS-IA | 4.4 | 8 |
| AIMS-IA | 4.5 | 8 |
| AIMS-IA | 4.6 | 8 |
| AIMS-IA | 4.7 | 8 |
| AIMS-IA | 4.8 | 8 |
| AIMS-IA | 4.9 | 8 |
| AIMS-IA | 4.10 | 8 |
| AIMS-IA | 4.11 | 8 |
| AIMS-IA | 4.12 | 8 |
| AIMS-IA | 4.13 | 8 |
| AIMS-IA | 5.1 | 8 |
| AIMS-IA | 5.2 | 8 |
| AIMS-IA | 5.3 | 8 |
| AIMS-IA | 5.4 | 8 |
| AIMS-IA | 5.5 | 8 |
| AIMS-IA | 5.6 | 8 |
| AIMS-IA | 5.7 | 8 |
| ISMS-F | 1.1 | 8 |
| ISMS-F | 1.2 | 8 |
| ISMS-F | 1.3 | 8 |
| ISMS-F | 1.4 | 8 |
| ISMS-F | 1.5 | 8 |
| ISMS-F | 1.6 | 8 |
| ISMS-F | 1.7 | 8 |
| ISMS-F | 2.1 | 8 |
| ISMS-F | 2.2 | 8 |
| ISMS-F | 2.3 | 7 |
| ISMS-F | 2.4 | 8 |
| ISMS-F | 2.5 | 8 |
| ISMS-F | 2.6 | 8 |
| ISMS-F | 2.7 | 8 |
| ISMS-F | 2.8 | 8 |
| ISMS-F | 2.9 | 8 |
| ISMS-F | 3.1 | 8 |
| ISMS-F | 3.2 | 8 |
| ISMS-F | 3.3 | 8 |
| ISMS-F | 3.4 | 8 |
| ISMS-F | 3.5 | 8 |
| ISMS-F | 3.6 | 8 |
| ISMS-F | 3.7 | 8 |
| ISMS-F | 3.8 | 8 |
| ISMS-F | 3.9 | 8 |
| ISMS-F | 3.10 | 8 |
| ISMS-F | 3.11 | 8 |
| ISMS-F | 4.1 | 8 |
| ISMS-F | 4.2 | 8 |
| ISMS-F | 4.3 | 8 |
| ISMS-F | 4.4 | 8 |
| ISMS-F | 4.5 | 8 |
| ISMS-F | 4.6 | 8 |
| ISMS-F | 4.7 | 8 |
| ISMS-F | 4.8 | 8 |
| ISMS-F | 4.9 | 8 |
| ISMS-F | 4.10 | 8 |
| ISMS-F | 4.11 | 8 |
| ISMS-F | 4.12 | 8 |
| ISMS-F | 4.13 | 8 |
| ISMS-F | 5.1 | 8 |
| ISMS-F | 5.2 | 8 |
| ISMS-F | 5.3 | 8 |
| ISMS-F | 5.4 | 8 |
| ISMS-F | 5.5 | 8 |
| ISMS-F | 5.6 | 8 |
| ISMS-F | 5.7 | 8 |
| ISMS-F | 5.8 | 8 |
| ISMS-F | 5.9 | 8 |
| ISMS-IA | 1.1 | 8 |
| ISMS-IA | 1.2 | 8 |
| ISMS-IA | 1.3 | 8 |
| ISMS-IA | 1.4 | 8 |
| ISMS-IA | 1.5 | 8 |
| ISMS-IA | 2.1 | 8 |
| ISMS-IA | 2.2 | 8 |
| ISMS-IA | 2.3 | 8 |
| ISMS-IA | 2.4 | 8 |
| ISMS-IA | 2.5 | 8 |
| ISMS-IA | 2.6 | 8 |
| ISMS-IA | 2.7 | 8 |
| ISMS-IA | 3.1 | 8 |
| ISMS-IA | 3.2 | 8 |
| ISMS-IA | 3.3 | 8 |
| ISMS-IA | 3.4 | 8 |
| ISMS-IA | 3.5 | 8 |
| ISMS-IA | 3.6 | 8 |
| ISMS-IA | 3.7 | 8 |
| ISMS-IA | 3.8 | 8 |
| ISMS-IA | 3.9 | 8 |
| ISMS-IA | 4.1 | 8 |
| ISMS-IA | 4.2 | 8 |
| ISMS-IA | 4.3 | 8 |
| ISMS-IA | 4.4 | 8 |
| ISMS-IA | 4.5 | 8 |
| ISMS-IA | 4.6 | 8 |
| ISMS-IA | 4.7 | 8 |
| ISMS-IA | 4.8 | 8 |
| ISMS-IA | 4.9 | 8 |
| ISMS-IA | 4.10 | 8 |
| ISMS-IA | 5.1 | 8 |
| ISMS-IA | 5.2 | 8 |
| ISMS-IA | 5.3 | 8 |
| ISMS-IA | 5.4 | 8 |
| ISMS-IA | 5.5 | 8 |
| ISMS-IA | 5.6 | 8 |
| ISMS-IA | 5.7 | 8 |

## Every task

| certification | task | state | primary | supporting | sources | live EN | short |
|---|---|---|---|---|---|---|---|
| AIMS-F | 1.1 | LINKED | 3 | 5 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 1.2 | LINKED | 1 | 4 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 1.3 | LINKED | 5 | 17 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 1.4 | LINKED | 2 | 4 | ISO/IEC 27001, ISO/IEC 42001 | 7 | 1 |
| AIMS-F | 1.5 | LINKED | 2 | 7 | EU AI Act, ISO/IEC 42001, ISO/IEC 42006 | 8 | 0 |
| AIMS-F | 1.6 | LINKED | 2 | 3 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 2.1 | LINKED | 2 | 2 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 2.2 | LINKED | 1 | 3 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 2.3 | LINKED | 4 | 7 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 2.4 | LINKED | 2 | 4 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 2.5 | LINKED | 2 | 4 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 2.6 | LINKED | 6 | 5 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 2.7 | LINKED | 2 | 3 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 2.8 | LINKED | 2 | 4 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 3.1 | LINKED | 2 | 10 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 3.2 | LINKED | 2 | 2 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 3.3 | LINKED | 3 | 1 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 3.4 | LINKED | 1 | 3 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 3.5 | LINKED | 7 | 1 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 3.6 | LINKED | 10 | 2 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 3.7 | LINKED | 9 | 9 | ISO/IEC 27001, ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 3.8 | LINKED | 3 | 3 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 4.1 | LINKED | 3 | 8 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 4.2 | LINKED | 2 | 2 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 4.3 | LINKED | 10 | 13 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 4.4 | LINKED | 13 | 16 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 4.5 | LINKED | 9 | 11 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 4.6 | LINKED | 6 | 9 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 4.7 | LINKED | 1 | 7 | ISO/IEC 42001 | 7 | 1 |
| AIMS-F | 5.1 | LINKED | 1 | 3 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 5.2 | LINKED | 2 | 1 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 5.3 | LINKED | 3 | 1 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 5.4 | LINKED | 1 | 3 | ISO/IEC 42001 | 8 | 0 |
| AIMS-F | 5.5 | LINKED | 24 | 14 | ISO/IEC 17021-1, ISO/IEC 42006 | 8 | 0 |
| AIMS-F | 5.6 | LINKED | 2 | 20 | ISO 19011, ISO/IEC 27001, ISO/IEC 42001 | 8 | 0 |
| AIMS-IA | 1.1 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 1.2 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 1.3 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 1.4 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 1.5 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 2.1 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 2.2 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 2.3 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 2.4 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 2.5 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 2.6 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 2.7 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 3.1 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 3.2 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 3.3 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 3.4 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 3.5 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 3.6 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 3.7 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 3.8 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.1 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.2 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.3 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.4 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.5 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.6 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.7 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.8 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.9 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.10 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.11 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.12 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 4.13 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 5.1 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 5.2 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 5.3 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 5.4 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 5.5 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 5.6 | ZERO | 0 | 0 | - | 8 | 0 |
| AIMS-IA | 5.7 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 1.1 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 1.2 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 1.3 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 1.4 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 1.5 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 1.6 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 1.7 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 2.1 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 2.2 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 2.3 | ZERO | 0 | 0 | - | 7 | 1 |
| ISMS-F | 2.4 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 2.5 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 2.6 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 2.7 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 2.8 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 2.9 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.1 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.2 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.3 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.4 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.5 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.6 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.7 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.8 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.9 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.10 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 3.11 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.1 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.2 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.3 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.4 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.5 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.6 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.7 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.8 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.9 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.10 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.11 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.12 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 4.13 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 5.1 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 5.2 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 5.3 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 5.4 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 5.5 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 5.6 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 5.7 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 5.8 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-F | 5.9 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 1.1 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 1.2 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 1.3 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 1.4 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 1.5 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 2.1 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 2.2 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 2.3 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 2.4 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 2.5 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 2.6 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 2.7 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 3.1 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 3.2 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 3.3 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 3.4 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 3.5 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 3.6 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 3.7 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 3.8 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 3.9 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 4.1 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 4.2 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 4.3 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 4.4 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 4.5 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 4.6 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 4.7 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 4.8 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 4.9 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 4.10 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 5.1 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 5.2 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 5.3 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 5.4 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 5.5 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 5.6 | ZERO | 0 | 0 | - | 8 | 0 |
| ISMS-IA | 5.7 | ZERO | 0 | 0 | - | 8 | 0 |

