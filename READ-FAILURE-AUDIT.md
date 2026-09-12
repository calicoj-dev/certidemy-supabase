# Dropped-read audit — both repos, 2026-09-11

**What this document is for:** so the next sweep does not re-derive what this one
established. Sections 4 and 5 are the expensive half — **sites that look wrong and are
not**, with the backstop named per site, confirmed against `pg_index` rather than assumed.
If you are about to "fix" something in those tables, read the backstop column first.

---

## 0. The shape

A Supabase read whose error is discarded, producing a **confident wrong answer** instead
of a failure:

```js
const { data } = await db.from("x").select(...)   // error thrown away
const rows = data ?? [];                          // a failed read is now an empty table
const n = count ?? 0;                             // a failed count is now zero
```

**`count ?? 0` is the model.** On an errored read it reports *zero leaked links*, which
is the answer that passes. The failure path and a legitimate empty result are
indistinguishable, so nothing downstream can tell them apart.

Three instances surfaced on one day, which is what prompted the sweep:

| | where | what it did |
|---|---|---|
| 1 | RLS / grants (`CLAUDE.md`) | a missing grant produces a silent `42501` that failure-tolerant loaders swallow |
| 2 | `verify-cert` `i18n.approved` | selecting a column that did not exist yet made PostgREST fail the whole query; `?? []` turned it into "this cert has no translations" and the check **skipped**. SM-AI-II went from 1 fail to 0 fail with nothing fixed |
| 3 | `verify-cert` item paging | one page errored, the bank came out empty, and the run reported **three confident failures** against AIMS-IA's 2,160 healthy items |

**Ranked by consequence, not by count.** A dropped read in a catalogue listing shows an
empty page and someone notices. A dropped read in a gate reports PASS and nobody does.

---

## 1. Fixed — reported a believed number or a PASS

### `certidemy-web/lib/console/readiness.ts` — the pass mark defaulted

```ts
let passingScorePct = DEFAULT_PASSING_PCT;   // 80
```

A dropped read left the threshold at 80 and judged the whole roster against it. No error,
no blank.

**Measured: all three Level II certifications use 75** — AIMS-IA, ISMS-IA, SM-AI-II — and
the nine Level I certs use 80. **Invisible on 9 of 13 and wrong on exactly the 3 where it
mattered.** That is why it survived: the default was right often enough to look correct.

**There is now no default on this path, and that is the point** — a different default
would not have fixed it. A cert whose pass mark cannot be read produces **no readiness at
all**: it is listed in `unavailableCerts`, absent from `passingByCert`, and its pairs are
absent from `byPair`.

**Why "unavailable for this cert" rather than an error for the page.** `ready` is a
verdict about a *person*. The safe failure for a verdict is to withhold it. Throwing would
blank a roster that spans other certifications whose pass marks read fine — and readiness
is keyed per `(holder, cert)` precisely because a roster is mixed, after the bug where
everyone was scored against SM-AI-I. The error path must not reintroduce the cross-cert
coupling the data model removed from the happy path.

**There were TWO defaults on this path.** `app/[locale]/console/people/page.tsx` had its
own `?? 80`, so fixing the library alone would still have rendered a pass-mark tick at 80
for a certification that declares 75. Both are gone; the table is not rendered without a
mark that was actually read, and `consolePeople.readinessUnavailable` says so in three
languages.

> **Still open, pre-existing, NOT a dropped-read bug:**
> `passingScorePct = knownMarks[0]` takes the **first** cert's pass mark and applies it to
> every row. On a roster spanning a Level I and a Level II certification that is wrong
> whatever the read does. Fixing it means threading a per-row mark through
> `ReadinessRosterTable` → `readiness-detail-modal` → `DomainBar`, all typed `number`.
>
> **Also residual:** a row whose cert is unavailable currently renders the same as a
> learner with no mastery data, because both are a missing `byPair` entry. Separating them
> needs the same four-component change.

### `functions/get-governance-snapshot/index.ts` — 78 counts, `count ?? 0`

13 certs x 2 pools x 3 languages, sequential. One failure reported **zero items** in that
cell, on the surface built to show an assessor per-clause evidence.

