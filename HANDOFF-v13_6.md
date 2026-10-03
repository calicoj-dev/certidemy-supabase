# HANDOFF v13.6 — the (source, edition, clause) re-key starts here

**Written 2026-10-01, end of PROMPT-101.** Covers everything after `HANDOFF-v13_5.md`.

> **ON THE NAME.** PROMPT-101 asked for `HANDOFF-v9_8.md`. **That name was taken** — by a document dated
> 2026-09-11 about SM-AI-II getting a bank — and I overwrote it before noticing, destroying 354 lines.
> Restored from git, intact. The live sequence is at v13_5, so this is v13_6.
>
> Worth one line, because it is this repository's own rule about second copies pointed at a FILENAME: I took
> a name on the director's say-so without asserting it was free, and `Write` on an existing path is a silent
> overwrite. The tell was in front of me — the tool said *updated*, not *created* — and what actually caught
> it was `git status` showing `M` where `??` belonged. The next session begins with section 3 of this document. Everything
above it is state, so the re-key starts from a known position rather than from a reconstruction.

**Why there is a handoff at all:** the re-key touches 46 call sites on the path that writes examination items,
and a partially re-keyed generator is the dangerous intermediate state — some lookups keyed, some not, and the
gates silently comparing different things. That is worse than either end state. It needs a session that starts
with it.

---

## 1. Where AIMS-F stands

### The completion table, per PROMPT-100 s1a

```
tasks at floor on REVIEWED items    11 of 35      156 accepted grounded + 83 kept authored
tasks at floor on ACCEPTED alone     2 of 35
tasks at floor on HAVE (every inserted row + kept)  29 of 35
still short on HAVE: 1.2(6/8) 2.4(7/8) 4.1(6/8) 5.3(7/8) 5.4(5/6) 5.5(4/8)
```

**The three numbers answer three different questions and none substitutes for another.** REVIEWED is the
headline: a kept authored item was ruled *keep* in an earlier prompt, which is a director verdict in its own
right, and an accepted grounded row carries one on the row. They cannot be counted the same way — a kept
authored item has **no `item_grounding` row at all**, because that table is grounded-items-only, so
`keptUsable` from the shortfall is the only record it can have.

The gap from 11 to 28 is the 34 rows carrying `read`, which count toward neither until ruled (section 2).

### The bank

```
grounded English rows        192
review_verdict               accept 156   read 34   reject 1   none 1
status                       pending_review 191, rejected 1
is_exam_scope                true 191, false 1 (the rejected row)
pool / visibility            secure / secure on all 192
solver verdict recorded      192 of 192
translations                 0 — every grounded row is English-only, no question_group_id
```

Nothing grounded is servable: `generate-mock-exam` filters `status='approved'` exactly, and nothing is approved.

### The library

38 ISO/IEC 42001 Annex A overrides, including **A.5.4**, recovered from character coordinates in PROMPT-98 s3 —
`pdfplumber` reads zero pages of that PDF, `pypdfium2` reads all 62. 2,386 passages across 14 (source, edition)
pairs.

---

## 2. Ruled, and pending a ruling

### Ruled and done

| | |
|---|---|
| migration 379 | the review columns on `item_grounding`; `item_reviews` was never needed |
| migration 385 | the verdict vocabulary gains `accept` and `reject` |
| 157 verdicts | 46 R4/R5 accepts, 111 backfilled from the artifacts, 1 reject |
| exam scope | every grounded row except the rejected one |
| `f92232b5` | `status=rejected`, `is_exam_scope=false`, verdict `reject` — the collision row |
| A.5.4 | repaired; the one item anchored on it passes `verbatim` |
| the 10 R4/R5 rejects + the reserve | in `AIMSF-DIRECTOR-REJECTIONS.json` and `AIMSF-ARTIFACT-DISPOSITIONS.json` — **they have no `item_grounding` row because they were never inserted** |

### Pending the director's ruling

**`AIMSF-PILOT-READ.md` — 35 items, accept or reject per id.** Gitignored; Juan attaches it from disk. 34 rows
carrying `read` plus `602cab35`, which carries none and is a survivor of `PILOT-AIMSF-TASK-1-3-R2.json`, an
artifact no prompt ever ruled on. Each entry has the stem, four options with the key marked, the explanation,
the anchor, and five gates re-run against the current library.

> **One failure, and it is not a bad item.** `9ecce8e5` stores an interleaved `key_support` — title and
> statement spliced — captured before A.9.3 was de-columned. The only passage still containing it is the
> container `A.9`. The likely repair is a **re-quote**, not a reject.

**`f92232b5`'s row itself** is rejected but not retired. Retiring is a separate act.

**The R6 / translation sequence** waits on the re-key (section 3).

