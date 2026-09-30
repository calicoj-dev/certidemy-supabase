# Why each AIMS-F task is still short

**Read-only. Nothing here is generated or inserted.** Ruled PROMPT-95 s5.

`MAP` means more attempts cannot help; `LUCK` means they can. The distinction is the one the ruling asks
for, split four ways because the artifacts support it -- and `reproduction` failing on EVERY attempt is
counted as MAP, not luck: three independent draws losing to one gate is a statement about the passages.

| task | floor | eff | have | short | attempted | survived | classification |
|---|---|---|---|---|---|---|---|
| 1.2 | 8 | 7 | 2 | 6 | 6 | 4 | **LUCK: THE DRAW REPEATED A PASSAGE** |
| 1.3 | 8 | 11 | 7 | 1 | 4 | 3 | **MAP: EXCLUDED BY THE SHORTFALL** |
| 1.5 | 8 | 12 | 7 | 1 | 7 | 6 | **LUCK: GATE LOSSES** |
| 1.6 | 8 | 12 | 7 | 1 | 7 | 6 | **LUCK: GATE LOSSES** |
| 2.2 | 8 | 5 | 7 | 1 | 7 | 6 | **LUCK: GATE LOSSES** |
| 2.4 | 8 | 5 | 6 | 2 | 7 | 5 | **LUCK: GATE LOSSES** |
| 2.5 | 8 | 20 | 6 | 2 | 6 | 4 | **LUCK: GATE LOSSES** |
| 2.7 | 8 | 6 | 7 | 1 | 7 | 5 | **LUCK: THE DRAW REPEATED A PASSAGE** |
| 2.8 | 8 | 5 | 7 | 1 | 7 | 6 | **LUCK: GATE LOSSES** |
| 3.1 | 8 | 8 | 5 | 3 | 9 | 7 | **LUCK: GATE LOSSES** |
| 3.4 | 8 | 5 | 6 | 2 | 8 | 6 | **LUCK: GATE LOSSES** |
| 3.7 | 8 | 10 | 7 | 1 | 7 | 6 | **LUCK: GATE LOSSES** |
| 4.1 | 8 | 4 | 6 | 2 | 4 | 1 | **LUCK: GATE LOSSES** |
| 4.2 | 6 | 3 | 5 | 1 | 3 | 2 | **MAP: NO HEADROOM** |
| 4.3 | 8 | 9 | 7 | 1 | 2 | 1 | **LUCK: GATE LOSSES** |
| 4.4 | 8 | 13 | 5 | 3 | 7 | 2 | **LUCK: GATE LOSSES** |
| 4.5 | 8 | 9 | 5 | 3 | 6 | 3 | **LUCK: QUOTATION FORMATTING** |
| 4.6 | 8 | 8 | 7 | 1 | 3 | 2 | **LUCK: GATE LOSSES** |
| 4.7 | 8 | 6 | 5 | 3 | 10 | 7 | **LUCK: GATE LOSSES** |
| 5.1 | 8 | 5 | 7 | 1 | 7 | 6 | **LUCK: GATE LOSSES** |
| 5.3 | 8 | 4 | 7 | 1 | 3 | 2 | **MAP: NO HEADROOM** |
| 5.4 | 6 | 3 | 5 | 1 | 5 | 3 | **LUCK: GATE LOSSES** |
| 5.5 | 8 | 34 | 4 | 4 | 9 | 3 | **LUCK: THE DRAW REPEATED A PASSAGE** |

### 1.2 -- short 6 of 8   [LUCK: THE DRAW REPEATED A PASSAGE]

- 1 of 2 losses were `anchor-cap` -- but the map's ceiling is 2 x 7 = 14 against a floor of 8, so the map is not short by a factor of 1.8x. The cap bound because the draw came back to a passage already used twice, which generating again fixes.
- action: **generate**
- map: 11 source row(s), 7 primary -- A.10.2, 5.19.5.1, 4.1, A.3.2, 5.19.3.1, 5.19.2.1, 5.19.1

### 1.3 -- short 1 of 8   [MAP: EXCLUDED BY THE SHORTFALL]

