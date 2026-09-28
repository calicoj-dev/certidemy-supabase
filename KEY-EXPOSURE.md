# The key-exposure incident: closed, swept, and what cannot be known

2026-09-27. Sections 1 to 3 of the ruling. **Section 1 deployed a change, so this stops at
ready-to-push and PROMPT-78 is not resumed.**

---

## 1 — Closed

`submit-quiz-answer`, deployed and proven on the **downloaded deployed body**, then re-measured as a
stranger:

| | before | after |
|---|---|---|
| secure item posted by id | **200, key + explanation returned** | **403**, no key, no attempt row |
| another learner's `session_id` | **200, attempt row written into it** | **404** |
| an exam-kind session | **200** | **404** |
| approved practice item *(control)* | 200, key returned | 200, key returned |
| rejected **practice** item | 200, key returned | 200, key returned — **intended** |

The control is what makes the refusals mean anything: a refusal proves nothing unless something
proves the endpoint still serves.

**The vocabulary was read from the data, not chosen.** `quiz_sessions.kind` is
`practice | review | certification_exam | mock_exam`, and all 813 attempts this endpoint has ever
written sat on `practice` (594) or `review` (219). Refusing the two exam kinds breaks nothing that
has ever happened. Same for the pool: 0 of 813 were ever on a secure item.

**Both refusals run before anything is read or written**, so a refusal leaves no attempt row and
discloses nothing. The ownership failure returns the **same 404** as a missing session — whether a
given session id exists is not something a stranger should be able to probe.

**The smoke was watched failing first.** It ran against the unfixed deployment and reported
`NOT YET AS RULED`, writing one attempt row into another learner's session and deleting it again —
the defect executing rather than being described.

---

## 2 — The sweep: one leak, and it was the one already found

### PostgREST, probed as anon and as a fresh learner, both controls passing

```
  correct_answer (secure & practice)   anon HTTP 401     authenticated HTTP 403
  secure row via question_text         anon 0 rows       authenticated 0 rows
  secure row via explanation           anon 0 rows       authenticated 0 rows
  all 7 views over quiz_questions      anon HTTP 401     authenticated HTTP 403
```

Why, asked of the database rather than inferred from an ACL:

- **`correct_answer` is not granted** at column level to `anon` or `authenticated`
  (`has_column_privilege` = false). Only `service_role` and `pg_read_all_data` hold it.
- **Every secure item has `visibility = 'secure'`** (12,511 approved + 126 rejected), and the two
  read policies match `'public'` and `'public','private'` only. RLS excludes them by value, not by
  hope.
- The only view `authenticated` is granted is `v_user_due_reviews`, which exposes
  `user_id, certification_id, due_count` — a count, no text, no key — and PostgREST refuses it
  anyway.

### Every edge function that mentions a key

| function | verdict |
|---|---|
| `submit-quiz-answer` | **was the leak. Fixed.** |
| `score-mock-exam` | aggregates only in **both** branches — see 2C below |
| `get-active-exam-session` | selects `id, question_text, question_type, options`; never the key |
| `generate-mock-exam` | never returns `correct_answer` |
| `generate-practice-questions` | reads style references `pool='practice'` only, and returns `id, question_text, difficulty, concept_slugs` — no key |
| `get-exam-monitor`, `get-user-cert-overview` | `correct_answers` is a **count** |
| `set-cert-link` | the word appears in a comment |

### Every RPC that reads a key — all three reachable by `authenticated`

| RPC | reachable by | verdict |
|---|---|---|
| `get_public_samples` | anon + authenticated, SECURITY DEFINER | filters `visibility = 'public'` — the 216 public sample items, by design. Secure cannot appear |
| `get_session_review` | authenticated, SECURITY DEFINER | **sound, with two independent firewalls**: `user_id = auth.uid()`, `pool = 'practice'` AND `is_exam_scope = false` |
| `create_practice_questions` | anon + authenticated, **not** definer | a write path, and neither role has INSERT on `quiz_questions`, so the insert is refused. **The EXECUTE grant to `anon` is unnecessary** — closed today by the table grant, not by intent. Reported |

### 2C — does a candidate get secure keys back after submitting?

**No.** Both `score-mock-exam` branches return aggregates only — `score_pct`, `passed`,
`correct_answers` (a count), breakdowns, `weakest_concepts`, `recommendations`, and for the
certification branch the credential fields. **No per-item `correct_answer`, no `explanation`.** The
secure bank does not leak one form at a time.

### MCP — serves no item and no key

