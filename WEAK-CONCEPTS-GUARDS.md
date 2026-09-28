# The three weak-concepts guards

PROMPT-84 section 4. Option 1 stands: `create_practice_questions` keeps inserting approved practice
items. These are the three parts that are cheap and live in this repository.

| guard | state |
|---|---|
| 1. `validateQuestion` shape | **DONE** -- in `functions/generate-practice-questions/index.ts` |
| 2. name every defaulted column | **WRITTEN** -- `migrations/381_practice_rpc_names_status.sql`, for Juan to run |
| 3. per-learner daily cap | **CANNOT BE BUILT AS SPECIFIED** -- the column it counts by does not exist |

---

## 1. Four options, one key, no `true_false` -- at every tier

`validateQuestion` enforced the shape rule **only when `tier >= 2`**. Below that it accepted
`true_false` and any option count from two upward, which is how a two-option item reached SM-AI-II
on 2026-09-12.

The fix is not to extend the tier branch, it is to delete it:

> **The shape rule now applies unconditionally.** `tier` is still taken as an argument and is
> deliberately not consulted for shape.

The reason is the one this repository already gave for putting the generated-item exclusion on both
pools: **a guarantee that depends on a second column staying true is not a guarantee.** `tier` is
read from the certification row, so a tier that is null, absent or mis-set silently downgraded the
check to *two or more options*. No certification here wants a two-option practice item, so the
conditional bought nothing and cost an incident.

Also tightened while in there: the four option ids must be DISTINCT. Four options with a duplicated
id passed the old length check and would have produced a key pointing at two options.

```
question_type    must be single_choice        (true_false refused at every tier)
options          exactly 4, with 4 distinct ids
correct_answer   exactly 1, and it must be one of those ids
difficulty       1..5
```

## 2. Every defaulted column named -- migration 381

Measured against the deployed function rather than the migration file:

```
select prosrc ~ 'status' from pg_proc where proname = 'create_practice_questions';   ->  false
```

| column | before | after |
|---|---|---|
| `pool` | `'practice'`, explicit | unchanged |
| `is_exam_scope` | `false`, explicit | unchanged |
| `visibility` | `'private'`, explicit | unchanged |
| **`status`** | **inherited from the column default** | **`'approved'`, stated** |

**`visibility` is `'private'` and not `'practice'`.** The ruling's shorthand said `'practice'`; the
pool's actual value is `'private'`, confirmed against the live rows rather than taken from the
instruction -- all 170 generated rows read `approved | practice | private | false`. The ruling said
to use the pool's actual value, and that is what it is.

So exactly one column was inherited, and it is the one that decides servability: `generate-mock-exam`
filters `status = 'approved'`. A change to that default would have moved every row this RPC writes,
in either direction, with nothing in the function changing.

**381 records current behaviour and changes none of it.** Writing `'pending_review'` here would split
the pool and change what a learner is served, which is CERTIDEMY-LEARNER-IA 5.5's decision. The value
is now a visible literal, so moving it later is an edit rather than a side effect.

Its post-conditions are a before/after checksum over every generated row, because a function replace
must move no data, plus both directions on the body: `status` present, AND none of `pool`,
`is_exam_scope`, `visibility`, `item_origin` lost while adding it.

## 3. The per-learner cap: no column to count by

> **`quiz_questions` has no `created_by`, no `author_id`, and no per-learner attribution of any kind.**

The full column list, read from the table:

```
id, certification_id, module_id, question_text, question_type, options, correct_answer,
explanation, difficulty, created_at, bloom_level, is_exam_scope, task_id, status,
question_group_id, language, pool, visibility, retired_at, retired_by, retire_reason,
bank_revision, supersedes_id, retired_vocabulary_intent, item_origin, updated_at
```

`retired_by` exists. Nothing records who a row was generated FOR or BY. So "60 generated items per
learner per UTC day, counted from `quiz_questions`" cannot be counted: the rows do not carry the
learner.

**Reported rather than solved, which is what the ruling asked for.** Two options, neither taken here:

- add a nullable `created_by uuid` to `quiz_questions` and have the RPC write the caller -- a schema
  change, and a new column on the item table pulls in the writer-list obligation this repository
  keeps paying for;
- cap in the edge function against a different surface entirely.

Both are decisions, not implementations. **The cap is NOT in place**, and that is the honest state
rather than a cap that counts nothing and reports success -- which is the vacuous-pass shape this
repository already records three times over.

The exposure it would have bounded is small today: **10 live generated items, all practice, none in
exam scope**, and 170 generated rows in total.
