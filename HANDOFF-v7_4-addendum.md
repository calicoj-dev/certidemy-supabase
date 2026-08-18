# HANDOFF v7.4 addendum - deployed and rendering

**Same session as v7.4.** Read v7.4 section 1 (THE REFRAME) first; nothing here
changes it. This records what shipped after the handoff was written.

**Migration tip still 226.** No DDL in this stretch.
**supabase repo:** `2fd5316`. **web repo:** `3b61593`.

---

## 1. WHAT IS NOW LIVE

| | |
|---|---|
| Edge function | `analyze-curriculum`, deployed, `verify_jwt = true` pinned |
| Console route | `/[locale]/console/coverage`, in the nav for platform_admin AND marketing |
| Platform invariants | `scripts/verify-invariants.mjs`, 6/6 green |
| Shared PostgREST helper | `scripts/_pg.mjs`, paginating |

Both repos build green. Cloudflare deployed `3b61593`.

### 1.1 The function

`functions/analyze-curriculum/index.ts`. Two modes:

- **`fit`** - rank one syllabus against every available certification. Gates,
  drift and weighting computed ONCE on the text; only concept matching is
  per-certification, so eleven blueprints is nearly free.
- **`report`** - readiness report + build plan for one certification, persisted
  to `analysis_runs` / `analysis_findings`.

**`verify_jwt = true`, pinned in `config.toml` line 478.** This is the INVERSE of
the OB3 rule. Public OB3 endpoints need `false` pinned because a missing pin is a
silent 401; this one is admin-only and reads competitor intelligence, so a
missing pin would EXPOSE it. Pin by name either way.

**Closed while we were in there:** `verify-credential` (line 446) and
`credential-og` (line 463) were already pinned `verify_jwt = false`. The v7.2
open item about them is stale - they are fine.

**A failed insert returns 500.** The suppression CHECKs are the last defence
against storing a number the engine refused to compute; swallowing a 23514 would
hide exactly the bug they exist to catch. This is the `score-mock-exam` failure
mode - HTTP 200 while minting nothing - and it is deliberately not repeated.

### 1.2 Authorization, and one thing I got wrong first

The function originally read `profiles.role`. **That column does not exist** -
it is `profiles.platform_role`, an enum of exactly
`learner | platform_admin | marketing`. The wrong comparison would have
evaluated false for EVERY caller: an admin 403-ed out of their own tool with
nothing in the logs to explain it.

It also originally took `company_id` FROM THE REQUEST BODY and checked the
feature grant against it. That is wrong: a caller could pass any company id.
`lib/console/access.ts` already resolves the partner company from
`team_members` membership, and that is the pattern to follow when Renderer B is
built. **Never trust a company id from the client.**

**Role split, deliberate:**

- `platform_admin` - fit + report + build plan
- `marketing` - **fit only**

`marketing` is included because `access.ts` describes it as the sales-library
seat, existing "so a sales rep never needs a role that can flip certification
status, issue vouchers, or edit credential holder names." A prospect fit scan is
exactly that seat's job. The build plan is the licensed material and stays with
platform_admin until partners have Renderer B.

**The check lives in the server action, not the component.** A server action is a
reachable HTTP endpoint whose URL happens to be generated; anyone who can load
the page can invoke it directly. Re-resolving console access on every call is the
only check that cannot be bypassed.

### 1.3 The console surface

- `app/[locale]/console/coverage/page.tsx` - server component, `runtime = "edge"`
- `app/[locale]/console/coverage/actions.ts` - server actions, authorization
- `lib/console/coverage-analysis.ts` - calls the function server-side
- `components/console/coverage-analyzer.tsx` - the UI

**No token handling anywhere.** The session is in cookies (SSR), so
`supabase.auth.getSession()` supplies the JWT server-side and it never reaches
the browser. An earlier attempt to smoke-test the function from PowerShell with
the service key failed with 401 - correctly, since a service key is not a user
JWT - and hunting for a token in localStorage failed too, because there is none.
The console page IS the test.

**Named `coverage`, NOT `readiness`.** `lib/console/readiness.ts` already owns
that word for LEARNER exam readiness (`LearnerReadiness`, `loadRosterReadiness`).
Two things called readiness in one codebase is how someone reads the wrong one.

**The UI is functional, not designed.** It uses the console's CSS variable tokens
and mirrors the governance page's structure, so it is not foreign - but it has
not had a design pass. The certifications page is already carrying that debt;
this adds a little more.

---

## 2. THE PAGINATION BUG - and why it was the worst one

`verify-invariants.mjs` shipped without pagination. **PostgREST caps a response
at 1000 rows by default and says nothing about it** - 200 OK, 1000 rows, no
warning.

It fetched 1000 of 1599 concepts and reported the other 599 as having no lesson
and no task: **606 false failures on completely healthy data**, from the one tool
whose entire job is to be believed when it reports a problem.

> **A checker that cries wolf is worse than no checker.** People learn to dismiss
> it, and then it is silent when something is genuinely broken.

Fixed by `scripts/_pg.mjs`, a shared paginating `getAll()` used by
`verify-invariants`, `dump-blueprint`, `dump-drift-rules` and
`propose-match-terms`. `BlueprintReader.#select` paginates too - verified against
a 2350-row stub - because a truncated blueprint in production would produce a
readiness report that UNDER-COUNTS a partner's coverage with nothing looking
wrong.

**Two related traps in the same helper:**

- `getAllIn()` chunks `in.(...)` filters at 300 ids. 1599 uuids is ~60KB of URL,
  which fails as a request line long before it fails as a query.
