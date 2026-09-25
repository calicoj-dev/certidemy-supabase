# Has anyone been scored on a translated exam item?

**Yes. Seven people hold a live credential decided entirely by unreviewed Spanish
items, and an eighth failed one of those exams by a single item.**

Measured 2026-09-25, read-only, service role. Every count below is accompanied by
the control that proves the probe could have returned something else.

---

## The answer in one table

| | |
|---|---|
| exam attempts sat in a language other than English | **8** |
| distinct people | **7** |
| certifications involved | **3** — AIE-I, AISM-I, SM-AI-I |
| language | **es-419 only. pt-BR has never been presented in an exam.** |
| responses recorded on those attempts | **420** |
| responses on an item whose translation has **no review row** | **420 of 420** |
| distinct translated items presented | **342, every one unreviewed** |
| pool of every presented item | `secure`, `is_exam_scope = true`, `status = approved` |
| live non-specimen credentials issued from those exams | **7**, all `status = active`, all `locale = es-419` |
| credentials reached by any other path | **0** |

## No credential was decided by a thin margin. One failure was.

Passing score is 80 percent on all three certifications. Margin is in items, over
the number needed to pass.

```
AIE-I    19/25   score 76.00   FAILED    margin -1   <- one item
SM-AI-I  73/80   score 91.25   passed    margin +9
AISM-I   76/80   score 95.00   passed    margin +12
SM-AI-I  77/80   score 96.25   passed    margin +13
SM-AI-I  79/80   score 98.75   passed    margin +15
AIE-I    25/25   score 100     passed    margin +5   (x3)
```

**Every credential issued had at least five items of headroom**, so no single
mistranslated item can have produced one. The exposure is not a wrongly granted
credential.

**The only thin case is the failure, and it went the other way.** That candidate
was one item short on an exam whose 25 items were all unreviewed Spanish. A
single defective item is sufficient to explain that result, and nothing here can
rule it in or out.

**Nobody is sitting without a credential because of it.** The same person retook
AIE-I the same day, scored 100, and holds an active credential. The cost of the
-1 was a consumed attempt, not a denied certification.

## Who these people are

Not staff, and not a seeded batch.

- **18 accounts at one external domain**, `ultratech-inc.com`, plus one at
  `gmail.com`. No company row exists for that domain and no invite was sent to
  it.
- The 18 were created **one per minute across 17 separate days** (2026-08-12 to
  2026-08-29). A seed writes many rows in one minute; this is individual signups.
- Every attempt **redeemed a voucher**.
- Local parts are personal-looking, not `test`/`demo`/`qa` shaped.
- **None is the director's account.** `jroman.mobile@gmail.com` has no row in
  `profiles` or `auth.users` at all.

I can say these are external, individually created, voucher-holding accounts. I
cannot tell from the database whether `ultratech-inc.com` is a paying customer or
a pilot cohort — that is a fact only you hold.

## Controls, because a zero is a fact about the probe

| claim | control | result |
|---|---|---|
| 420 responses had no review row | do review rows join to items at all? | **30 of 30 join, all non-English** — the join was capable of matching |
| no credential from another path | credentials with a non-en locale | **7**, and **0** of them outside this attempt set |
| no attempt was missed | attempts whose session has zero item rows | **0** of 15 — no attempt has an unknowable language |
| pt-BR is genuinely absent | distinct languages ever presented | **`en, es-419`** |
| the corpus is not all test data | credentials total | 23, of which 12 specimen — the 7 here are among the 11 real |

`exam_attempts` holds **15** rows in total: 8 es-419, 7 all-English, 0 unknowable.
The set is closed.

## What this does and does not license

- **It does not support recalling a credential.** Seven passes with five or more
  items of headroom are not overturned by an item-level defect rate that has not
  yet been measured. That measurement is the quality sweep, and it is separate.
- **It does support treating the item gate as live work rather than hygiene.**
  18,485 translated items reach learners with no review; 342 of them have already
  been used to score a real person, in the secure pool, under an ISO/IEC 17024
  claim.
- **The re-testable question is the AIE-I failure.** If the quality sweep flags
  any of the six items that attempt got wrong, that is a concrete, named,
  single-candidate remedy rather than a policy argument.
