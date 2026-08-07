# HANDOFF-v5.8-addendum — public samples, and a rule that failed three times

**Session date:** 2026-08-07 (continuing from v5.8)
**Reads with:** `HANDOFF-v5_8.md`.
**Migration tip:** **184 applied** · next free **185**
**Repos:** both clean and pushed

v5.8 closed with AIMS-F published. Then the certification page turned out to have
no sample questions on it, because `CERT-PUBLISH-CHECKLIST` §2 was never run for
AIMS-F — and checking that found the same rule had already failed twice more.

---

## 0. THE CATALOGUE IS NOW CONFORMANT

**Nine certs, six public samples each, six distinct tasks each, zero firewall
leaks.** First time that has been true.

```sql
select c.code,
       count(*) filter (where q.visibility='public' and q.language='en') as public_en,
       count(distinct q.task_id) filter (where q.visibility='public') as distinct_tasks
from public.certifications c
left join public.quiz_questions q on q.certification_id = c.id
group by c.code order by c.code;
```

Keep that query. It is what found two of the three defects below.

---

## 1. AIMS-F's SIX

Migration `182`. Six distinct tasks, apply and analyze only, difficulty 3.

| domain | task | bloom | what it shows |
|---|---|---|---|
| D2 | 2.6 | apply | societal impact skipped after individual risks pass |
| D2 | 2.7 | analyze | two documents, one anchored to objectives and one to deployment |
| D3 | 3.7 | analyze | ISMS competence records do not satisfy AIMS competence |
| D4 | 4.4 | apply | six months of drift with no event to alert on |
| D4 | 4.7 | analyze | an access-control policy claimed as an Annex A control |
| D5 | 5.6 | analyze | witnessed sampling when a dataset cannot be handed over |

**D1 has no pick, deliberately.** Every D1 task in AIMS-F is `2_understand`, so
the apply-and-analyze rule leaves it no eligible item. Dropping D1 puts the
showcase on all four `4_analyze` tasks — the differentiators — which is a better
trade than a proportional split. **Spread D2x2 / D3x1 / D4x2 / D5x1 against
weights 15 / 22.5 / 20 / 25 / 17.5.**

Sectors varied on purpose: recruitment, medical triage, corporate security,
customer service, access control, audit evidence. No single-jurisdiction stems.

---

## 2. THE SAME RULE FAILED THREE TIMES

`CERT-PUBLISH-CHECKLIST` §2 is well written. It specifies six items, six
**distinct** tasks, practice pool only, apply and analyze where the profile
supports it. It even names its own cautionary example.

**It has been violated three times, in three different certs.**

| cert | defect | found |
|---|---|---|
| AIHR-I | six items across five tasks | during its own build; fixed by migration 150 |
| ISMS-F | **five** items, four of them `2_understand` | 2026-08-07, comparing against the checklist |
| AIE-I | six items across five tasks — **the defect the rule cites as its example** | 2026-08-07, by the count query above |

AIE-I is the one worth sitting with. The checklist says, in the rule itself:

> *"Partition by task, not by domain... This was the defect in AIHR-I's migration
> 149, corrected by 150."*

**The rule names the failure, and the failure happened again anyway.**

### Fixed

`182` AIMS-F's six · `183` ISMS-F topped from five to six with a `4_analyze`
concentration-risk item on task 4.8 · `184` AIE-I's duplicate 2.4 swapped for a
`3.3` human-oversight item at difficulty 4.

**ISMS-F's existing five were left alone.** Four are `2_understand`, which sits
against the current rule, but that rule was almost certainly tightened after
ISMS-F shipped. Reselecting five working items to satisfy a later rule is churn;
adding a sixth is not.

### The next action, and it is concrete

**Three assertions in `verify-cert --strict`:**

| assertion | rule |
|---|---|
| `public_en = 6` | the specified count |
| `distinct_tasks = 6` | partition by task, not domain |
| `secure_leak = 0` | no secure item is ever public |

All three are single queries. All three would have caught a defect that shipped.
**Do this before the tenth cert.**

---

## 3. WHY THIS KEEPS HAPPENING

Three data points now, and they are the same shape as v5.8 §2's badge gap.

**The rule was correct.** **The tool that could see the violation existed or was
one query away.** **Nothing forced anyone to look.**

v5.8 ended on: *a derived inventory tells you what is missing, it cannot make you
care.* This sharpens it. The badge gap was **reported** by `cert-inventory` and
sat for two days. These three were not reported by anything, because no check
existed — but each was four seconds of SQL from visible.

> **A rule that lives only in prose is a rule that depends on someone
> remembering it at the right moment.** Three certs, three moments, three
> forgettings. The rule is not the problem and the people are not the problem;
> the location is.

The pattern across this whole build is consistent, and it is worth stating once
plainly: **every recurring defect in this project has been fixed by moving a
claim from prose into a query.** `cert_inventory()` replaced a stale checklist
section. The coverage view replaced counting lessons by hand. The cognitive
profile replaced arguing about ladder rules. The attribution rule replaced hoping
a generator would not assert things.

**Public samples are the next candidate, and the last obvious one.**

---

## 4. COMMITS

| commit | what |
|---|---|
| `054dd05` | 182 — AIMS-F public samples |
| `76d7682` | 183 — ISMS-F sixth |
| `5c298d8` | 184 — AIE-I distinct tasks |

Migration tip **184**, next free **185**.

---

## 5. OPEN

Unchanged from v5.8 §7, plus:

1. **`verify-cert --strict` public-sample assertions.** §2 above. Before the
   tenth cert.
2. **`CERT-PUBLISH-CHECKLIST` §2 should note ISMS-F's four `2_understand`
   samples as a grandfathered exception**, so a future reader does not treat
   them as precedent.
