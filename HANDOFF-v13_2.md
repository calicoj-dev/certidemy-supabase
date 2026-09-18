# HANDOFF v13.2 — two questions sharing one list

2026-09-17, closing. The arc is done. This records the last defect found, which
is the same shape as the first, and the one thing I got wrong about it.

---

## 1. The defect: `PUBLISHED_BLOCKS` was answering two questions

`guide-runs.mjs` ended:

```js
if (PUBLISHED_BLOCKS.has(type)) out.push({ type, body, openAbs });
```

`PUBLISHED_BLOCKS` is `hook, concept, callout, summary, deep-dive`. It answers
**"what does a partner receive"**, it is correct, and it is duplicated
deliberately in `functions/_shared/lesson-blocks.ts` — `::checkpoint` and
`::interactive` are absent because they carry answer keys.

It was also answering **"what must a human review"**, and those are not the same
question. Seven consumers were built on it.

**54 repaired English spans across 44 lessons** sat in `::checkpoint` or
`::interactive`. Their translations were never re-translated, never classified,
never queued.

**The English half reached them perfectly.** `gen-lesson-repair-spec` uses its
own line scan and `apply-marking-spec` splices by absolute line index — neither
goes through `blocks()`. That is why it was invisible: *every English repair
looked complete because it was complete.*

**The exposure was bounded and the filter was right about its own question.**
Unpublished blocks never leave the function, so no partner could receive a stale
one. What a learner reads is another matter, and that is where these lived.

---

## 2. The fix, and which consumers changed

`blocks(md, { scope })` keeps its meaning; `reviewBlocks(md)` is everything.

**Changed to `reviewBlocks`** — every path that decides what a human looks at, or
rewrites a translation:

```
audit-review-gate            check-attribution-parity
retranslate-repaired-passages    triage-held-paragraphs
fix-modal-inflation          sweep-modal-inflation
restore-quote-markers
```

**Left on `blocks()`**: `measure-blockquote-omission`, which explicitly models
what the MCP omits. `gen-bilingual-queue`, `gen-setoff-spec` and
`list-authoring-candidates` are untouched and superseded.

### The scope change moved the coordinate space, which would have been next

Including `::checkpoint` shifts every block index. The audit's `fresh` lookup was
keyed on `block_index|line_index` from specs written in the **old** space, so it
would have missed every entry and reported the whole corpus as never
re-translated — loudly, and wrongly. Rekeyed on `line_abs`, which is absolute,
scope-independent, and already what `apply-marking-spec` splices on.

---

## 3. The durable property: an unlocatable span is now a failure

`coordOf` returning null used to `continue`. That is how 54 paragraphs stayed
outside every review for a week — the audit reported what it could see and said
nothing about what it could not.

It now fails the run, and **it earned itself within a minute of existing:**

- **2 spans were `::concept title="..."` lines.** `blocks()` starts a body on the
  line *after* the opener, so a repaired title sat outside every block — a second
  instance of the same class, found by the assertion rather than by anyone
  looking. Fixed with a raw-line fallback: a paragraph no longer has to live in a
  block at all.
- **2 were superseded, not missing** — `m4a-fix` replaced `m4a`'s clause 6.1.2
  recast. Detected by **containment**, not equality: a correction re-anchors on
  *part* of what it replaces, and the exact-match version reported a superseded
  span as an invisible one.

The audit now reads *every repaired span located, 2 superseded.*

---

## 4. What the gap was hiding, and what was done about it

| | before | after |
|---|---|---|
| repaired paragraphs inside gated rows | 780 | **888** |
| recorded as pre-repair | 58 across 35 rows | **123 across 68 rows** |

Of the 65 newly visible, **63 selected, 60 applied across 49 rows, 3 refused.**

**Scoped with a new `--only` flag**, and that mattered: scoping by slug would have
re-translated every repaired paragraph in those lessons — **including the 15 you
hand-corrected hours earlier**, replacing settled human wording with a fresh
completion. The flag restricts a run to the exact paragraphs a queue file names.

---

## 5. A correction to what I told you

I reported the convention census as *"`convém` is still zero across both auditor
certifications' Portuguese after this pass."*

**It was taken before the pass, not after.** The inflation fixer's own prompt
already said *"English SHOULD → convém que… NEVER deve"*, and it worked:

| | before | after the fixer | after tonight |
|---|---|---|---|
| AIMS-IA / pt-BR | 0 | 39 | **43** |
| ISMS-IA / pt-BR | 0 | 13 | 13 |

So the zero was never the translator failing to reach the convention. It was the
**re-translator's prompt not asking** while the fixer's did. Your conclusion was
right; the number I gave for it was stale. The modal table is now in the
re-translator's prompt with `convém que` named as preferred over `deveria`.

---

## 6. State

Every ISO certification: **0 refused, longest run 9w** against a threshold of 10.
479 lesson groups coherent. Marker parity 0 of 243, address parity 0 of 104.
Modal inflation 1, and that 1 is the known false positive.

**Written and not run:**

- `339_task_translation_reviews.sql` — ISMS-F's 98 task KSA translations cleared
  through a reviews table on 335's pattern
- `340_bilingual_queue_reviews.sql` — the 35 rows you reviewed, recorded the same
  way

They are independent; either order works. Both leave the provisional flag TRUE
and let an approved review with a matching `en_hash` open the gate, so a later
English edit re-closes it.

**Open:**

1. The **123 paragraphs across 68 rows** now in `BILINGUAL-QUEUE-2.json` — 58 of
   which you have already worked. The remainder is the newly visible set, now
   re-translated but not read.
2. **3 refusals** from tonight's run, and the ~20 standing held paragraphs.
3. **Two guard gaps recorded and not patched**: compound `poder`
   (`habría podido`), and English `required` counting as strong while
   `necesario` is deliberately narrowed. The second is a designed
   cross-language asymmetry and fixing it means choosing which side to narrow.
4. `ksa_withheld` is live in `mcp.task` and returned by the function; ISMS-F's
   Spanish KSAs stay dark until 339 runs.

---

## 7. What to distrust

Section 6 was read from the live rows. Everything else is a count I took while
working, and this session produced **four** numbers that were wrong because a
tool answered a different question than the one asked: a 1000-row page cap read
as a total, a per-line run count read as the gate's, a missing designation
reported for a quotation whose designation was present, and a census taken before
the pass it was describing.

Every one was caught by an assertion. **None was caught by re-reading.**

```
node --dns-result-order=ipv4first scripts/scan-iso-leaks.mjs
node --dns-result-order=ipv4first scripts/audit-review-gate.mjs
node --dns-result-order=ipv4first scripts/check-attribution-parity.mjs
node --dns-result-order=ipv4first scripts/measure-unreachable-paragraphs.mjs
node --dns-result-order=ipv4first scripts/measure-ksa-review-cost.mjs
```

Read-only without `--apply`. Each carries a control that must fail if the
instrument is broken — which is the only reason any number above is worth
reading.
