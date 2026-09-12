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

## 7b. A PATTERN DEFECT IS THE SAME CLASS AS A DROPPED READ

A dropped read turns a broken query into a legitimate-looking empty result. **A
defective pattern turns a correct corpus into a legitimate-looking defect list, or
a defective corpus into a legitimate-looking all-clear.** Same consequence, same
invisibility, same ranking rule: the dangerous direction is the one that looks fine.

`RETIRED_HARD` — the prior-edition Scrum vocabulary pattern — **has now been wrong
three different ways in eight days.** Each was found by a different route and
**none of them was found by the check itself.**

| # | the defect | direction | how it was found |
|---|---|---|---|
| 1 | **Single-language.** The check read English only, so `SPO-AI-I` was reported as 35 items when the Spanish and Portuguese rows were never looked at | **under**-count | adding es-419 / pt-BR to the check, 2026-09-11 |
| 2 | **Boundary.** `\b` does not stop `equipo de desarrollo` matching inside `sub-equipo de desarrollo`, because a hyphen IS a word boundary. Scenarios about a Scrum Team split into a testing sub-team and a development sub-team — where **the sub-team is the misconception under test** — were counted as defects. Thirteen on SPO-AI-I, two on SM-AI-I | **over**-count | reading the nine stem hits before sweeping them |
| 3 | **Per-language blindness.** Each language's pattern looked only for that language's words. A translator can LEAVE THE ENGLISH IN PLACE, and did: four secure rows read `"el Development Team insiste en reordenar"`. `RETIRED_HARD["es-419"]` had no English forms, so an untranslated English retired term inside a Spanish row was invisible | **under**-count | a census query that used ONE pattern across all languages |

**Defect 3 produced a false all-clear that a re-read could not catch**, because the
re-read used the same pattern that had the blind spot. Verifying with the instrument
under suspicion is not verification.

### THE RULES THIS EARNED

**A PATTERN DEFECT IS INVISIBLE TO THE PATTERN.** Every defect recorded here was
found by measuring a SECOND WAY. **Not one was found by running the same check
again more carefully** — and that instinct is the one to distrust, because a
re-read performed with the instrument under suspicion inherits its blind spot and
returns the same answer with more confidence than before.

Six rules, each with the instance that bought it.

**1. RUN THE CENSUS WITH A SINGLE CROSS-LANGUAGE PATTERN — permanently, as a
second independent measurement, not as a one-off.**

> Four secure rows read `"el Development Team insiste en reordenar"`. The Spanish
> pattern looked for Spanish words; a translator had left the English in place, so
> `RETIRED_HARD["es-419"]` could not see it. The per-language check reported
> SPO-AI-I clean, and **a false all-clear was reported on rows that HAD been read
> back** — because they were read back with the pattern that had the blind spot.

**2. ADD THE OTHER LANGUAGES TO ANY CHECK THAT READS ONE.**

> `SPO-AI-I` was reported at 35 items by a check whose selection was
> `language = 'en'`. The es-419 and pt-BR rows had never been looked at.
>
> On SM-AI-I this was not a rounding error. The English was **already correct in
> all fourteen affected groups**, and every defect sat in the translations —
> including one group where English read `self-managing`, Portuguese read
> `auto-gerenciaveis`, and only the Spanish had drifted. An English-first read
> reports that certification clean forever.

**3. READ THE HITS BEFORE SWEEPING THEM.**

> `\b` does not stop `equipo de desarrollo` matching inside
> `sub-equipo de desarrollo`, because a hyphen IS a word boundary. Scenarios about
> a Scrum Team splitting into a testing sub-team and a development sub-team —
> **where the sub-team is the misconception under test** — were counted as defects.
> Thirteen on SPO-AI-I, two on SM-AI-I. Reading nine stems found it; no amount of
> re-running the count would have.

**4. A DRY RUN MUST PRINT BEFORE AND AFTER ON EVERY KEY IT TOUCHES.**

> A swap proposed `"Replace 'self-organize' with 'self-manage'"` ->
> `"Replace 'self-manage' with 'self-manage'"`. The item taught the terminology
> change; the fix for the terminology destroyed the item. **A count of rows changed
> would have read `1` and been correct.** Only the text shows it.
>
> The same defect LANDED where no dry run printed it: SM-AI-I `4875d8cb` read
> *"Developers self-manage and self-manage"* in the live database until 2026-09-12.
> Note also what the guard must NOT be — a lexical search for the retired term,
> since an item that teaches the change quotes it on purpose. Three `1.1` groups
> were rejected from flagging when what looked like prose quotation marks around a
> retired term turned out to be **JSON string delimiters** in the serialised
> `options` column. The property was positional, not lexical.