Fixed **at the boundary**, not per cell: a `must()` wrapper throws, the handler's existing
`catch` returns 500, and the console shows a failure instead of a snapshot that looks
complete. **A governance snapshot has no partial form** — "some of these numbers are real"
is not a state a reader can act on, and there is nowhere in the payload to say which ones.

**The authorisation read is deliberately NOT wrapped.** `profiles.platform_role` must keep
failing **closed**: a null profile is a 403, and throwing would turn a denial into a 500.
A post-condition in the fix script asserts it stays unwrapped.

---

## 2. Fixed — manufactured a false FAILURE

Less dangerous than a false pass and more corrosive than it looks: a checker that cries
wolf is one people learn to skim, and this document already argues that a baseline nobody
trusts turns the next real failure into noise.

All in `scripts/verify-cert.mjs`, now behind the same `must()` wrapper that aborts the run
naming the certification and the query:

| read | the false failure it produced |
|---|---|
| `quiz_questions` paging | "120 below floor", "pool can fill a form: 15 shortfalls" |
| `question_concepts` leak count | **`count ?? 0` reported zero leaked links — the answer that PASSES.** A secure-firewall check must never fail open |
| `task_concepts`, `lessons` | traceability and lesson checks against an empty set |
| `v_coverage_summary` | "the coverage view is empty" |
| `jta_versions` | "no jta_versions row at all" against a published JTA |
| `achievements` | "0 achievement row(s) — expected exactly 1", pointing the reader at `CERT-PUBLISH-CHECKLIST` 6.7 to insert a row that already exists |
| `certifications.validity_days`, `lessons` (scheme claims) | a **declared claim** looks false — the most expensive false failure in the file, because it reads as the scheme document lying about the product |

The last two were found by the fix script's own negative half, which refuses to finish
while any unwrapped `db.from` read remains inside `verify()`. **It counted rather than
trusting my list, and the list was short by two.**

---

## 3. Deferred, decided elsewhere

`functions/score-mock-exam/index.ts` lines ~542 and ~556-563 — `jta_version_id` and
`company_id` are each wrapped in `try/catch` that degrades to `null` and a `console.warn`.
A dropped read mints a credential with **no JTA provenance stamp**, or attributed to **no
sponsoring company**. The exam is scored correctly; the record of what it was scored
against is permanently missing, and nothing downstream distinguishes "no sponsor" from
"we failed to look".

Also `:380` — `existing_mastery ?? []` treats every prior attempt as zero, so the mastery
feed writes a wrong baseline.

**Not fixed here on purpose.** Making the mint fatal has its own failure mode: a passing
candidate receives nothing, which is exactly what migration 292 existed to prevent.
Options are recorded with the decision, not here.

---

## 4. EXAMINED AND SAFE — backstopped by a unique index

**Do not "fix" these without reading the backstop.** A dropped read degrades a friendly
409 into a `23505` from the database. That is a worse error message, not a wrong answer.
Index definitions confirmed from `pg_index` on 2026-09-11.

| site | what the read pre-checks | backstop |
|---|---|---|
| `functions/create-lti-platform/index.ts:156` (`sameIss ?? []`) | duplicate `(iss, client_id)` | unique index on `lti_platforms`. The code already says so: *"the unique index is the real guard"* |
| `functions/create-partner-issuer/index.ts:224` | company already has an issuer | unique index on `issuers`. *"the UNIQUE index is what actually guarantees it"* |
| `functions/create-partner-issuer/index.ts:239` | slug taken | same |
| `functions/create-partner-achievement/index.ts:258` | achievement code taken | unique index on `achievements` |
| `functions/issue-partner-credential/index.ts:216` | idempotency replay | **`issuer_api_requests_idempotency_unique`** *and* **`credentials_idempotency_unique`**, both partial on `idempotency_key IS NOT NULL`. `_shared/issue.ts` distinguishes the two deliberately — retrying on one mints a duplicate, returning the original on the other is correct |
| `functions/score-mock-exam/index.ts:618` | credential already exists | **`credentials_one_active_per_cert`** — `(user_id, certification_id) WHERE status = 'active'` |
| `certidemy-web/lib/appeals/actions.ts:113` | an appeal is already open | **`appeals_one_open_per_attempt`** — `(exam_attempt_id) WHERE status IN ('open','under_review')`. The code calls itself *"the friendly path"* and points at the header for why it is not the guarantee |

