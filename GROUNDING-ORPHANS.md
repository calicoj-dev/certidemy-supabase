# Grounding orphans, and whether every anchor is still primary

**Read-only.** Ruled PROMPT-87 s2.

## Orphans

Secure items with `item_origin = 'generated'`: **35**. Of those, **0** have no `item_grounding` row.

An orphan is invisible to the anchor-cap census, which reads `item_grounding` to learn what a task
already carries -- so a later run can add keys to a clause the census reports as empty.

**None.**

## Is each existing anchor still primary?

**35 grounding row(s); 0 whose anchor is not primary for its task.**

This is not a defect in the item. `passagesFor` used to feed the writer the ranker's set while roles
came from `task_sources`, and roles have moved twice since -- the AIMS-F re-role and the 1.3 promotion.

**All anchors are still primary.**