**5. THE DAMAGE A REPAIR DOES IS INVISIBLE TO THE CHECK THAT DEMANDED THE REPAIR.**
(2026-09-12)

> Swapping `the Development Team` -> `the Developers` changes NUMBER. Three rows
> kept their singular verb and shipped ungrammatical: *"the Developers presents
> completed work and receives"*, *"the Developers owns acceptance criteria
> phrasing"*, *"The Developers selects how much work to pull into a Sprint"*.
>
> **Two of the three were in SECURE banks the vocabulary check had just certified
> clean — and the check was right. The vocabulary WAS clean.** No vocabulary
> pattern can see grammar, so the fix passed the only test anyone ran on it.
>
> The 2026-09-12 sweep carried an agreement pass that BLOCKED its own write and
> reported for a human read. It must not auto-fix: *"Delegating review to the
> Developers is a mistake"* takes a singular verb correctly, because the subject
> is "Delegating". It caught `the Developers has no authority` on its first run.
>
> That pass was part of the sweep script and would have died with it, so it was
> promoted the same day: **`verify-cert` invariant 26, `items.agreement`**.
> WARN only, English only, never auto-fixing, and it says in its own output that
> a human must read each hit.
>
> **It is scoped to two shapes because that is all there is evidence for.**
> `the Developers` + a singular verb, and the double-swap tautology `X and X`.
> A third was considered and REJECTED: `the Scrum Team` + a singular verb is
> **correct English** — a collective singular, and the Scrum Guide itself writes
> "The Scrum Team is". The mismatch shape there would be a PLURAL verb, and
> measuring it across all four Scrum certs returned **26 hits, every one of them
> correct** — 24 are "What should the Scrum Team do?", where `do` is an
> auxiliary carrying no number. Shipping it would have added 26 permanent false
> warnings, which is precisely how a check becomes one people skim.
>
> Run across all thirteen on 2026-09-12: **four Scrum certs PASS over 3,434
> English items, nine skip as non-Scrum.** No sweep damage survives anywhere
> else. The check is not vacuous — its two patterns were behaviour-tested
> against all four original defect strings and against the known false positive
> *"Delegating review to the Developers is a mistake"* before being committed.

**6. COUNT OCCURRENCES PER FIELD. A FIRST-MATCH SAMPLE IS NOT THE ROW'S CONTENTS.**
(2026-09-12)

> `regexp_match` returns the FIRST match only. The census printed one context per
> row, one anchor was built per row, and **eleven rows across six SM-AI-I groups
> kept a second occurrence in `options`** after their `explanation` was fixed.
>
> They were caught only because the rows still failed the check on the next pass.
> Had the anchor been the last occurrence rather than the first, the pass would
> have reported done and been wrong. Select
> `count(*) from regexp_matches(..., 'g')` per field, not a context sample.


```sql
-- The second measurement. One pattern, every language, no per-language routing.
-- Disagreement with verify-cert's per-language count is a PATTERN defect until
-- proven otherwise - not a content finding.
select c.code, q.pool, count(*) as rows, count(distinct q.question_group_id) as groups
from public.quiz_questions q
join public.certifications c on c.id = q.certification_id
where q.retired_at is null and q.status = 'approved'
  and (q.question_text || ' ' || coalesce(q.explanation,'') || ' ' || q.options::text)
      ~* '(self-organiz|auto-?organiz|equipo de desarrollo|(time|equipe) de desenvolvimento|development team)'
group by 1, 2 order by 1, 2;
```

Postgres has no lookbehind, so this query **over**-counts by defect 2's amount — and
that is the point. **The two measurements are wrong in opposite directions**, so
where they agree the number is real, and where they differ the difference names the
pattern bug. Neither alone is evidence.