---

## 3. THE RE-KEY — start here

### 3a. What exists already

**`scripts/lib/passage-key.mjs`**, committed in `3693f28`, with 10 controls, all passing:

```js
passageKey(sourceId, edition, clause)    // "ISO/IEC 42001|2023|A.5.4"
keyOfPassage(p)   parseKey(k)   labelOf(sourceId, edition, clause)
```

The controls that matter, by name: **42001 3.4 and 17021-1 3.4 must be different keys** (the collision that
cost one bank row and one R5 survivor); both editions of 27000 must differ; the 27002 annex shadow must key to
itself; the round trip; and — the direction that is easy to miss — **a missing component must not collapse two
passages together**.

The separator is **proved** absent rather than assumed: zero library passages carry a pipe in their source,
edition or clause across all 14 pairs. Worth the check — one edition is `27001:2022/Amd1:2024`, which contains a
colon, so a colon separator would have been wrong.

### 3b. The 46 call sites, by file and line

```
scripts/gen-grounded-items.mjs      373  451  482  484  499  500  502  504  676  703
                                    988  993 1007 1131 1133
scripts/lib/grounded-gates.mjs      251  265  342  369  376  401  402  795  796  797
                                    890  892  899  900  901  908  912  915  984  986
                                   1511 1512 1518 1519 1525 1526 1529 1530
scripts/lib/quote-noise.mjs         138
scripts/lib/anchor-cap.mjs           32   44   67
scripts/lib/anchor-assignment.mjs    67   84   88  161
```

By name, the things that must change:

- `mapByTask` — carry `{source_id, edition, clause}` per role, not a clause string
- `passagesByKey` — key on `passageKey(...)`, and **drop the single-standard filter**; that filter is what made
  the collision reachable, and removing it without re-keying first is the one ordering that must not happen
- `effectivePrimariesOf`, `passagesFor`, `passageOfClause`
- `anchorKey` in `anchor-cap.mjs` — currently `(source, clause)`, needs edition
- `assignAnchors` and the cap census — already pass `source_id`, so they need edition and the key helper
- the gates: `gateClauseExists`, `gateVerbatim`, `gateAnchorIsPrimary`, `gateQuoteNoise`
- `gateNearDuplicate` and the enemy-rule key
- `item_grounding` — `source_id` and `edition` are both already columns and already written; the gates are what
  ignore the pair

### 3c. The acceptance test — PROMPT-100 s2b, before anything generates

1. **Re-run every gate over every existing grounded artifact and every bank row. The verdicts must be
   identical**, except where an item was anchored through the collision. List those by id; expect only the
   three already rejected for it. *This is the test that makes the refactor safe: it is a no-op proof over 192
   bank rows and every artifact.*
2. **Collision controls**: 17021-1 3.4 and 42001 3.4 are different keys; an item anchored in one **fails**
   `anchor-is-primary` for a task whose primary is only the other.
3. **Index coverage**: `no-27000`, the reproduction index and the leak index must cover every source that is
   primary for any AIMS-F task. Name each source, its edition and its passage count.
4. **Glossary for 17021-1 and 42006**: certification body, surveillance audit, audit programme, impartiality
   and the rest, against the corpus, the way 22989 was done. Report what was added.
5. **`check-floor-vs-anchorable`** — target zero unreachable floors. Today 1.2 and 5.5 are unreachable
   *because* the generator can only anchor in one standard; that is what this refactor fixes.

### 3d. Then R6, then translation

- **R6**: tasks 1.2 and 5.5 only, ceiling **$10 checked against the HIGH end of the bracket**, checkpointing on,
  anchors assigned per item, **nothing inserted**. Output `AIMSF-ROLLOUT-R6.md` (gitignored, per 1e).
  - *The bracket exists because a flat per-item unit under-states a single-item scope: the writer is called once
    per TASK. Measured once at 22 percent low. `project-rollout-spend.mjs` prints both bounds and returns
    BRACKETED when the ceiling falls between them.*
- **Translation** (PROMPT-100 s3): **accepted items only** — `review_verdict = accept` with no `reserve:` note.
  Not the 34 `read` rows, not R6. Measure one task, project, and if the high end is $40 or less translate the
  scope as `pending_review` siblings sharing `question_group_id`, the same option ids and the same
  `correct_answer`. Glossary and translation lint; **Scrum terms stay English**; `fornecedor de IA` /
  `proveedor de IA`. Translate the explanation too, and check it names options **by content, never by letter** —
  the delivery shuffle changes the order. Read back 5 items per language in full. Nothing approved. Output
  `AIMSF-TRANSLATION-R1.md`.

---

## 4. Standing rules