- the shortfall artifact marks this task not eligible -- 11 effective primary passage(s) against a floor of 8, and the floor is min(8, 2 x primaries). Its own verdict, not one recomputed here.
- action: **widen the map, not the generator**
- map: 24 source row(s), 13 primary -- A.6.2.4, A.6.2, C.3.6, A.6.2.7, A.6.2.3, B.6.2.1, A.6.2.8, A.6.2.2, ...

### 1.5 -- short 1 of 8   [LUCK: GATE LOSSES]

- 1 attempt(s) refused, 6 survived. 1x modal-fidelity + reproduction
- action: **generate**
- map: 22 source row(s), 13 primary -- 8.3.2, 8.3.3, 4.1, 8.3.1, 3.15, 8.2.2, 8.2.2, 4.2, ...
- every `reproduction` refusal, verbatim:
  - `63cc3ed9` anchored in 4.1: explanation: a 18-word run shared with 42001:2023 -- the ceiling is 9

### 1.6 -- short 1 of 8   [LUCK: GATE LOSSES]

- 1 attempt(s) refused, 6 survived. 1x reproduction
- action: **generate**
- map: 16 source row(s), 12 primary -- A.6.2.4, A.1, A.6.1.2, 3.4, A.6.1.3, D.1, 6.1.3, 6.1.4, ...
- every `reproduction` refusal, verbatim:
  - `4dc47729` anchored in A.6.2.4: explanation: a 16-word run shared with 42001:2023 -- the ceiling is 9

### 2.2 -- short 1 of 8   [LUCK: GATE LOSSES]

- 1 attempt(s) refused, 6 survived. 1x reproduction + structure
- action: **generate**
- map: 7 source row(s), 5 primary -- 4.1, A.10.3, 4.3, 4.4, 4.2
- every `reproduction` refusal, verbatim:
  - `85753d58` anchored in 4.1: explanation: a 14-word run shared with 42001:2023 -- the ceiling is 9

### 2.4 -- short 2 of 8   [LUCK: GATE LOSSES]

- 2 attempt(s) refused, 5 survived. 1x rejected by solver; 1x modal-fidelity + reproduction
- action: **generate**
- map: 7 source row(s), 5 primary -- A.10.2, A.3.2, 3.3, 5.3, A.3.3
- every `reproduction` refusal, verbatim:
  - `cd2cf085` anchored in A.10.2: explanation: the quotation names no clause -- an attributed quotation has to say what it is quoting

### 2.5 -- short 2 of 8   [LUCK: GATE LOSSES]

- 2 attempt(s) refused, 4 survived. 2x rejected by solver
- action: **generate**
- map: 25 source row(s), 21 primary -- C.2.2, 6.1.1, C.3.6, C.2.5, C.3.2, C.2.10, C.2.1, C.2.11, ...

### 2.7 -- short 1 of 8   [LUCK: THE DRAW REPEATED A PASSAGE]

- 1 of 2 losses were `anchor-cap` -- but the map's ceiling is 2 x 6 = 12 against a floor of 8, so the map is not short by a factor of 1.5x. The cap bound because the draw came back to a passage already used twice, which generating again fixes.
- action: **generate**
- map: 6 source row(s), 6 primary -- 8.4, 6.1.4, 3.24, 8.2, 6.1.2, A.5.2

### 2.8 -- short 1 of 8   [LUCK: GATE LOSSES]

- 1 attempt(s) refused, 6 survived. 1x rejected by solver
- action: **generate**
- map: 6 source row(s), 5 primary -- 8.3, 3.26, A.1, 6.1.1, 6.1.3

### 3.1 -- short 3 of 8   [LUCK: GATE LOSSES]

- 2 attempt(s) refused, 7 survived. 1x rejected by solver; 1x modal-fidelity + reproduction
- action: **generate**
- map: 13 source row(s), 8 primary -- C.2.2, A.4.6, 7.2, 7.1, A.4.2, A.4.3, A.4.5, A.4.4
- every `reproduction` refusal, verbatim:
  - `115b9d9e` anchored in C.2.2: explanation: a 19-word run shared with 42001:2023 -- the ceiling is 9

### 3.4 -- short 2 of 8   [LUCK: GATE LOSSES]