- **Any query that may cross a page boundary needs an explicit `order=`.**
  Without a stable sort, PostgREST does not guarantee pages line up and rows can
  duplicate or vanish across them.

---

## 3. THE `.gitignore` TRAP

`certidemy-web/.gitignore` line 7 was a bare `coverage` - a standard Jest/nyc
entry. **A bare pattern applies at ANY depth**, so it silently swallowed
`app/[locale]/console/coverage/`.

The local build was GREEN, because `next build` reads the disk. The commit
succeeded, reporting "3 files changed". Cloudflare then failed with **"No
deployment available"**, because `layout.tsx` linked to a route that was not in
the repo.

Fixed by anchoring to the repo root: `/coverage`. Still ignores test output;
no longer eats a route. The supabase repo has no bare `coverage` pattern.

> **RULE: after any commit that adds a route, verify with `git ls-files`, not
> with a green build.** The build reads the disk; the deploy reads the repo, and
> today those disagreed.

**And a related trap that cost three separate mistakes:** `[locale]` is a
character class to PowerShell AND to git pathspecs.

- `Get-ChildItem 'path\[locale]\...'` returns EMPTY - use `-LiteralPath`
- `New-Item` has NO `-LiteralPath` - use `[System.IO.Directory]::CreateDirectory`
  (it silently created a FILE named `coverage` instead of the directory)
- `git ls-files "app/[locale]/..."` returns EMPTY - use
  `-- ":(literal)app/[locale]/..."` or pipe through `Select-String`
- `[System.IO.File]::ReadAllText('.gitignore')` resolves against the .NET working
  directory, NOT PowerShell's - always pass an absolute path

---

## 4. TYPE SAFETY EARNED THREE BUILD FAILURES

`npm run build` rejected the console component three times, and every rejection
was a real runtime bug:

1. Casting a typed `FitResult` to `Record<string, unknown>` - would have rendered
   blanks if a field name drifted.
2. `ReportView` typed loosely - `summary.extendedConcepts` possibly undefined.
3. `lessons[0].title` - `noUncheckedIndexedAccess` is ON in this codebase, so a
   `.length` check does NOT narrow the element. Test the element.

Fixed by exporting precise interfaces (`FitResult`, `FitRow`, `ReportResult`,
`CoverageReport`, `ReportSummary`, `ReportDomain`, `PlanItem`, `PlanConcept`)
from `lib/console/coverage-analysis.ts` and narrowing with `isFit()` /
`isReport()` guards rather than casting past them.

**Those interfaces MIRROR `_shared/analyzer/report.ts`; they do not import it.**
The web app cannot reach the supabase repo. If the function's response shape
changes, that file must change with it - and the guards are what make a mismatch
a build error instead of a UI quietly rendering blanks.

None of this would have surfaced in the local harness, which runs plain
JavaScript with no type checking.

---

## 5. FIRST LIVE RUN - what to expect

`/en/console/coverage`, paste the TUV SUD text, **Scan all certifications**:

| | |
|---|---|
| SPO-AI-I | ~23.9% |
| SM-AI-I | ~19% |
| ISO certs | 0-2% |
| framework | `scrum_guide_2020` |
| drift | 2 findings |

Identical to the local harness. Then **Build plan** against SM-AI-I: 107 concepts
across 53 tasks, 20 addressed, D5 at 0%, tasks listed with lesson names.

**That run persists.** It will be the first row in `analysis_runs`:

```sql
select id, source_kind, source_word_count, coverage_pct, clean_pass,
       engine_version, created_at
from public.analysis_runs order by created_at desc limit 5;
```

---

## 6. NEXT

1. **Load the page and judge the design.** Functional, not designed.
2. **Multilingual embedding matcher.** Would fix BOTH the low readiness figures
   (a task counts as addressed only when every concept beneath it matches, and
   lexical matching under-detects) AND the AulaUtil `language_unsupported`
   suppression. pgvector and Voyage are already deployed.
3. **`propose-match-terms.mjs` still has 2 of 4 bugs.** Language filter and
   headings-only are fixed; still unfixed: no discrimination between concepts
   sharing a lesson, and `concepts.description` unused as a source. Lower
   priority - v7.4 section 5 explains why match terms were the wrong fix for D3.
4. **Renderer B** - blocked, `public.companies` has 0 rows.

**Still open from v7.3, untouched:** the 48 unexamined item-bank hits, es-419 and
pt-BR drift rulesets, the CSM blog's 6-vs-3 drift gap, BCS EXIN's 20 unread
reverse gaps, the invariant runner in CI, and the worker repo with no remote.

---

## 7. THE LESSON

v7.4 said: four times a number was believed instead of inspected, and each
inspection reversed the conclusion.

This stretch adds a sharper variant. **Four times an operation reported success
on nothing:**

- PostgREST returned 1000 rows of 1599, HTTP 200, no warning.
- `Get-ChildItem` on a bracketed path returned empty - it looked like an answer.
- `git add` succeeded while the files were ignored - "3 files changed" was true
  and misleading.
- `[System.IO.File]::ReadAllText` read the wrong directory and the follow-up
  regex reported "0 matches" - a clean-looking result from a file never opened.

The tell each time was a suspiciously round or empty result: **1000**, **0 rows**,
**no output**. Same family as `create table if not exists` skipping silently and
`grep | head` masking an exit code.

> **A command that succeeds on nothing is the most expensive kind of bug,
> because its output looks like an answer.**
