# AIMS-F rollout: the per-task shortfall

**The floor is PER TASK**, derived as `min(8, 2 x effective primaries)`. Ruled
PROMPT-94 s4: a task with three effective primaries gets a floor of 6, because three clauses at the
cap of 2 is six items. The rule lives in TASK-FLOORS-AIMSF.json; the number is derived, so a
task that gains a primary returns to 8 with no edit anywhere.

**Read-only.** Ruled PROMPT-87 s5. Kept items count only up to the cap of 2 per
(source, clause); the 15 provisional items count as
ZERO until ruled on. Scope is 4+ effective primaries and a shortfall above zero,
with no task excluded.

| task | kept | usable | over cap | inserted | provisional | have | shortfall | eff. primaries | in scope |
|---|---|---|---|---|---|---|---|---|---|
| 1.1 | 3 | 3 | 0 | 5 | 0 | 8 | **0** | 5 | no |
| 1.2 | 2 | 1 | 1 | 5 | 1 | 6 | **2** | 7 | **yes** |
| 1.3 | 1 | 1 | 0 | 7 | 0 | 8 | **0** | 11 | no |
| 1.4 | 2 | 2 | 0 | 6 | 1 | 8 | **0** | 11 | no |
| 1.5 | 2 | 2 | 0 | 7 | 1 | 9 | **0** | 12 | no |
| 1.6 | 3 | 3 | 0 | 6 | 1 | 9 | **0** | 12 | no |
| 2.1 | 3 | 1 | 2 | 5 | 0 | 6 | **0** | 3 | no |
| 2.2 | 4 | 1 | 3 | 7 | 0 | 8 | **0** | 5 | no |
| 2.3 | 8 | 5 | 3 | 3 | 0 | 8 | **0** | 8 | no |
| 2.4 | 7 | 2 | 5 | 5 | 0 | 7 | **1** | 5 | **yes** |
| 2.5 | 6 | 3 | 3 | 7 | 1 | 10 | **0** | 20 | no |
| 2.6 | 6 | 1 | 5 | 7 | 0 | 8 | **0** | 7 | no |
| 2.7 | 8 | 1 | 7 | 7 | 0 | 8 | **0** | 6 | no |
| 2.8 | 2 | 1 | 1 | 8 | 1 | 9 | **0** | 5 | no |
| 3.1 | 5 | 1 | 4 | 10 | 1 | 11 | **0** | 8 | no |
| 3.2 | 7 | 3 | 4 | 5 | 0 | 8 | **0** | 5 | no |
| 3.3 | 7 | 3 | 4 | 5 | 0 | 8 | **0** | 17 | no |
| 3.4 | 6 | 1 | 5 | 8 | 0 | 9 | **0** | 5 | no |
| 3.5 | 5 | 1 | 4 | 7 | 0 | 8 | **0** | 9 | no |
| 3.6 | 2 | 2 | 0 | 5 | 5 | 7 | **1** | 11 | **yes** |
| 3.7 | 2 | 2 | 0 | 7 | 0 | 9 | **0** | 10 | no |
| 3.8 | 7 | 4 | 3 | 4 | 0 | 8 | **0** | 4 | no |
| 4.1 | 5 | 4 | 1 | 2 | 0 | 6 | **2** | 4 | **yes** |
| 4.2 | 7 | 2 | 5 | 4 | 0 | 6 | **0** | 3 | no |
| 4.3 | 5 | 5 | 0 | 3 | 0 | 8 | **0** | 9 | no |
| 4.4 | 3 | 3 | 0 | 5 | 1 | 8 | **0** | 13 | no |
| 4.5 | 6 | 4 | 2 | 4 | 0 | 8 | **0** | 9 | no |
| 4.6 | 5 | 4 | 1 | 5 | 1 | 9 | **0** | 8 | no |
| 4.7 | 1 | 1 | 0 | 9 | 0 | 10 | **0** | 6 | no |
| 5.1 | 6 | 2 | 4 | 7 | 1 | 9 | **0** | 5 | no |
| 5.2 | 5 | 2 | 3 | 4 | 0 | 6 | **0** | 3 | no |
| 5.3 | 7 | 4 | 3 | 3 | 0 | 7 | **1** | 4 | **yes** |
| 5.4 | 7 | 2 | 5 | 3 | 0 | 5 | **1** | 3 | **yes** |
| 5.5 | 3 | 3 | 0 | 0 | 0 | 3 | **5** | 34 | **yes** |
| 5.6 | 3 | 3 | 0 | 5 | 0 | 8 | **0** | 10 | no |

**7 task(s) in scope, 13 item(s) to generate.** 0 task(s) have a shortfall but fewer than 4 effective primaries and wait for a map ruling.