```
CENSUS 2026-09-12, after all three PATTERN fixes and BEFORE the content work
that same day. This is the size of the problem as correctly measured, not
the state of the banks:

  cert       pool      rows  groups   key  stem  dist  expl   quoted-in-stem
  SD-AI-I    secure      15       5     3    15     3    12        4
  SD-AI-I    practice    58      20     9    21    40    39       12
  SM-AI-I    secure      50      20     6    27    34    22       12
  SM-AI-I    practice    52      20     7    17    46    37       11
  SM-AI-II   secure       0
  SM-AI-II   practice     0
  SPO-AI-I   secure       4       2     0     2     4     2        0
  SPO-AI-I   practice    99      33     3    18    80    48        0
```

```
CENSUS 2026-09-12, AFTER the content work. Both measurements, all four Scrum certs.

  cert       pool      none  quoted  groups   what the "none" rows are
  SD-AI-I    secure       0      15       5   -
  SD-AI-I    practice     0      33      11   -
  SM-AI-I    secure       2      18       6   sub-equipo / sub-equipe boundary
  SM-AI-I    practice     1      16     5+1   7a8e3341, ordinary English (adjudicated)
  SM-AI-II   secure       0       0       0   -
  SM-AI-II   practice     0       0       0   -
  SPO-AI-I   secure       3       0       0   sub-equipo / sub-time boundary
  SPO-AI-I   practice     0       0       0   -

  TOTAL FLAGGED: 82 rows, 27 groups, plus 1 ungrouped orphan row.
```

**Every remaining `none` row is accounted for**, and none of them is a defect:
five are the census's own documented over-count (Postgres has no lookbehind, so
`equipo de desarrollo` matches inside `sub-equipo de desarrollo`), and one is
the adjudication recorded below. `verify-cert`'s per-language pattern carries
`(?<![\w-])` and correctly excludes all five — **the two measurements disagree
by exactly the amount §7b predicts they should**, which is what makes their
agreement elsewhere mean something.

**`quoted-in-stem` is the terminology-drift signature**: the retired term sits
immediately after a quotation mark in the stem, which means the item is showing the
candidate a legacy document rather than asserting the term. Those get
`retired_vocabulary_intent = 'quoted'` (migration 298), not a fix. The rest are
defects.

### TWO ADJUDICATIONS FROM 2026-09-12, RECORDED SO THEY ARE NOT RE-LITIGATED

**1. `7a8e3341` (SM-AI-I practice, 5.8) STAYS AS IT IS, AND STAYS A WARN.**

Its stem reads *"Functional silos between QA and development teams cause
integration delays every Sprint."* That is **ordinary English for two functional
groups**, not the Scrum accountability the 2020 Guide renamed. It is therefore
neither `none` in the sense of "a defect" nor `quoted` in the sense migration
298 defines — the item is not showing anyone a legacy document.

It was left unchanged on purpose. **Rewriting an item so that a checker stops
complaining is the check editing the content**, which is the same error migration
290's guard 1 made when it aborted on a note that quoted the phrase it forbade.
The cost of leaving it is one permanent WARN row on a non-secure pool, which is
cheap; the cost of rewriting it is a scenario bent around a pattern.

**A THIRD value on `retired_vocabulary_intent` is NOT justified by this row.**
Migration 298 reserved one for a genuinely new case, and one instance is not a
case — a value added for a single row is a value nobody will apply consistently.
**The evidence that would justify it is a SECOND instance.** If ordinary-English
"development team" turns up again in another certification, add the value then,
with both rows named in the migration header.

**2. THE ORPHAN FLAG ON `264a4b75` IS STORED AND INERT, DELIBERATELY.**

That row (SM-AI-I practice, 5.7, es-419) is pure terminology drift — a scenario
about a team that adopted Scrum from 2017 materials, quoting `auto-organizados`
throughout — so it was set to `retired_vocabulary_intent = 'quoted'`.

**`verify-cert` will not honour it.** The exemption is read per GROUP, and this
row has `question_group_id = NULL`. The filter is
`!(q.question_group_id && quotedGroups.has(...))`, so a null group id falls
through to the FAIL/WARN population whatever the flag says.

This is recorded against **SM-AI-I's standing "20 ungrouped items" FAIL**, not
treated as a bug in 298. The flag is a stored adjudication that **becomes live the
moment the item is grouped**, and a written judgement that nothing reads yet is
better than no record — the next person to fix the grouping inherits the reading
instead of repeating it. Do not "fix" it by making the exemption row-keyed: the
group key is what stops a re-translated sibling losing an exemption the other two
rows keep, which is the whole reason 298 keys on it.

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
