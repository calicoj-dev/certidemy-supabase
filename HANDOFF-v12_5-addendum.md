# HANDOFF v12.5 — addendum to v12.0

**2026-09-15, later the same day. The branch that had never run.** One
partner-facing authorization defect in `analyze-curriculum`, found while scoping
a feature rather than while auditing one, and a shape worth more than the fix.

---

## THE FINDING: AN EMPTY TABLE WAS THE ACCESS CONTROL

`analyze-curriculum` has two ways in — `platform_admin`, and a partner company
holding the `curriculum_coverage` feature. The partner branch, deployed since
v7.4, read:

```ts
if (!body.company_id) return 403;
const granted = await rpc("company_has_feature", {
  p_company_id: body.company_id, p_feature_key: "curriculum_coverage",
});
if (granted !== true) return 403;
ownerCompanyId = body.company_id;        // <- the run's owner, from the body
```

`company_has_feature(company_id, feature_key)` is a pure lookup over
`company_features`. **It says nothing about who is asking.** So the check proved
that *some* company holds the grant, then attributed the analysis to whatever
company id arrived in the request body.

**A grant, a membership and a role are three different facts. Only the first was
checked.**

That is the shape `requireIssuerAccess` exists to prevent on the issuing path,
one table over — and CLAUDE.md already carries the sentence for it: *"the only
thing between a valid learner JWT and minting under another organisation's
signature."* The same sentence was true here and nobody had written it, because
the surface did not look like issuance.

### It had never been exploited, and could not have been

`public.company_features` has been **empty platform-wide since it was created** —
zero rows, zero distinct feature keys. `company_has_feature` therefore answered
false for every argument it was ever passed, and every partner call 403-ed before
reaching anything at all.

> **The branch read as working because nothing could reach it.**

---

## 1. THE CLASS: A BRANCH THAT CANNOT RUN LOOKS IDENTICAL TO ONE THAT WORKS

v12.4 ended on *a check that cannot fire is indistinguishable from one that fired
and found nothing.* This is the same statement about **code** rather than about
**instruments**, and it is worse in one specific way.

**WHAT HOLDS A DEAD CHECK SHUT IS CODE. WHAT HELD THIS SHUT IS DATA.**

- ESLint's config, the `proconfig` predicate, the fragment extractor — each was
  broken in a file. Each opens when someone **edits** something, and an edit gets
  reviewed, type-checked, linted, diffed in a PR.
- This branch opens when someone **inserts a row**. Not a deploy, not a commit,
  not a migration. One `insert into company_features`.

**Nobody reviews an insert.** There is no diff, no reviewer, no CI, no
post-condition. The safety here was never a decision — it was a side effect of
having no customers yet.

### And the timing is the part that makes it dangerous

The first row ever written to `company_features` is also the moment the feature
is **sold to its first partner**.

> **The gap and the first sale are the same event.**

So "leave the table empty" is not a mitigation, it is a description of
pre-revenue. The window in which the defect is harmless is exactly the window in
which nobody is paying, and it closes at the moment of highest attention and
lowest patience — an onboarding call, with a grant being inserted by hand.

**This is the third member of a family this repo keeps paying for**, and the
three look nothing alike from the outside:

| holds it shut | opens when | reviewed by |
|---|---|---|
| a broken config file | someone fixes the file | the diff |
| a predicate matching nothing | someone corrects the SQL | the migration |
| **an empty table** | **someone inserts a row** | **nothing** |

---

## 2. HOW IT WAS FOUND: SCOPING, NOT AUDITING

Worth recording because it was not a security review and would not have been
found by one on any near-term schedule.

The open question on the table was product-shaped — *should `analyze-curriculum`
be offered to partners?* Answering it meant reading the function to see what a
partner would get. The authorization block is thirty lines above the visibility
filter and cannot be skipped on the way there.

**An audit asks "is this safe". Scoping asks "what happens when I turn this on",
and that question walks the path the feature will actually take.** The empty
table is invisible to the first question and unmissable in the second: the very
next step after "ship it" is "grant it to someone", which is the step that opens
the hole.

---

## 3. THE TEST HAD TO MANUFACTURE A STATE THAT HAD NEVER EXISTED

`scripts/smoke-analyzer-access.mjs`. Three identities are needed and **none
existed anywhere on this platform**:

```
ADMIN_G   team_admin of a company holding curriculum_coverage
MEMBER_G  plain team_member of that SAME company
ADMIN_H   team_admin of a DIFFERENT company, no grant
```

`MEMBER_G` is the one a hand-test skips and the one that decides the product
question: a coverage report is commercial information about a partner's own
product, so membership is too wide a door. The difference between *belongs to*
and *administers* is invisible unless someone holds both and only one gets in.

**Its GRANTED control is the one to keep.** It reads `company_has_feature` back
for both companies before asserting anything, because without that every refusal
it records is equally consistent with *the fixture never landed* — which is
precisely the state the function spent its entire deployed life in. A suite that
only counts refusals would have passed against the defect and against a typo in
the insert, identically.

Per v12.3: it signs in with the **anon key**, never service-role. The property is
what a browser session can do.

### Run against the old code FIRST. That is the only proof it can fire

Done before the fix was deployed — **10 passed, 6 failed**, and the two that
mattered were the leak executing rather than a description of it:

| caller | old code |
|---|---|
| plain `team_member` of the granted company | **HTTP 200, full report** |
| `team_admin` of company H passing **G's** id | **HTTP 200, full report** |
| any partner response | carried `tables_read` — 7 internal table names |
| `team_admin` of G with no `company_id` | **403** — see below |

Against the fix, with `CERTIDEMY_ADMIN_EMAIL` / `CERTIDEMY_ADMIN_PASSWORD`
supplied: **18 passed, 0 failed, 0 untested.**

**The fourth row is a second finding and it is a usability one.** The old branch
required `body.company_id` and had no resolution path, so the only caller who
could ever have used it was one who already knew a company uuid. A partner
console would have had to send the id the function then trusted — the defect and
the ergonomics had the same cause.

---

## 4. What shipped

- **`_shared/authorize.ts` gains `requireCompanyFeature`**, mirroring
  `requireIssuerAccess`: throws rather than returning a boolean, one identical
  403 for every way of not being entitled, memberships resolved from
  `team_members` with `role = 'team_admin'`. **`body.company_id` is demoted to a
  selector** that may only narrow the caller's own set, and is refused — not
  ignored — when it names a company outside it. Ignoring it would be worse: the
  caller would receive a report about a company they did not ask about and could
  not tell.

- **It refuses to guess where `issuerForActor` picks earliest-joined**, and says
  why in the file. That is not a fourth answer to *which company is this admin*;
  it is declining to answer, because `analysis_runs.owner_company_id` is a
  persisted commercial record. Guessing wrong on a page shows the wrong heading.
  Guessing wrong here files a competitor analysis under the wrong customer.

- **`platformRole` no longer drops its read error.** It swallowed `error` and
  returned null, which demotes an admin to a learner and presents as a role
  problem — sending the next person to look at grants that are perfectly
  correct. It now raises 500, and can never grant what it did not grant before.

- **`tables_read` is omitted — not emptied — for non-admins** on both the fit and
  report responses, so a partner cannot tell how many tables an answer touched
  either. Internal table names in a partner-facing body are the same class as an
  editorial note left in a concept description. The admin direction is asserted
  too; proving a partner does not receive it passes just as cleanly against a
  response that dropped it for everyone.

- **The smoke script does not create a `platform_admin`**, deliberately. Every
  other fixture is bounded — a company nobody uses, a learner with no seats, and
  a grant carrying `expires_at = now() + 15 min` so a teardown that dies halfway
  leaves an entitlement that closes itself. A `platform_admin` is not bounded: it
  clears 45 RLS policies across 42 tables, and a transient one whose teardown
  fails is a live administrator account. That half is UNTESTED without supplied
  credentials, and UNTESTED is never counted as a pass.

- **The libuv fix from `mint-issuer-key.mjs`, applied here.** Nine keep-alive
  requests followed by `process.exit()` trips
  `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)` on Windows. It now
  sets `process.exitCode` and lets the loop drain. **It matters more in this
  script than in a mint**: teardown runs in a `finally`, and an exit that crashes
  on the way out is, in a slightly different arrangement, the thing that leaves a
  live feature grant behind.

- **The migration status line was stale by four, with the number right.** It
  read *"318, 323, 324 and 325 are written and have NOT run"* after all four had
  run, and `HANDOFF-v12_4-addendum.md` §4 still listed 318 under decisions
  waiting. Corrected in both, verified against `pg_catalog` rather than against
  the line. **This is the 2026-09-13 variant recurring**: `ls migrations/`
  confirms the number and says nothing about what ran, so the check that catches
  one failure is blind to the other.

---

## 5. Open

- **No console surface calls this yet.** Renderer B does not exist. The fix
  landed before the UI, which is the right order and is the only reason this is a
  commit rather than an incident.
- **`environment` is a label, not a boundary.** Unchanged from v12.4 and still
  the largest open item: a `cdk_test_` key with `credentials:issue` mints real
  credentials under the issuer's real signature.
- **Per-certification scope for `courseware:lessons`.** Window closes at the
  first key sold.
- **The two smoke keys are still live**, and `cdk_live_2008b3e8` still holds
  `courseware:lessons` with `last_used_at` null.
- **Spanish source still cannot be measured** by the analyzer — suppressed, not
  answered, and the reason it is a product gap rather than a bug is in the
  function's own header. This platform sells into LatAm.

**Carried:** `mcp.resolve_api_key` does not touch `last_used_at`; no rate
limiting on `courseware-read`; `pg_net` PUBLIC grants; `anon` CREATE on schema
`public`; `analyze-local.mjs` dead since `3110eec`; AIE-I still writing ungrouped
items.

---

## 6. The through-line, fourth statement

- **v12.2:** every defect passed a check, because almost every check reads
  configuration rather than exercises behaviour.
- **v12.3:** the checks that *did* exercise behaviour still proved the wrong
  thing, because they ran as the system.
- **v12.4:** and a check that cannot run is indistinguishable from one that ran
  clean.
- **v12.5:** so is a code path. And when what holds it shut is **data rather than
  code**, it opens without an edit — so none of the machinery that reviews edits
  is watching.

> **Ask what turns each branch on.** If the answer is a deploy, the diff is
> looking at it. If the answer is a row, nothing is.
>
> An empty table is not a control. It is a customer count.