`::checkpoint` and `::interactive` are both omitted from `get_lesson`, by an **allowlist** ("a key
added to the authoring format later is omitted by default"), and the omission is **counted and
reported** to the caller. Measured on AISM-I: 61 of 61 lessons carry a checkpoint, 191 keyed items,
all withheld. Not touched.

### Reported, not fixed — a different class

**An authenticated learner can read any PRACTICE item's `question_text` and `explanation` directly
through PostgREST**, before answering it: 15,388 items. Not the section-1 class — practice, not
secure, and a practice explanation is shown after answering anyway — but it is available *up front*
and in bulk, and an explanation usually names the correct option in prose.

---

## 3 — Was it used? The answer is "not in the 24 hours we can see, and unknowable before that"

> **[NUMBERS CORRECTED 2026-09-28. Every count in this section, and in section 1's table, was measured
> through UNORDERED paged reads. `getAll` pages with `Range` headers, and over a query with no
> `order by` that returns a different SET on each run while the row count still matches — so the
> id-keyed map the counts were computed through had holes, and an attempt whose question was missing
> from the map was silently skipped. Re-measured with ordered reads, twice, identical both times.
>
> The safety-critical half is unchanged and that is the important part: still ZERO secure items served
> through the practice path, and the exam side still clean. The retired-and-rejected exposure is five
> times larger than reported.]**
>
> | | reported | corrected |
> |---|---|---|
> | practice-path attempts on a SECURE item | 0 | **0** |
> | practice-path attempts on a non-approved item | 4 | **48** |
> | attempts after the item's retirement | 11 | **55** |
> | distinct users / sessions / questions behind those | 1 / 3 / 9 | **3 / 14 / 27** |
> | exam-session items serving a non-approved item | 0 | **0** |
>
> The conclusions below stand: nothing reached a secure item through the practice path, the logs still
> only cover 24 hours, and the swallowed insert still means the period before that is UNKNOWN rather
> than clean. `scripts/_pg.mjs` now refuses an unordered read before it fetches a second page.

### First, your question about the attempt row — and it changes the answer

**No. `submit-quiz-answer` did not reliably write an attempt row on a call that returned a key**, so
"0 of 813 practice attempts on secure items" does **not** prove nobody called it.

The attempt insert's error is **discarded**:

```
await svc.from('quiz_attempts').insert({ ... });     // no error check
```

`quiz_attempts.session_id` has a foreign key to `quiz_sessions(id)`, and `user_id` one to
`profiles(id)`. So a caller passing a `session_id` that does not exist got a `23503`, the error was
swallowed, the function carried on — and returned `correct_answer` and `explanation` **with no row
written**. The cheapest possible exploit is also the one that leaves no trace.

Not fixed: it is not the same class as section 1 (a dropped write error, not a key leak), and it is
your call. It is one `if (error) throw` and it is what makes this table an audit trail.

### The logs: retention is 24 hours

Earliest log in the stream is **2026-09-26T04:27Z** and the API caps a query window at 24 hours.
The hole existed for the whole life of the function.

**What the logs do and do not carry:** no request body and no authenticated user id, so
`question_id` is not directly there. It *is* recoverable for this window from the function's own
internal PostgREST read, whose URL is logged — `quiz_questions?select=...correct_answer...&id=eq.<uuid>`
— and a single `id=eq.` read is `submit-quiz-answer`'s signature, since `score-mock-exam` uses
`in.(...)`.

```
submit-quiz-answer calls in the window          62
  186.169.144.200  44x200, 4x404, 2x403   2026-09-27 04:02-04:19   this machine, my smoke runs
  38.191.73.174    12x200                 2026-09-26 16:01-16:02   one real learner session

secure items read with correct_answer via id=eq.   4
  266db2b0  04:18:23     3221e6a9  04:03:38     074f418e  04:16:55     e5f88b69  04:19:29
  ALL FOUR ARE MINE -- one per smoke run, today, from this machine
```

The 12 real calls on 2026-09-26 read six items, **all `practice` and `approved`**. The 404s and 403s
from this machine are the fix refusing things, visible in the logs.

### So, plainly

- **In the 24 hours we can see: nobody but me touched a secure item through this endpoint.**
- **Before that: unmeasurable**, for two independent reasons — the logs are gone, and the cheapest
  exploit left no attempt row. "Nobody used it" is not available; **UNKNOWN** is the honest state.
- **No user to report on.** There is no non-synthetic caller with a secure-item call, so there is
  nothing about exam sessions, results or credentials to put in front of Juan. If you want a
  credential-level review anyway, the basis would have to be something other than this evidence.

---

## Ready to push

```
  ebf51e5  the hole is closed: a secure item is refused, and a session now has to be yours
  (this commit)  the sweep: no second leak, and the 24-hour window is all the logs can answer
```

Deployed: `submit-quiz-answer` only. MCP untouched. Nothing else changed.

**Not resumed:** PROMPT-78 section 1 step 2 (the draft inserts) and sections 2-6, per the stop rule.
Two things to note when it resumes:

- `quiz_questions.status` **defaults to `'approved'`**, so a draft insert that omits the column
  lands live. The generator sets it explicitly; the default is the hazard.
- `is_exam_scope` defaults to **true** and `visibility` to **`'secure'`**, so a practice draft needs
  both set explicitly — `get_session_review` filters on `is_exam_scope = false`.
