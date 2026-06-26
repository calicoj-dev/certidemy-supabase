# Lesson Authoring Spec — v1.2 Addendum: The Projection Rule

**This is an additive amendment to `LESSON_AUTHORING_SPEC.md` (v1.1).** It adds
one mandatory post-authoring step and one validation rule. No existing section
changes; the section-type count stays at 8. Bump the spec header to **v1.2** and
append the changelog entry at the bottom of this file into the spec's changelog.

---

## New §12 — Frontmatter projection into join tables (MANDATORY)

A lesson declares its relationships **twice**, and both must agree:

1. In its **frontmatter** (`concept_slugs`, `task_codes`) — the human-authored
   source of truth, inside `content_md`.
2. As **rows in the join tables** `lesson_concepts (lesson_id, concept_id, weight)`
   and `lesson_tasks (lesson_id, task_id)` — what the running system actually
   queries.

The join-table rows are a **projection** of the frontmatter. The frontmatter
alone is inert: the review→lesson link, coverage reports, and the traceability
matrix all read the **join tables**, not the frontmatter text. A lesson whose
frontmatter is correct but whose join rows are missing is **incomplete** — its
questions cannot resolve "review where this is covered," and the certification
has a hole in its traceability matrix.

### The rule

> **After authoring or importing any lesson, its `concept_slugs` and
> `task_codes` MUST be projected into `lesson_concepts` and `lesson_tasks`.**
> A lesson with zero rows in either table is not done.

### How to project

Run the standard projection control — `supabase\scripts\wire-lessons.mjs` — for
the cert. It is cert-agnostic (`CERT_ID`), idempotent (re-running only fills
gaps), dry-run-capable (`DRY_RUN=1`), reads each lesson's frontmatter, resolves
slugs→concept ids and codes→task ids **scoped to that cert**, and writes the join
rows for every language row sharing a `lesson_group_id`. It also **reports any
slug/code that does not resolve** to a real concept/task — surfacing authoring
errors instead of dropping them silently.

```powershell
cd C:\Users\Juan\Documents\certidemy\supabase
$env:CERT_ID="<cert-uuid>"; $env:DRY_RUN="1"; node scripts\wire-lessons.mjs   # inspect
$env:DRY_RUN="0"; node scripts\wire-lessons.mjs                               # apply
```

### Why this is mandatory (the history)

Both finished certs shipped with this step skipped:
- **SM-AI-I**: its 6 AI lessons (originally Module 6, re-homed in migration 052)
  were inserted without projection — their questions had no review→lesson link
  until migration 055 wired them by hand.
- **SPO-AI-I**: **all 132** lesson rows were unprojected — every task read
  `lessons_teaching = 0` until `wire-lessons.mjs` projected all 396 concept links
  and 132 task links.

The projection step is the single thing that was missed, twice. This rule exists
so it is never missed again — most importantly for every cert authored after this
one.

### Frontmatter must use CURRENT task codes

`wire-lessons.mjs` resolves `task_codes` against the live `tasks.code` values for
the cert. If tasks are renumbered (e.g. a domain remap), the lesson frontmatter
`task_codes` become **stale** and will appear in the script's UNRESOLVED report.
Stale frontmatter does not break a running system whose join rows were fixed by
hand, but it makes the authoring source-of-truth disagree with the DB — a real
inconsistency to clean up. When you renumber tasks, rewrite the affected lessons'
frontmatter `task_codes` in `content_md` to the new codes, then re-run the
projection.

---

## Validation checklist additions (§9)

Add to the **Structure** block:

- [ ] After authoring, `wire-lessons.mjs` was run for the cert (dry-run reviewed,
      then applied).
- [ ] The lesson has **≥1 row in `lesson_concepts`** and **≥1 row in
      `lesson_tasks`** (the projection landed).
- [ ] `wire-lessons.mjs` reported **zero UNRESOLVED** `concept_slugs` /
      `task_codes` for this lesson (every frontmatter tag resolves to a real
      concept/task at current codes).

---

## Changelog entry (append to the spec's §11 changelog)

- **1.2** (June 2026) — Added §12, the **projection rule**: a lesson's frontmatter
  `concept_slugs` / `task_codes` MUST be projected into `lesson_concepts` /
  `lesson_tasks` via `wire-lessons.mjs` after authoring; a lesson with zero rows
  in either is incomplete. Added three validation-checklist items (§9). This is
  coverage-traceability evidence for the ISO/IEC 17024 framework — the
  review→lesson link and the traceability matrix both depend on it. Additive;
  no existing section or the section-type count changes.
