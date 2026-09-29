# Is the options probe measuring a shape cue, or its own knowledge of 42001?

PROMPT-94 s2. The director's hypothesis, tested read-only under a $3.00 cap.

## The test

Each option was reduced to its letter, its length in characters, its word count and its FIRST TWO WORDS.
No option text, no stem. Blindness is asserted structurally per payload, not assumed: the property names
must match an allowlist and three or more words of any option leaking is an error.

## Result

| | rate | |
|---|---|---|
| shape-only hit rate | **50%** (10/20) | the measurement |
| uniform chance | 25% | 1/options, averaged |
| best fixed letter | 55% | always answer A -- **the floor a guesser can actually reach** |
| rotated-label control | 55% (11/20) | same shapes, letters rotated |
| full probe, same items | 100% | every item here was flagged, which requires a key pick |

Spend: $0.31 over 40 calls.

## The 55 percent is not a letter bias

It happens to equal the best-fixed-letter rate, so that had to be checked rather than assumed.

| | A | B | C | D |
|---|---|---|---|---|
| keys in the sample | 11 | 3 | 6 | 0 |
| the model PICKED | 4 | 7 | 5 | 4 |
| its HITS, by key letter | 4 | 3 | 3 | 0 |

It picked A 4 times while 11 keys were A, and its hits are
spread across three letters. The rotated-label control settles it from the other side: it followed the
key's shape to the shape's NEW letter, which a letter bias cannot do.

## The subject is conditioned, so this is not a rate for the bank

These items are ones the FULL probe FLAGGED -- selected for already being suspected of a cue. 55 percent
on flagged items is not 55 percent on all items, and reporting it as a property of the bank would be the
wrong-population error this repository records four times over.

## What this cannot say

A result near chance does NOT prove the full probe is only knowledge. It proves the cue is not in the four
features kept here. A cue living in the option texts' phrasing -- three options sharing a clause, one
option the only negation -- is invisible to this payload BY CONSTRUCTION, and those are the cues the full
probe names most often. This bounds one family: the cue a candidate could exploit without reading at all.

## Per item

| item | task | key | picked | hit | control key | control pick | control hit | full-probe cue |
|---|---|---|---|---|---|---|---|---|
| `74b18e4a` | 2.2 | C | C | **hit** | B | B | **hit** | `odd-verdict` |
| `1f6aed28` | 2.2 | B | B | **hit** | A | A | **hit** | `odd-verdict` |
| `c20a3808` | 2.2 | A | A | **hit** | D | D | **hit** | `only-hedged` |
| `48064135` | 2.2 | B | B | **hit** | A | A | **hit** | `only-negation` |
| `81ddd809` | 2.2 | C | D | miss | B | B | **hit** | `only-hedged` |
| `63e98f56` | 2.4 | A | D | miss | D | C | miss | `odd-verdict` |
| `6ea4afde` | 2.4 | A | B | miss | D | A | miss | `only-hedged` |
| `689452e1` | 2.4 | A | C | miss | D | B | miss | `shared-phrase` |
| `7e485e04` | 2.7 | A | A | **hit** | D | D | **hit** | `odd-verdict` |
| `b938cea5` | 2.7 | C | D | miss | B | C | miss | `shared-phrase` |
| `551ea490` | 2.7 | A | A | **hit** | D | D | **hit** | `shared-phrase` |
| `778b6a16` | 2.7 | B | B | **hit** | A | A | **hit** | `shared-phrase` |
| `3d10a844` | 2.7 | C | C | **hit** | B | B | **hit** | `length` |
| `12b09f86` | 2.8 | C | B | miss | B | A | miss | `length` |
| `bc555466` | 2.8 | A | B | miss | D | B | miss | `shared-phrase` |
| `006aa6eb` | 2.8 | A | D | miss | D | C | miss | `length` |
| `18effc32` | 2.8 | C | C | **hit** | B | B | **hit** | `odd-verdict` |
| `977bd4ff` | 3.1 | A | A | **hit** | D | D | **hit** | `length` |
| `535a136c` | 3.1 | A | B | miss | D | A | miss | `only-negation` |
| `e4a5ba5e` | 3.2 | A | C | miss | D | B | miss | `odd-verdict` |