---

## 5. EXAMINED AND SAFE — fails closed

**Do not "fix" these either.** A dropped read here produces a refusal, which is the
correct direction.

| site | behaviour on a dropped read |
|---|---|
| `functions/_shared/authorize.ts:98` `requireIssuerAccess` | `issuer` null → `companyId` null → **403**. The gate `CLAUDE.md` calls the only thing between a learner JWT and another organisation's signature fails safe |
| `functions/get-governance-snapshot` `profiles` read | null profile → **403**, and it is left unwrapped on purpose (see §1) |
| `functions/generate-mock-exam` (`mode="exam"`) | a dropped `tasks` read empties `domainByTask`, every domain shortfalls, and the integrity gate throws **409** rather than serving an off-blueprint form. `mode="simulator"` tops off from fillers — practice only, and the code says so |
| `functions/score-mock-exam:287` | `if (!questions) throw new Error("failed to load questions")` |
| `functions/score-mock-exam:176` | captures `siErr` explicitly: *"A read error is a retry, never a reason to trust the browser"* — this class was already fixed here |
| `functions/_shared/issue.ts` | captures every error; inspects error text because two distinct unique indexes need opposite handling |
| `certidemy-web/lib/enrollment/actions.ts:48, :98` | `cert` null → `not_found` |
| `certidemy-web/lib/appeals/actions.ts:103` | `attempt` null → `attempt_not_found`; the select is already RLS-restricted to the caller's own attempts |
| `scripts/audit-grounding-compliance.mjs:113` | captures `error` and `process.exit(1)`. The unguarded `tasks` read at `:119` blanks a defect's task **label** only — verdict and exit code are unaffected |

---

## 6. Empty page, someone notices

~40 sites: `lib/catalog/data.ts`, `lib/blueprint/data.ts`, `lib/dashboard/*`,
`lib/modules/*`, `lib/console/library.ts`, `functions/get-certification-blueprint`.
Left alone. `lib/credentials/claim.ts:30` is an explicit `try/catch → null` with its
reason written down: *"Never take the dashboard down for a caption."*

---

## 7. LATENT — the exam path has no pagination

`generate-mock-exam`, `get-active-exam-session` and `score-mock-exam` contain **zero**
`.range()` calls. PostgREST caps an unfiltered select at **1,000 rows**.

A bank exceeding that in one `(certification, pool, language)` bucket would be silently
truncated and forms drawn from a partial pool — **a wrong answer indistinguishable from a
smaller bank.** `verify-cert` already paginates for exactly this reason, and says so:
*"PostgREST caps a select at 1000 rows. A naive `.select("pool, language")` returns the
first 1000 of a 3,000-row bank and yields counts that are wrong AND plausible."*

**Measured 2026-09-11: no bucket exceeds 800 rows.** SM-AI-II's 1,056 secure items divide
to roughly 352 per language. So it is not biting.

> **It bites whoever crosses 1,000 first.** The two ways that happens are **adding a
> language** (which redistributes nothing — it adds rows) and **raising a per-task,
> per-language floor**. Check before either:
>
> ```sql
> select c.code, q.pool, q.language, count(*)
> from public.quiz_questions q join public.certifications c on c.id = q.certification_id
> where q.retired_at is null and q.status = 'approved'
> group by 1,2,3 having count(*) > 800 order by 4 desc;
> ```
>
> Any row returned means `generate-mock-exam` needs `.range()` paging before that bank
> grows further.

---

## 8. How to re-run this sweep

Search for the **shape**, not the symptom:

```
const { data } = await            # error discarded
const { count } = await           # error discarded, and ?? 0 is the dangerous form
?? []   ?? 0   || []              # a failed read becomes a legitimate-looking empty result
```

Then ask the only question that ranks them: **can this produce a wrong answer, as opposed
to a crash or an empty page?** Sections 4 and 5 are the sites where the answer is already
known to be no.