1. **Push is manual.** Juan pushes.
2. **You run every build.** *(New, PROMPT-101.)* `npm run build` in `certidemy-web` before any web commit is
   reported ready-to-push — it includes `i18n:check`. `deno check` on any edge function you changed. Fix and
   re-run until green. **The deploy table carries a build-green column.** Juan's PowerShell is only `git push`,
   `supabase functions deploy <name> --dns-resolver https`, and SQL in the editor.
3. **Never print a key.**
4. **Don't make the MCP worker worse.**
5. **Name `status`, `visibility` and `is_exam_scope` on every write, then read the row back.**
6. **Licensed text stays gitignored.** Passages and anchors are internal only. **Now enforced by content**, not
   by name — see section 5.
7. **Commit messages go through the file tool.** `<<` is blocked by a hook; `node -e` halves backslashes and
   bash eats backticks, so code carrying either goes through the file tool too.
8. **End every report with the deploy table**: each repo's local HEAD, `origin/main`, the live
   `x-certidemy-build`, build-green at HEAD, and any function changed since its last deploy.

---

## 4b. Logged in passing, PROMPT-102 s2 (one line each, nothing inserted)

- The cap census omitted `edition`, so its keys could not match the assignment's and `assignAnchors`
  handed out clauses already at the cap. Fixed; `buildCapCensus` now takes `{standard, edition}`.
- Naming the standard in the writer's passage header made the writer copy it into
  `key_support_clause` ("9.6.3 (ISO/IEC 42006:2025)"). Forbidden in the prompt and stripped on ingest.
- A distractor citing a 42001 clause on a task anchored in 22989 resolved only in the item's scope and
  failed `clause-exists`. `sourceOfClause` now falls back to the passages shown, then the run's standard.
- **Task 5.5's primary map includes clause `1` (Scope) of both ISO/IEC 17021-1 and 42006.** Those are
  poor anchors and the writer mis-quotes them; a map decision, not a code defect.
- `rollout-shortfall` counted REJECTED rows toward floors (PROMPT-102 s1). Fixed.
- R6 spend this session: ~$10.8 of the $15 ceiling, across one invalidated 7-item run, the 13-item run,
  an 8-item top-up and a 1-item probe. **R6 is NOT closed: 5 survivors of 13 floors, nothing inserted.**

## 4c. Logged for ISMS-F onward (PROMPT-104 s4, not done)

- The writer anchors on **container clauses** of ISO/IEC 17021-1 (9.3.1.2, 9.6.3.1, 9.6.3.2) when its
  quotation sits verbatim in exactly one child; `verbatim` refuses, correctly, and it cost ~5 of R7's
  items. Fix: resolve a container citation to the single child holding the quote verbatim, or refuse
  when more than one child matches.

## 5. Open backlogs

| backlog | size | where |
|---|---|---|
| **i18n strings** | **88** | `certidemy-web/scripts/i18n-baseline.json`. Gated: `npm run build` fails on a NEW one. Largest group is the hand-rolled per-locale plural tables in `dashboard/page.tsx` and `voucher-status-pill.tsx` — already translated, built by concatenation rather than ICU |
| **provisional concept names** | **440** | `BACKLOG-CONCEPT-NAME-REVIEW.md`. 197 es-419 + 243 pt-BR. **ISMS-F is 382 of them** — the same 191 concepts in both languages — plus 47 pt-BR on AIE-I and nine strays. Served deliberately |
| **letter-reference explanations** | **41** | `BACKLOG-LETTER-EXPLANATIONS.md`. Correct today because practice does not shuffle; silently wrong the day it does |
| **licensed text already tracked** | **285 files** | `scripts/licensed-text-baseline.json`. Debt under the history ruling: may shrink, must never grow |
| **the rest of the rebuild order** | — | ISMS-F, then ISMS-IA, AIMS-IA, the Scrum certifications, then the AI-general ones. AIMS-F is the worked example and every instrument here was built on it |

### Two things the backlogs do not say

- **The gates are necessary, not sufficient.** Measured recall of the strongest instrument against the
  director's own read of 40 items was **7 of 14**, and 5 of the 9 that were a named defect in the key. A row
  clean on every gate can still have a wrong key.
- **A `.gitignore` matches names and the licensed-text rule is about content.** That is why
  `check-licensed-text.mjs` exists: two documents escaped by name in two rounds, and the 285-file baseline it
  found on its first run is the real scale — the two that were noticed were the two a human happened to read in
  a diff.

## PROMPT-106, open items

- **`roles-in-pt` fires on 573 pre-existing APPROVED pt-BR rows (6.1%), and the count is MIXED.** Read the
  members: the ISO sense (clause 5.3 "papéis, responsabilidades e autoridades", role categories) is a real
  defect, but "a non-technical office role" → `função de escritório` is idiomatic and `papéis` would be worse.
  So 573 is a candidate list, not a defect list. es-419 is 21. Untouched, awaiting a ruling.
