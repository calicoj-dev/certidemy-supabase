# Grounding orphans, and whether every anchor is still primary

**Read-only.** Ruled PROMPT-87 s2.

## Orphans

Secure items with `item_origin = 'generated'`: **34**. Of those, **0** have no `item_grounding` row.

An orphan is invisible to the anchor-cap census, which reads `item_grounding` to learn what a task
already carries -- so a later run can add keys to a clause the census reports as empty.

**None.**

## Is each existing anchor still primary?

**34 grounding row(s); 2 whose anchor is not primary for its task.**

This is not a defect in the item. `passagesFor` used to feed the writer the ranker's set while roles
came from `task_sources`, and roles have moved twice since -- the AIMS-F re-role and the 1.3 promotion.

| item | cert | task | source | clause | role now |
|---|---|---|---|---|---|
| `333a50d8` | AIMS-F | 4.3 | 42001 | `B.2.3` | **supporting** |
| `a287616d` | AIMS-F | 4.4 | 42001 | `B.6.2.6` | **supporting** |

