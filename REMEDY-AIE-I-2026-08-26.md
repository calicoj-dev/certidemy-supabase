# Remedy draft: the AIE-I attempt that failed by one item

**Drafted, not applied. Juan decides this one.**

Attempt `09bf8b45-d4cb-4156-8bc1-bd636db4cee9`, AIE-I, submitted
2026-08-26 18:28:42Z. **19 / 25 = 76%, against a mark of 80%.** One item short.

---

## The arithmetic, measured

| scenario | score | verdict |
|---|---|---|
| as administered | 19 / 25 = 76% | FAIL |
| **credit-all on Tier A #72** | **20 / 25 = 80%** | **PASS** |
| deletion of the flagged items | 18 / 23 = 78.3%, needs 19 | FAIL |

**The candidate answered option `a`. The recorded key is option `d`.** #72 is
`6c0b1bce`, now retired: the stem already contains the task instruction the key
says is missing, and the key refers to résumés the stem never mentions.

Only one Tier A item was presented to this attempt, and the candidate got it
wrong — so crediting it moves the score by exactly the one item the outcome turned
on. One Tier B item was also presented (#74 `e0646031`, which contradicts #72's
logic) and the candidate answered it **correctly**.

**Credit-all and deletion disagree here, and that is the decision.** Standard
practice for a key found defective after administration is to credit it, which
makes this a pass. Deletion — removing the item from the scored set — leaves it a
fail at 18/23. The two standard remedies give opposite answers on this one
attempt, which is why it is yours and not mine.

## What the candidate already holds

They **retook AIE-I the same day**, attempt
`cb7ca922-e5ee-4f20-9716-75ddf4e8e55c` at 19:00:44Z, scored **100%**, and hold
credential **`AIE-I-UW8V-ZRUY`, status `active`**.

**So no certification is withheld from anyone.** The cost was a consumed attempt,
not a denied credential, and nothing here is urgent.

## And the voucher was not a second voucher

Both attempts ran on **one voucher**, `AIE-I-V-PRD9-QDF8`:

```
attempts_allowed   2
attempts_used      2      <- exhausted
status             redeemed
credential_id      set (from the retake)
```

So "restore the voucher consumed by the retake" is precisely: **restore the second
attempt on that voucher**, `attempts_used` 2 → 1. There is no separate voucher to
un-redeem, and the voucher must stay `redeemed` because a credential was issued
against it.

## The draft remedy — three statements, none applied

**1. Mark the attempt passed, with the reason recorded on the row.**
`exam_attempts` has no reason column, and `integrity_flags` is `jsonb`, so the
reason travels with the row rather than living only in an audit table:

```sql
update public.exam_attempts
   set passed = true,
       integrity_flags = coalesce(integrity_flags, '{}'::jsonb) || jsonb_build_object(
         'post_administration_credit', jsonb_build_object(
           'item', '6c0b1bce',
           'tier', 'A',
           'reason', 'key wrong against source; credited per post-administration review 2026-09-26',
           'score_as_administered', '19/25',
           'score_after_credit', '20/25'))
 where id = '09bf8b45-d4cb-4156-8bc1-bd636db4cee9';
```

**Open question for you, and I have not chosen:** whether to move `score_pct`
(76 → 80) and `correct_answers` (19 → 20) as well. Crediting the item means the
score *is* 80%, so leaving 76 beside `passed = true` is internally inconsistent —
but moving them rewrites a recorded measurement, and the row would then no longer
reconcile against `exam_session_items`, which is the assertion that made this whole
measurement trustworthy. **My preference is to move both and record the original
pair inside `integrity_flags`**, so the recomputation check has something to
reconcile against. Say which you want.

**2. Restore the attempt on the voucher.**

```sql
update public.vouchers
   set attempts_used = 1
 where id = '20b405ac-1d25-46ab-94bc-a2aa307822e1'
   and attempts_used = 2;
```

The `and attempts_used = 2` is not decoration: it makes the statement idempotent
and refuses to run twice.

**3. Record it in `admin_actions`**, which is the audit table keyed to a human
actor:

```sql
insert into public.admin_actions (actor_user_id, action, target_type, target_id, reason, metadata)
values ('<Juan''s user id>', 'exam_attempt.post_administration_credit',
        'exam_attempt', '09bf8b45-d4cb-4156-8bc1-bd636db4cee9',
        'Tier A item 6c0b1bce had a key wrong against its own source. Credited; '
        || 'attempt moves 19/25 to 20/25 = 80% and passes. Voucher attempt restored.',
        jsonb_build_object('item','6c0b1bce','voucher','20b405ac-1d25-46ab-94bc-a2aa307822e1',
                           'credential_already_held','AIE-I-UW8V-ZRUY'));
```

`actor_user_id` is deliberately a placeholder. This is a human's decision and the
audit row should name the human, not a service role.

## What NOT to do, and why

- **Do not issue a second credential.** The candidate already holds an active
  AIE-I credential from the retake. Two passing attempts would otherwise mint two
  credentials for one certification, and `_shared/issue.ts` has no concept of
  "the same person passed twice".
- **Do not touch the retake.** It is a clean 25/25 and the credential rests on it.
- **Do not credit the other seven attempts.** All seven passed as administered and
  crediting changes nothing; the measurement is in `TIER-A-OUTCOMES.json`.

## The one credential worth a second look, separately

**SM-AI-I 2026-09-23** passed at 73/80 and is the only credential that does **not**
survive the harshest reading: flipping every Tier A and Tier B item it got right to
wrong gives **63/80 against 64 needed — short by one.**

Under **deletion** the same attempt is **63/66 against 53 needed, a comfortable
pass**, and deletion is the other standard remedy rather than a softer opinion.
**No credential fails both models.** Recorded here because the worst-case number on
its own would invite action that the pair does not support.