- 2 attempt(s) refused, 6 survived. 2x rejected by solver
- action: **generate**
- map: 6 source row(s), 5 primary -- A.10.2, 6.3, A.10.3, 6.1.3, 8.1

### 3.7 -- short 1 of 8   [LUCK: GATE LOSSES]

- 1 attempt(s) refused, 6 survived. 1x rejected by solver
- action: **generate**
- map: 20 source row(s), 10 primary -- 8.3, 7.4, 7.5.3, 7.2, 7.1, 7.3, 7.5.1, 7.5.2, ...

### 4.1 -- short 2 of 8   [LUCK: GATE LOSSES]

- 3 attempt(s) refused, 1 survived. 2x modal-fidelity + reproduction; 1x quote-noise + reproduction
- action: **generate**
- map: 14 source row(s), 6 primary -- 3.26, A.1, A.6.2, B.1, 6.1.3, A.6.1
- every `reproduction` refusal, verbatim:
  - `42a53576` anchored in 3.26: explanation: the quotation names no clause -- an attributed quotation has to say what it is quoting
  - `7fb7bcb3` anchored in 3.26: explanation: the quotation names no clause -- an attributed quotation has to say what it is quoting
  - `eb0f73a0` anchored in A.6.1: explanation: the quotation names no clause -- an attributed quotation has to say what it is quoting

### 4.2 -- short 1 of 6   [MAP: NO HEADROOM]

- 1 of 1 losses were `anchor-cap`, and the map's ceiling is 2 x 3 = 6, EXACTLY the floor. Every passage has to carry two items, so any single refusal is unrecoverable without widening the map.
- action: **widen the map, or accept that this task has no margin**
- map: 5 source row(s), 3 primary -- 3.26, A.1, 6.1.3

### 4.3 -- short 1 of 8   [LUCK: GATE LOSSES]

- 1 attempt(s) refused, 1 survived. 1x rejected by solver
- action: **generate**
- map: 23 source row(s), 10 primary -- A.2.4, A.2.3, A.3.2, A.4.6, A.4.2, A.3.3, A.4.3, A.4.5, ...

### 4.4 -- short 3 of 8   [LUCK: GATE LOSSES]

- 5 attempt(s) refused, 2 survived. 3x rejected by solver; 1x modal-fidelity + reproduction; 1x reproduction + shared-distractor-phrase
- action: **generate**
- map: 33 source row(s), 13 primary -- A.6.2.4, A.5.4, A.6.1.2, A.5.5, A.6.2.7, A.6.2.3, A.6.1.3, A.6.2.8, ...
- every `reproduction` refusal, verbatim:
  - `3bbfcc8a` anchored in A.6.2.7: explanation: the quotation names no clause -- an attributed quotation has to say what it is quoting
  - `cb582bad` anchored in A.5.3: explanation: the quotation names no clause -- an attributed quotation has to say what it is quoting

### 4.5 -- short 3 of 8   [LUCK: QUOTATION FORMATTING]

- all 3 attempt(s) lost to `reproduction`, and every refusal is the ATTRIBUTED-QUOTATION arm -- the explanation quoted the standard without naming the clause it was quoting. A formatting defect in the explanation, not a fact about the passages. Reading the gate's LABEL would have called this a map problem; reading its REASONS does not.
- action: **generate -- and the writer prompt should require the clause beside any quotation**
- map: 20 source row(s), 9 primary -- A.8.5, A.7.2, A.7.3, A.7.6, A.7.4, A.8.3, A.8.2, A.7.5, ...
- every `reproduction` refusal, verbatim:
  - `3245463e` anchored in A.8.5: explanation: the quotation names no clause -- an attributed quotation has to say what it is quoting
  - `f7726e84` anchored in A.8.3: explanation: the quotation names no clause -- an attributed quotation has to say what it is quoting
  - `944de960` anchored in A.7.6: explanation: the quotation names no clause -- an attributed quotation has to say what it is quoting

### 4.6 -- short 1 of 8   [LUCK: GATE LOSSES]

- 1 attempt(s) refused, 2 survived. 1x rejected by solver
- action: **generate**
- map: 21 source row(s), 10 primary -- A.10.2, A.1, A.9.4, A.10.4, A.10, A.9.2, A.10.3, 6.1.3, ...

