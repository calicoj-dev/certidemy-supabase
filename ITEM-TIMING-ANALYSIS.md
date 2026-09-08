# Item timing, normalised by length, compared across languages

**Status: RECORDED, NOT RUN. The data does not support it yet.**
**Measured 2026-09-08.**

This note exists so the analysis is not re-derived from scratch when there is
enough data to run it. It is the deferred item `migrations/100_exam_durations.sql`
points at when it says duration will be reset *"from the observed distribution
(e.g. 95th-percentile completion) rather than from a benchmark"*.

> **`PSYCHOMETRIC-PROCEDURES` DOES NOT EXIST.** `100:60` records this deferral
> "in PSYCHOMETRIC-PROCEDURES as a deferred item with a live trigger". There is
> no such file in this repository, at any commit. Until there is, this note is
> the only place the procedure is written down.

---

## 1. What the analysis is

**Seconds per item is not comparable across languages, because the item is not
the same length in each.** Measured over the 8,524 trilingual item groups:

| language | mean characters (stem + all options) | ratio to English |
|---|---|---|
| en | 675 | 1.000 |
| **es-419** | **818** | **1.212** |
| **pt-BR** | **778** | **1.153** |

So es-419 running ~21% slower than English is **the language, not the item**.
Normalising time by character count removes that, and **the residual is the
signal**.

**Two uses, and they are different instruments sharing one measurement:**

1. **Duration setting.** The distribution of normalised time across a whole
   bank, per language, is what migration 100 says should replace the current
   90-seconds-per-item benchmark. A form's duration should be derived from the
   language that reads slowest, not from English.

2. **Translation-defect detection.** An item whose es-419 seconds-per-character
   is an outlier **against its own English sibling** is a translation problem —
   ambiguous phrasing, a mistranslated option, a stem that lost its qualifier.
   **Nothing currently detects this.** `verify-cert.mjs` checks that three
   language rows exist per group and that translations are approved; it cannot
   check whether a translated item is *harder to read* than its source.

The second use is the one with no substitute. Trilingual integrity is a
structural check and passes on a group whose Spanish version is incomprehensible.

---

## 2. What exists today

**Both timing columns are populated, and they are different instruments.**

| table | rows | with a time | with time > 0 |
|---|---|---|---|
| `quiz_attempts` | 1,600 | 1,363 | **1,275** |
| `exam_session_items` | 1,547 | 834 | **834** |

- **`quiz_attempts.time_taken_seconds`** is the graded record — one row per
  answered item per attempt, across `practice`, `review`, `mock_exam` and
  `certification_exam`. **This is the table the analysis should use.**
- **`exam_session_items.time_taken_seconds`** is the live in-session value
  written incrementally by `save-exam-answer`, and is a snapshot of work in
  progress. It covers exam sessions only.

The 88 `quiz_attempts` rows with a non-null but zero time are excluded
throughout: a zero is an unanswered or instantly-skipped item, not a fast one.

**Item text is available and character counting works in one query.**
`quiz_questions` holds `question_text text NOT NULL` and `options jsonb NOT
NULL`, one row per language, with `question_group_id` as the trilingual sibling
key. Option text extracts through
`jsonb_array_elements(options) o -> o->>'text'`. A single query can produce
`(question_id, language, char_count, median_seconds)` with no application code.

---

## 3. How much data there is, and why that is the blocker

**Responses with a positive time, by language and session kind:**

| language | certification | mock | practice | review | distinct items |
|---|---|---|---|---|---|
| en | 78 | 81 | 92 | 30 | 207 |
| es-419 | 340 | 298 | 314 | 42 | 617 |
| **pt-BR** | **0** | **0** | **0** | **0** | **0** |

**There are no pt-BR responses at all.** One third of the analysis has no input.

**Responses per item — the depth problem:**

| language | items with ≥1 timed response | 1 | 2–5 | 6–20 | >20 | max on any item |
|---|---|---|---|---|---|---|
| en | 207 | 146 | 61 | 0 | 0 | **4** |
| es-419 | 617 | 451 | 149 | 17 | 0 | **15** |

**No item in either language has more than 15 recorded times, and no item has
more than 20.** A median over 1–4 observations is not a median.

**The cross-language comparison is the tightest constraint of all.** It needs the
*same item group* answered in more than one language:

| | groups |
|---|---|
| groups with any timed response | 622 |
| **groups timed in ≥2 languages** | **85** |
| groups timed in all 3 languages | **0** |
| pairs with ≥1 response each side | 85 |
| pairs with ≥3 responses each side | **7** |
| pairs with ≥5 responses each side | **0** |
| pairs with ≥10 responses each side | **0** |

**Seven item groups have three or more timed responses in both English and
Spanish. Zero have five.** The analysis would currently run over seven items and
report noise.

---

## 4. The query, recorded and ready

**Do not run this expecting meaning yet.** It is syntactically complete and its
output at current volumes is not interpretable.