- **Two live APPROVED English AIMS-F rows share one stem** — content id `ce40b907`, uuids `0be22fbf` and
  `dfe1788a`, "Which statement best describes what ISO/IEC 42001 specifies?". Ungrounded, so outside the
  grounded set and invisible to the approval path. One duplicate pair in 830 live English rows.
- **`item_grounding` has NO assigned-clause column**, so `anchor-assignment` is UNASSERTED for every stored
  row — a context gap, not a row property. The assignment exists only in the generation artifact.
- **`generate-mock-exam` filters `item_origin <> 'generated'`, which is NULL-propagating**: a row with
  `item_origin IS NULL` is excluded from every form. Use `is distinct from`. Function change, next deploy
  round (ruled PROMPT-107 s5). Latent on AIMS-F (0 NULL rows today).
- **`item_grounding` has no assigned-clause column.** Add it at the next migration so `anchor-assignment`
  becomes assertable on a stored row instead of UNASSERTED on all 200 (ruled PROMPT-107 s5).
- **`scripts/rollout-shortfall.mjs:144` calls `anchorKey("ISO/IEC 42001", cl)` with TWO arguments** where
  the passage key is `(source, edition, clause)`. The edition lands in the clause slot, so kept-item cap
  accounting keys on a different string than the generator does. Reporting only; found PROMPT-107.

## PROMPT-108: AIMS-F IS LIVE

Migration 386 added `item_origin='grounded'` (ruled PROMPT-108 s1; the CHECK read from `pg_catalog`
first, four values, 9 quote-segments). 600 rows retagged by group. Cutover applied 2026-10-03:
**361 per language = 200 grounded + 161 kept**, 351 rows retired, practice unchanged at 350/language,
20/20 forms assemble in all three languages. Invariant 14 guards the new origin and examines 600.

- **Rollback is one command** while `AIMSF-CUTOVER-RETIRED.json` stands:
  `node --dns-result-order=ipv4first scripts/rollback-cutover.mjs --apply` (351 ids, dry-verified).
- **Two origin conventions now coexist inside a group.** Authored groups are `en='authored'` +
  siblings `'translated'`; grounded groups are `'grounded'` in all three languages (ruled s1.2). Both
  are admitted by the filter, but anyone counting origins per language will see the asymmetry.
- The `generated` exclusion is now load-bearing for a reason it was not written for: it is what keeps
  `gen-grounded-items`' own drafts out of the pool until a human accepts them and the approver retags.

### OPEN, AND IT NEEDS A RULING: `verify-cert` AIMS-F now FAILS 8.1

`verify-cert --cert AIMS-F` = 53 pass, **4 fail**, 3 warn. Measured, not guessed:

| failure | caused by this work? |
|---|---|
| 8.1 length cue, escapes 4.4% (16/361) vs a >2.0% bar | **YES.** pre-PROMPT-107 the pool was 278 with 4 escapes = **1.4%, passing**. 13 of the 16 escapes are grounded items. |
| 8 secure floor >= 8/task/lang, 5.5 at 6 | partly: the cutover took 5.5 from 11 to 6. 6 IS the floor ruled in PROMPT-104; `verify-cert` hard-codes 8 and does not read `TASK-FLOORS-AIMSF.json`. |
| 8 all items approved (2) | no. `cdde7e6b` and `f92232b5`, both `status='rejected'`, never retired. |
| 8 every item belongs to a group (2) | no. the same two rows. |

**The cause of 8.1 is a gate of mine using the wrong comparand.** The length-cue arm added in PROMPT-102
tests the key against the **mean** of the distractors at 1.25x. The scheme's declared tolerance -- which
`item-cue-guard`'s `cueConfigFor` publishes and `verify-cert` reads -- is the key against the **max rival**
plus `max(KEY_LEN_MARGIN, KEY_LEN_PCT% of max rival)` (5ch/10% here). Items pass one and breach the other.
CLAUDE.md s13 records a THIRD form ("outside 60-160% of the median distractor"). One declaration exists and
the gate did not read it.

The 13 live grounded escapes, by uuid prefix, over-allowance in chars: `ce86479f` 21, `d6fc4d00` 20,
`1ea0ea64` 17, `c38d0298` 17, `bb2fcc40` 16, `00c565c9` 15, `6cbb6cdf` 15, `139c011a` 14, `3ca45f4c` 14,
`46a860d2` 14, `c55b92ae` 13, `d7e85bb2` 12, `9f905f3e` 11. The 3 authored ones are worse (87, 61, 59) and
are KEPT items that pre-date all of this.
