# Pilot 4 de-cue, re-gated under the new rules

`scripts/regate-pilot4-decue.mjs`, read-only, **no model calls**. The new rules are applied to the
rewrites already recorded in `PILOT-4-DECUE-REVIEW.json`, which is the delta discipline: new instrument, old
input, one thing changed at a time. Re-generating would change the rules AND the text and make the
result attributable to neither.

| | |
|---|---|
| applied in the recorded run | 21 |
| **KEEP under the new rules** | **4** |
| REVERT under the new rules | 17 |
| already reverted, unchanged | 3 |

## Decisions

| task | decision | trigger cue | after | why |
|---|---|---|---|---|
| 1.1 | **REVERT** | - | - | no code shape cue on the original: under the new trigger this rewrite would never have been attempted (probe-only trigger) |
| 1.4 | **REVERT** | key-length, only-hedged | only-hedged | check 4: the triggering cue only-hedged did not clear |
| 2.2 | **KEEP** | clang | - | code cue clang cleared, no new cue, limiters intact |
| 2.5 | **REVERT** | clang | - | check 5: limiter dropped -- option 1 lost "before"; option 3 lost "until" |
| 2.6 | **REVERT** | - | clang | no code shape cue on the original: under the new trigger this rewrite would never have been attempted (probe-only trigger) |
| 2.7 | **KEEP** | clang | - | code cue clang cleared, no new cue, limiters intact |
| 2.8 | **REVERT** | clang | opposite-pair | check 3: new code cue opposite-pair that the original did not carry |
| 3.1 | **REVERT** | - | - | no code shape cue on the original: under the new trigger this rewrite would never have been attempted (probe-only trigger) |
| 3.2 | **REVERT** | - | - | no code shape cue on the original: under the new trigger this rewrite would never have been attempted (probe-only trigger) |
| 3.3 | **REVERT** | - | - | no code shape cue on the original: under the new trigger this rewrite would never have been attempted (probe-only trigger) |
| 3.4 | **REVERT** | clang | - | check 5: limiter dropped -- option 3 lost "until" |
| 3.6 | **REVERT** | clang | - | check 5: limiter dropped -- option 2 lost "without" |
| 3.7 | **REVERT** | - | - | no code shape cue on the original: under the new trigger this rewrite would never have been attempted (probe-only trigger) |
| 3.8 | **REVERTED** | - | - | rejected |
| 4.1 | **REVERT** | clang, odd-verdict | clang | check 4: the triggering cue clang did not clear |
| 4.2 | **REVERTED** | - | - | 1 new absolute(s): any |
| 4.3 | **REVERT** | clang | clang | check 4: the triggering cue clang did not clear |
| 4.5 | **REVERT** | only-hedged | only-hedged | check 4: the triggering cue only-hedged did not clear |
| 4.6 | **KEEP** | clang | - | code cue clang cleared, no new cue, limiters intact |
| 5.1 | **REVERT** | - | - | no code shape cue on the original: under the new trigger this rewrite would never have been attempted (probe-only trigger) |
| 5.1 | **REVERT** | - | - | no code shape cue on the original: under the new trigger this rewrite would never have been attempted (probe-only trigger) |
| 5.2 | **KEEP** | key-length | - | code cue key-length cleared, no new cue, limiters intact |
| 5.2 | **REVERT** | - | - | no code shape cue on the original: under the new trigger this rewrite would never have been attempted (probe-only trigger) |
| 5.4 | **REVERTED** | - | - | rejected |

## Why so many revert

The dominant reason is the TRIGGER, not the rewrites: an item with no code shape cue would never
have been rewritten under the new rule, because the options probe no longer triggers anything. The
probe scored the authored bank at 98 percent, so it reads examiner convention rather than a defect,
and rewriting to satisfy it produced parallel distractors that it flagged anyway.

