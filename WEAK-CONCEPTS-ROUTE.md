# The weak-concepts route: an insert that omits `status` is an approval

Measured 2026-09-27. **Report only. Nothing was changed**, per the ruling.

---

## The route, and where the approval happens

```
learner  ->  POST /functions/v1/generate-practice-questions   gated by authenticate() alone
         ->  service-role client
         ->  public.create_practice_questions(...)            SECURITY INVOKER, called as service_role
         ->  INSERT INTO quiz_questions                       NAMES NO status
         ->  column default 'approved'                        <- the approval
```

**Nothing in this path ever decides to approve anything.** `create_practice_questions` names no
status, so the approval is `quiz_questions.status DEFAULT 'approved'`, set by migration 003. An
omitted column is the entire review step.

**And it is not an oversight.** `functions/generate-practice-questions/index.ts` says so in its own
header:

> *"NOTE: status is left at its column default ('approved') - generated questions go live
> immediately, as before. A real review gate must also be enforced in the fetch paths
> (fetchConceptPractice / get-review-batch / fetchWeakConceptPractice), so it's tracked separately
> rather than half-built."*

That reasoning is sound and it is the reason this is a report rather than a change: moving the insert
to `pending_review` without the fetch-path filters would withhold every generated item from the
learner who asked for it, which is a worse outcome than the present one and looks like a fix.

---

## Volume: 170 ever, 10 live

Every generated practice item, by certification. `item_origin = 'generated'` is stamped by this
function and by nothing else on the practice pool.

| certification | generated, ever | live | live and approved | in exam scope | ungrouped | languages |
|---|---|---|---|---|---|---|
| AIE-I | 135 | 5 | 5 | 0 | 0 | 2 |
| SM-AI-I | 25 | 5 | 5 | 0 | 0 | 2 |
| SM-AI-II | 10 | 0 | 0 | 0 | 0 | 2 |
| **total** | **170** | **10** | **10** | **0** | **0** | en + es-419 |

**160 of the 170 are retired**, which is the AIE-I ungrouped-items clearance and SM-AI-II's five
pairs. The 10 that remain agree exactly with the figure the 2026-09-19 ruling recorded -- *ten live
generated items against 15,220 live practice items* -- so nothing has been added since that decision.

**Three certifications, never twelve.** AIE-I, SM-AI-I and SM-AI-II. The other nine have never had a
generated item, live or retired.

**None is in exam scope and none is ungrouped.** `is_exam_scope = false` on all 10, so no
certification form can contain one; `question_group_id` is set on all 10, so the trilingual coverage
check can see them.

---

## What bounds a call, and what does not

| | |
|---|---|
| per call | `num_questions` clamped to 1..15, tasks capped at `MAX_TASKS = 4` |
| per learner | **nothing** |
| per day | **nothing** |
| rate limit | **nothing** |
| cooldown | **nothing** |

So the ceiling on volume is 15 items per request and there is no ceiling on requests. 170 items in
five weeks is what ordinary use produced; it is not a limit the system imposes.

**The tier is still unread**, which the function also records against itself: `validateQuestion`
accepts `true_false` and any `options.length >= 2`, and on 2026-09-12 that put a two-option item into
a live tier-2 certification whose contract is four defensible options. Open, and separate from the
approval question.

---

## What 378 did and did not close

`create_practice_questions` was executable by `anon` and `authenticated` until migration 378 revoked
it. **That closed the direct route and not this one**: the edge function calls the RPC with a
service-role client, so the learner's own privileges are never the gate. 378 was still worth doing --
an anon-executable insert path is indefensible on its own terms -- but nobody should read it as
having closed this.

---

## The three options, with what each costs

Stated so the decision is a decision, not a default.

**1. Leave it.** 10 live items, none in exam scope, on three certifications, already ruled acceptable
as practice on 2026-09-19. Cost: the route stays open, so the number is a fact about usage rather
than about policy, and the next burst of use raises it with nobody deciding.

**2. Insert `pending_review` and filter the fetch paths.** What the function's own header asks for.
Cost: three fetch paths to change in the web repo (`fetchConceptPractice`, `get-review-batch`,
`fetchWeakConceptPractice`), and a review queue somebody has to work, or generated items simply never
reach anyone and the feature is off with extra steps.

**3. Insert `pending_review` and serve it to the requesting learner only.** The item the learner
asked for is the item they get; it reaches nobody else until reviewed. Cost: a per-learner visibility
rule in the fetch paths, which is new machinery, and a `pending_review` row becomes servable to one
person -- a state nothing else in the bank has.

**Not recommended here.** The ruling was to report volume and certifications, and option 2 touches
the web repo, which is out of scope this session.