```sql
-- ITEM TIMING, NORMALISED BY LENGTH, PAIRED ACROSS LANGUAGES
--
-- Grain: one row per (question_group_id, language).
-- Excludes time_taken_seconds <= 0 (unanswered / skipped, not fast).
--
-- with timed as (
--   select
--     q.question_group_id,
--     q.language,
--     q.id                                as question_id,
--     qa.time_taken_seconds               as secs,
--     length(q.question_text)
--       + coalesce((select sum(length(o->>'text'))
--                   from jsonb_array_elements(q.options) o), 0) as chars
--   from public.quiz_attempts qa
--   join public.quiz_questions q on q.id = qa.question_id
--   where qa.time_taken_seconds > 0
--     and q.question_group_id is not null
-- ),
-- per_item as (
--   select
--     question_group_id,
--     language,
--     min(question_id)                                          as question_id,
--     count(*)                                                  as n_responses,
--     max(chars)                                                as chars,
--     percentile_cont(0.5) within group (order by secs)         as median_secs,
--     percentile_cont(0.5) within group (order by secs) / nullif(max(chars),0)
--                                                               as secs_per_char
--   from timed
--   group by question_group_id, language
-- ),
-- paired as (
--   select
--     question_group_id,
--     max(chars)          filter (where language = 'en')     as en_chars,
--     max(n_responses)    filter (where language = 'en')     as en_n,
--     max(median_secs)    filter (where language = 'en')     as en_median,
--     max(secs_per_char)  filter (where language = 'en')     as en_spc,
--     max(chars)          filter (where language = 'es-419') as es_chars,
--     max(n_responses)    filter (where language = 'es-419') as es_n,
--     max(median_secs)    filter (where language = 'es-419') as es_median,
--     max(secs_per_char)  filter (where language = 'es-419') as es_spc,
--     max(chars)          filter (where language = 'pt-BR')  as pt_chars,
--     max(n_responses)    filter (where language = 'pt-BR')  as pt_n,
--     max(median_secs)    filter (where language = 'pt-BR')  as pt_median,
--     max(secs_per_char)  filter (where language = 'pt-BR')  as pt_spc
--   from per_item
--   group by question_group_id
-- )
-- select
--   question_group_id,
--   en_n, es_n, pt_n,
--   round(en_chars) as en_chars, round(es_chars) as es_chars,
--   round(en_median::numeric, 1) as en_median_s,
--   round(es_median::numeric, 1) as es_median_s,
--   -- RAW ratio: contaminated by length. Expect ~1.21 for es-419 on a clean item.
--   round((es_median / nullif(en_median,0))::numeric, 3)  as raw_time_ratio,
--   -- LENGTH ratio for THIS item, not the bank average.
--   round((es_chars  / nullif(en_chars,0))::numeric, 3)   as length_ratio,
--   -- THE RESIDUAL. This is the signal. 1.00 means the Spanish version costs
--   -- exactly what its extra length predicts. Materially above 1 means it is
--   -- harder to read than its own English sibling, which is a translation
--   -- defect and not a length effect.
--   round((es_spc / nullif(en_spc,0))::numeric, 3)        as residual
-- from paired
-- where en_n >= 5 and es_n >= 5           -- MINIMUM DEPTH GATE. See below.
-- order by residual desc nulls last;
--
-- ---------------------------------------------------------------------------
-- THE DEPTH GATE IS THE POINT, NOT A FORMALITY.
--
-- `en_n >= 5 and es_n >= 5` returns ZERO ROWS as at 2026-09-08. That is the
-- correct behaviour and the reason it is written into the query rather than
-- applied afterwards: an ungated version returns 85 rows of noise that look
-- exactly like findings, and someone would act on them.
--
-- Five per side is a floor for a median, not a threshold for confidence. For
-- the residual to identify a translation defect rather than two candidates
-- having a bad day, the working target is 20+ responses per item per language.
-- ---------------------------------------------------------------------------
--
-- FOR DURATION SETTING (migration 100's deferred item), the query is different
-- and needs far less pairing, because it is a bank-level distribution rather
-- than a per-item comparison:
--
-- select language,
--        count(*)                                                as items,
--        percentile_cont(0.50) within group (order by secs_per_char) as p50,
--        percentile_cont(0.95) within group (order by secs_per_char) as p95
-- from per_item
-- where n_responses >= 5
-- group by language;
--
-- Multiply p95 by the mean character count of a form in that language to get a
-- 95th-percentile completion time. THAT is the number migration 100 says should
-- replace the 90-seconds-per-item benchmark, and it should be computed per
-- language: at 1.212x the characters, es-419 does not finish in English's time.
```

---

## 5. What would have to be true before the output means anything

| requirement | needed | as at 2026-09-08 |
|---|---|---|
| pt-BR responses exist at all | any | **0** |
| items with ≥5 timed responses, per language | the bank | en max is **4** |
| paired groups with ≥5 responses each side | ~100 to see a distribution | **0** |
| paired groups with ≥20 each side | for a defensible outlier claim | **0** |

**The blocker is candidate volume, not instrumentation.** Everything the
analysis needs is already recorded: `quiz_attempts` captures a per-item time on
every answered item, `quiz_questions` holds the text in all three languages, and
`question_group_id` links the siblings. Nothing needs building.

**The one thing that could be done now and is not:** pt-BR has never been
answered by anyone. Until it is, no amount of English and Spanish volume makes
the third arm computable, and pt-BR is also the language whose rendered
documents have never been generated (`HANDOFF-v9_4.md` §5). Two independent
findings pointing at the same untested language.