### 4.7 -- short 3 of 8   [LUCK: GATE LOSSES]

- 3 attempt(s) refused, 7 survived. 1x shared-distractor-phrase + structure; 1x structure; 1x rejected by solver
- action: **generate**
- map: 16 source row(s), 6 primary -- 3.26, A.2.3, C.2.10, D.1, 6.1.3, D.2

### 5.1 -- short 1 of 8   [LUCK: GATE LOSSES]

- 1 attempt(s) refused, 6 survived. 1x rejected by solver
- action: **generate**
- map: 8 source row(s), 7 primary -- 3.11, 6.2, 3.13, 9.1, 3.19, 3.20, A.6.2.6

### 5.3 -- short 1 of 8   [MAP: NO HEADROOM]

- 1 of 1 losses were `anchor-cap`, and the map's ceiling is 2 x 4 = 8, EXACTLY the floor. Every passage has to carry two items, so any single refusal is unrecoverable without widening the map.
- action: **widen the map, or accept that this task has no margin**
- map: 4 source row(s), 4 primary -- 9.3.2, 10.1, 9.3.3, 9.3.1

### 5.4 -- short 1 of 6   [LUCK: GATE LOSSES]

- 2 attempt(s) refused, 3 survived. 1x rejected by solver; 1x quote-noise + reproduction
- action: **generate**
- map: 11 source row(s), 4 primary -- 10.2, 10.1, 3.17, 3.16
- every `reproduction` refusal, verbatim:
  - `4cc8c254` anchored in 3.17: explanation: the quotation names no clause -- an attributed quotation has to say what it is quoting

### 5.5 -- short 4 of 8   [LUCK: THE DRAW REPEATED A PASSAGE]

- 5 of 6 losses were `anchor-cap` -- but the map's ceiling is 2 x 34 = 68 against a floor of 8, so the map is not short by a factor of 8.5x. The cap bound because the draw came back to a passage already used twice, which generating again fixes.
- action: **generate**
- map: 52 source row(s), 36 primary -- 9.5.4, 1, 3.4, 9.1.3.3, 9.6.5, 9.6.3.2.5, 9.6.3.1.3, 1, ...
- every `reproduction` refusal, verbatim:
  - `75950345` anchored in 3.4: explanation: a 10-word run shared with 42001:2023 -- the ceiling is 9

## 4.5 in full: is its anchor text mostly definitions that cannot be paraphrased?

**No. The hypothesis is refuted on both halves, and the real reason is smaller and better news.**

**0 of 9 primary passages are clause-3 definitions.** Every
one is an Annex A control statement:

| clause | title | words | a clause-3 definition? |
|---|---|---|---|
| A.8.5 | Information for interested parties | 18 | no |
| A.7.2 | Data for development and enhancement of AI sys | 17 | no |
| A.7.3 | Acquisition of data | 19 | no |
| A.7.6 | Data preparation | 20 | no |
| A.7.4 | Quality of data for AI systems | 25 | no |
| A.8.3 | External reporting | 16 | no |
| A.8.2 | System documentation and information for users | 15 | no |
| A.7.5 | Data provenance | 30 | no |
| A.8.4 | Communication of incidents | 17 | no |

Lengths: min 15, max 30, mean 20 words.

**AND THE REFUSALS ARE NOT ABOUT LENGTH EITHER.** All three say the same thing, verbatim:

> the quotation names no clause -- an attributed quotation has to say what it is quoting

The `reproduction` gate allows ONE attributed quotation in the explanation and requires it to name
its clause. Three writers quoted the standard and did not name it. **That is a formatting defect in
the explanation, fixable by a redraft** -- the passages are not implicated at all, and 4.5 moves
from the SKIP list to the GENERATE list.

I had this wrong first, in the same direction the question was asked: my classifier read the gate's
LABEL -- `reproduction` on every attempt -- and told you the passages were unescapable text.
Reading the REASONS says otherwise. Reasoning from a label rather than from the members is the
defect this session has found in four separate instruments.

**The one thing worth acting on beyond generating:** three independent draws made the same
formatting mistake, which points at the writer prompt rather than at three unlucky writers. The
prompt should require the clause beside any quotation in the explanation.

