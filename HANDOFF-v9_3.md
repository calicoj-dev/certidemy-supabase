# HANDOFF v9.3 — four things that were built correctly and connected to nothing

**Migration tip: 276. Next free: 277.** Read the disk, not this line —
`ls migrations/ | tail -1`.

**Ten migrations, 267 through 276**, after three consecutive sessions with none.
Two of them (269 and 272) contain no executable statement at all, which is the
shape most of this day took.

**THIS WAS NOT A FEATURE DAY.** Almost nothing new was designed. What the day
consisted of, four times over, was finding a component that had been built
carefully, that worked exactly as specified, and that **was never joined to the
thing standing next to it**.

None of the four had failed. None had logged an error. None appeared in any
monitor. A missing connection has no failure mode — it has an absence of events,
and nothing on this platform watches for those. Each was found the same way: by
asking **what reads this**, and following the answer until it ran out.

| what was built | what was missing | measured |
|---|---|---|
| the CLI migration ledger | anything that writes to it after `009` | **7 rows against 268 files, and one of the 7 has no file** |
| `is_platform_admin()`, `is_team_admin_of()` | any file that creates them | **45 and 12 policies depend on them** |
| `enqueue_email` and the whole Resend chain | any caller, ever | **dormant since 243; 5 leads unread since 2026-08-18** |
| `captureAttribution` / `decorateCertiGlobalLink` / `track()` | any caller, ever | **10 click-ID parameters captured from nothing** |

---

## 1. The four

### 1.1 The migration ledger stopped at 009, and it disagrees in both directions

`supabase_migrations.schema_migrations` holds **seven rows**: `002` through
`009`. `migrations/` holds **268 files**. Measured live 2026-09-02.

**262 files the ledger has never heard of** — everything from `010` onward, which
is to say everything this repository has done.

**AND ONE LEDGER ROW WITH NO FILE, WHICH IS THE HALF THAT WOULD HAVE BEEN
MISSED.** `009_unpublish_placeholder_until_ready` is recorded as applied and
**there is no `migrations/009*` on disk, at any commit, ever** — no deletion
commit, nothing at any ref. It is the only file in the ledger's range that does
not exist here. Checking only that the files are absent from the ledger would
have passed cleanly over a row asserting something ran that this repo has no
record of at all.

**The ledger has been wrong since `010` and there is no mechanism that would ever
have made it right.** It is written by the Supabase CLI on `db push`. This repo
is **editor-first by deliberate policy** — SQL is run in the browser SQL editor
and the numbered file is a *record* of what already ran — so the CLI does not
apply migrations here, and therefore never writes the ledger.

**That is not a bug in the workflow. It is the absence of the second half of
it.** The editor-first decision is sound and stays; what was never built is
anything that reconciles the files against the database afterwards. **`supabase
migration list` is actively misleading against this project** and should not be
used to answer "what has run".

**This is the mechanical form of the gap 269 named in prose**: the space between
*"it ran"* and *"it was written down"*, which nothing currently closes except
memory. 268, 270, 271, 272, 273 and 274 all exist because of it.

### 1.2 The two predicates the entire RLS layer rests on existed in no file

`is_platform_admin()` and `is_team_admin_of()` are the authorisation backbone of
every policy in the system, and until 270 they appeared in no migration
anywhere. They **predate this repository**: `003`, the earliest file present,
already calls `is_platform_admin()` in policy definitions from line 280.

**45 of 117 policies depend on the first. 12 depend on the second.** Rebuild
this database from the files and **all 57 policies would fail on an undefined
function** — not at some later runtime, but at creation.

Captured in a five-file sequence, and what it *could not* capture is the more
useful half:

- **270** — both function bodies byte-for-byte from `pg_proc.prosrc`, md5s in the
  header. **Neither pins `search_path` and every comparable function does.**
  `can_read_issuer`, `is_company_admin` and `user_has_cert_tie` all carry
  `search_path=public`; these two carry none, consistent with predating the
  convention. **270 deliberately does not pin them** — that would change the
  definition and turn a capture into an edit. Hardening is now possible against a
  recorded baseline, which it was not before.
- **271** — `platform_role` and `team_role`, read from `pg_type`/`pg_enum` rather
  than from the values handed over. **Ordinal order is part of the type** and is
  asserted. Also records the mirrored pair nobody asked about:
  `company_invites.role` is TEXT under a CHECK carrying the same vocabulary by a
  different mechanism.
- **272** — **zero executable statements**, and the reasoning is the point.
  `profiles` cannot honestly be written as a `create table` from this repo: it
  hangs off `auth.users`, which Supabase provisions; a statement including that
  FK fails wherever `auth` is absent, and one excluding it **produces a different
  table** that would accept a profile for a user who does not exist and would not
  delete on account deletion. It depends on `citext` and `uuid-ossp`, neither of
  which has a `CREATE EXTENSION` anywhere. The captured object would be a
  fraction of the real one — **12 columns against 21 inbound foreign keys**, 2
  triggers, 2 policies. And the circularity does not close around two tables:
  `team_members` needs `companies`, which has no file either.
  **So 272 records the inventory instead**, including the 21 FKs grouped by
  delete behaviour — **18 CASCADE, 1 SET NULL, 3 no action** — because *that
  cascade set is the account-deletion contract and is written down nowhere
  else*. Recovery route stated plainly: `pg_dump --schema-only` against a live
  database, not a hand-written migration.
- **273** — the four RLS policies, which unlike the tables *are* fully
  reproducible. The `profiles` policies have **no `to` clause at all**
  (`polroles` 0, rendered as `{public}`) while `team_members` names `to
  authenticated`, and the stored quals call the helpers **unqualified**.
- **274** — `on_profile_created_claim_vouchers`'s `CREATE TRIGGER`, flagged in
  `CLAUDE.md` for weeks. **Guarded create, never drop-then-create**: this repo
  has already killed signup once by dropping a trigger on this path.

**The audit found the gap smaller than feared, not larger**, and 43b3be1 corrects
269 for claiming otherwise. Across nine object classes the undocumented set was
26 tables, 2 functions, 1 trigger, **0 views and zero unexplained content drift**
on cert `11111111-…` — all 86 seeded concepts match live exactly.

### 1.3 The email queue had never sent anything

Migration 243 built `email_queue`, `email_suppressions`, `enqueue_email`,
`claim_email_sends`, `complete_email_send` and `record_email_event`.
`dispatch-emails` has run on a one-minute `pg_cron` ever since. `resend-webhook`
has been listening.

**`enqueue_email` had never been called by anything. `email_queue` had never held
a row. `dispatch-emails` had been claiming nothing, every minute, since it
shipped.** `RESEND_API_KEY` and the sending domain were not merely untested —
they were **unproven**, and nobody could have said which.

The trigger was found from the other end. Migration 229 created `partner_leads`
on 2026-08-04 and connected it to nothing: the form validated, the endpoint
inserted, and `{ok:true}` was **truthful**. **Five leads sat unread from
2026-08-18.** Six consecutive handoffs carried *"229_partner_leads not wired"* as
an open item.

**No component was broken.** `submit-partner-lead` is loud on failure — it logs
the code and returns 500 deliberately, so a write failure was never silent.
There was simply no step after the insert.

275 wired it, and **the order inside the commit mattered**: `render()` knew
exactly one key and threw on anything else, and `dispatch-emails` classifies that
throw as **terminal** — one attempt, straight to `abandoned`, no retry, no email,
and the only trace in a `last_error` column nothing surfaces. **A trigger shipped
before its template would have reproduced the original silence one layer down.**

Proven end to end by a real send: queue id, provider message id, one attempt,
delivered webhook. **Forward only** — eight leads exist, exactly one has a queue
row, and the trigger went live between 14:01:19 and 14:04:34. The seven above it
will never be mailed, deliberately: seven emails about two-week-old leads would
be noise, and reading them is a console job that does not exist yet (§7).

### 1.4 There is no first-party attribution, and the code says there is

`lib/marketing/track.ts` reads as a description of a working system. It
describes nothing that runs. Traced end to end:

```
captureAttribution()        no callers. The cd_attrib cookie is NEVER SET.
readAttribution()           called only from two functions that are themselves
                            unreachable -- returns null in practice.
decorateCertiGlobalLink()   no callers. The buy CTA goes resolveBuyUrl() -> href,
                            undecorated.
track()                     never invoked from application code. The only event
                            reaching a vendor is "page_view", fired directly by
                            TagLoader at tag-loader.tsx:142.
```

**Ten click-ID parameters** — `gclid`, `wbraid`, `gbraid`, `fbclid`, `li_fat_id`,
`rdt_cid`, `msclkid`, `ttclid`, `epik`, `twclid` — plus five UTM parameters, all
captured by a function nothing calls. `checkout_start` is declared in the union,
registered in `MARKETING_EVENTS` and **mapped by eight vendor adapters**, and has
never once been fired.

**THE CHAIN BREAKS ONE STEP EARLIER THAN THE DECORATOR**, which changes what the
fix is. With no cookie ever written, wiring the decorator alone produces nothing.

**And the decorator may be unnecessary rather than unwired.** The design assumed
checkout happened on a *different registrable domain* — which is exactly what a
link decorator exists to bridge. Checkout is now `go.certidemy.com`, a subdomain,
so a first-party cookie at `Path=/` may carry on its own. **One of those is
deleted and the other is connected**, and which applies depends on the cookie's
`Domain` attribute and on what the storefront can read — neither settled in that
repository. The note says so rather than picking.

**The old comment's worst line was the emphatic one**: *"WITHOUT THIS, NO AMOUNT
OF PIXEL CONFIGURATION PRODUCES ATTRIBUTION"* — true in general, and written as
though **this** were in place. A confident sentence that routes the next reader
away from looking.

**The product fact, stated plainly and not as a caveat about a file: point a paid
campaign at this today and the ad platform sees a landing-page view and nothing
else, so it optimises for traffic.**

---

## 2. The migrations, and the commit state

**`supabase` — `main` at `02dd892`**, eighteen commits including `eb8aa8d` (267).
Working tree clean apart from an untracked `.mcp.json`.

**`certidemy-web` — `main` at `d189675`**, nine commits past `54211fd`.

### 267 — purchase URLs are `certidemy.com` only

Migration 244 widened `is_valid_purchase_url` to accept the retired storefront
and said in its own header when to undo it. **Measured before writing any SQL:
zero rows on any host, every `exam_link` NULL.**

`go.certidemy.com` is covered as a subdomain by the existing group and is
**deliberately not named** in the predicate — naming a store host in a validator
is exactly what let the old brand outlive its truth.

**The negative half is the map function's UNCHANGED md5.** There are two
constraints on this table, not one; `is_valid_purchase_url_map` **delegates**
rather than carrying its own regex, so narrowing one narrowed both, and an
unchanged hash proves the delegation held *and* that the wrong function was not
touched. Also corrected: `is_valid_purchase_url` was briefed as `SECURITY
DEFINER` and `pg_proc.prosecdef` reads **false**.

`set-cert-link` narrowed **in step**, because the DB half moved first and left
the function as the *looser* half — it would have accepted a URL the constraint
then rejected, surfacing as a 500 on a request the function believed valid.

### 268 — the `is_published` drop that had no file

`069` is part 1; it added `status` and deliberately left the boolean. **A
069-part-2 then dropped `certifications.is_published` and there is no file for
it.** The drop was knowable only from prose written after the fact — incidental
notes in three unrelated seed migrations — and **`171:14` exists because a
scaffold migration FAILED on `column "is_published" does not exist`. The drop
was discovered by breaking something, twice.**

A sweep across six object classes returned **exactly one row**, and it explains
why the drop needed no cascade: `v_coverage_summary` exposes `status =
'available' AS is_published` — an **output alias**, not a column reference. Had
anything depended on the column, Postgres would have refused the drop or taken
the view with it. It did neither, **which is evidence the drop was done
carefully** — worth knowing about an operation that left no file.

**The bridge has no readers.** Both repos grepped: three consumers of the view,
not one reads `.is_published`. A future cleanup, not a defect, and deliberately
not done inside a migration whose purpose is to record.

### 276 — the sweep 248 stopped short of, and two fabricated failures

248 minted `abandoned_unscoreable` and wrote in its own header that nothing
wrote it yet. Until 276, the **only** writer of `quiz_sessions.completed_at` was
`score-mock-exam`, reached **lazily** from `get-active-exam-session` on the
candidate's next authenticated request. A candidate who never came back left a
session open forever.

The row that prompted it had been open **290 hours**: an AIE-I simulator, 3 of 25
answered, sitting under IN PROGRESS because "open" was the only state the schema
had.

**And the lazy path had already written two fabricated failures.** Two
`mock_exam` rows at 0.00%, finalised **11.6 hours** and **21.3 hours** after their
sessions started — sessions graded from whatever happened to be saved. **A third
0.00% row is NOT one**: a `certification_exam` closed **seven seconds** after
starting, which is a session begun and immediately ended. Counting it would have
inflated the case with a row that does not support it. All three are a testing
account; the mechanism is the one that would have written 12% against a real
candidate.

**Mock exams only.** Zero `certification_exam` sessions were stuck, so the harder
question was not decided under pressure — refusing to score a cert exam a
candidate actually sat is its own misrepresentation, and its voucher is spent at
start either way. A simulator consumes nothing.

**What ran, with the negative half:** one session closed; open mock 1 → 0;
`abandoned_unscoreable` 0 → 1; **open cert 0 → 0; open practice/review 68 → 68**.
The last two are why it is evidence rather than a tally.

**`score-mock-exam`'s close was silent.** It discarded its update result, so a
`23514` from 248's constraint was thrown away and the candidate was shown a score
never persisted. Now guarded on `completed_at`, selects the row back, and throws
409 on either. **This defect predates the sweep; the sweep only made it
reachable.**

**THE RESIDUAL INCONSISTENCY IS RECORDED, NOT HIDDEN.** At hour 23 the lazy path
still scores a partial attempt; at hour 25 the sweep closes it unscored. Same
candidate, same abandonment, different permanent record. The refusal in
`get-active-exam-session` makes the outcome independent of whether a cron tick or
a login lands first — previously a permanent record decided by a race — but **the
boundary moved; it did not disappear.**

---

## 3. The vendor-name work: what went, what stayed, and what it cost

Five commits across both repos removed a retired brand and two competitors from
migration comments, BOKs, JTAs, specs and scripts.

**What was removed:** 31 edits across 11 files for the competitor citations; 19
clause removals and 4 deletions in the SMPC sweep; the vendor name from the
migration files in 269 and 67d2e97.

**What was KEPT, deliberately:**

- **`BOK-AIMS-F`'s pt-BR guard** — *"Verify [competitor]'s pt-BR coverage before
  pt-BR parity is claimed anywhere."* A live guard against a false claim **of
  ours**, and a guard that does not say whose coverage to verify is
  unactionable. It is the only competitor name left in the non-snapshot
  documents.
- **PECB** survives in `BOK-ISMS-F` as the stated reference pattern.
- **`003:30` and `003:35`** — executable `where code =` predicates, left exactly
  as they ran. At the time that migration ran the row's code *was* what it says.
- **`007_smpc_task_concepts.sql`**, the `019`–`026` frontmatter, and the
  credential-code examples in `functions/`.

**The retention that was overtaken, stated because it matters:** 988e4e3 kept the
competitor names in `HANDOFF-v3_0` and `v5_2` as *dated snapshots*. Two commits
later, d5aa79e deleted both files outright. The snapshot argument was sound and
the decision went the other way; the names are now in git history only.

### The cost, and it is real

**Several pass marks now rest on dated market research pending standard-setting.**

The load-bearing one is `BOK-ISMS-F`'s **80%**. It read *"matching [competitor],
exceeding PECB's 70%"* and now reads that 80% holds Certidemy's uniform
criterion-referenced standard across every scheme, consistent with
Foundation-tier market research conducted 2026-08, **with a criterion-referenced
study named as the intended basis**. **ISMS-F has issued credentials, and its 80%
genuinely loses external support here.** The sentence says so rather than leaving
a bare number. The same applies to SPO-AI-I's **57.5%** Domains 4+5 weighting.

Dates were taken from each document's **own verification stamp**, never from its
"last updated" line — that records when someone edited a file, not when a
third-party fact was checked. The three superseded JTAs carry no research date at
all, and their rewrites **say the date is unrecorded** rather than borrowing an
edit date.

**`CLAIMS-POLICY.md` §3.2 gained the requirement this pass ran under:** if the
citation is removed, the parameter must be **explicitly marked as pending
standard-setting or carry a dated market-research reference**, rather than being
left bare. *A number with no justification is worse than one with a
competitor's.*

### The reverse shape, found in the same sweep

`certidemy-web` deleted twelve spent i18n merge scripts. **Four of them were an
unlabelled undo button for 54211fd** — the commit that retired the brand from
every user-facing surface. Their key tables carry the retired name and write
exactly the keys 54211fd rewrote, the merge is spread-with-script-wins, and the
loop runs all three locales. **A re-run would silently reintroduce the brand
across `messages/*.json` on live marketing pages, from a directory nobody
associates with i18n. Nothing would fail. The build would be green.**

Same day, same theme, opposite direction: not a connection that was missing, but
a connection nobody knew was still live.

---

## 4. The JTAs now agree with the database

**All eleven certifications have a generated JTA and all eleven match live** on
questions, duration, pass mark and pass ratio. Five had none — AIHR-I, AIMS-F,
AIMS-IA, ISMS-F, ISMS-IA — and `gen-jta-doc.mjs` rendered them. **The script's
interface was read, not guessed**, and `--stdout` was used as its dry run first.

**SM-AI-I's table was the worst case and set the pattern.** The heading read
`## Exam facts (verified)` over a table wrong in **five of eight rows**:

| | said | live |
|---|---|---|
| Questions | 40 | **80** |
| Duration | 60 minutes | **120** |
| Passing score | 80% (32/40) | **80% (64/80)** |
| Attempts | 1 + purchasable | **max 6, 12-month window** |
| Languages | "…and others" | **exactly three locales** |

**The percentage was right and the ratio was not**, which is the shape a
half-correct table takes: 80% has been the locked standard throughout, so the one
number nobody ever had to change is the one that stayed true. `"…and others"` was
a Class D overclaim under `CLAIMS-POLICY.md`, not merely a stale value.

**NOT PATCHED — RETIRED.** Writing the right figures into the narrative would put
them in two places again, which is exactly how they went stale. The heading was
**rewritten rather than marked**, per `CLAUDE.md`: a reader scanning headings
never reaches an inline marker, and `(verified)` was the most damaging word on
the page. The wrong values are **named** in a small comparison table so a reader
who remembers 40/60 learns they were wrong instead of watching them vanish. Four
rows that no query can reconstruct — open/closed book, source material, format,
languages — are preserved under their own heading, because mixing them with
regenerable facts under one heading is what made the old table dangerous.

**Duration was the only stale field anywhere**, and it was stale in four
narratives: AIE-I 30 → 45, AIHR-I 50 → 60, SPO-AI-I 90 → 120, SD-AI-I 90 → 120.
Questions and pass marks were correct everywhere. The suite moved to 120 minutes
for Level I and the narratives never followed.

**Banners on the five that had none state NO task-adrift count**, explicitly:
*"Absence of a number here is not a claim that it agrees with the database — only
that nobody has checked."* A banner implying a clean diff by omission would be
the same failure the whole day was chasing.

**`SD-AI-I:104` carried a live instruction to fix something already fixed, in the
wrong direction** — it asked for a suite-consistency pass that had happened, and
named the wrong target. Replaced with a dated RESOLVED marker: *rewrite what
directs, mark what describes.*

---

## 5. The console

**People drill-down** (`79b648d`, `4b8af5f`, `0eb926b`) — one learner's progress
in one certification.

- **The service client is not a convenience.** Of the seven tables it reads, only
  `credentials` has a `platform_admin` policy. A platform_admin querying with
  their own JWT gets **zero rows on six of seven** — not an error, an empty
  result — and the page would render "no progress" for a learner who has plenty.
- **Mastery is read from `v_user_exam_readiness`, not recomputed.** Porting
  `loadDomainMastery` to Deno would have been a third copy of one rule in a third
  language.
- **What never leaves: no `score_pct` under any name**, no question ids, no
  per-item outcomes. Practice accuracy comes from two head counts.
- **Lessons are counted by `lesson_group_id`**, not by row — AIE-I has 48 rows
  across three languages for 16 lessons.

**Three ambiguous labels fixed** (`55f4502`) — *"15 of 31" under five empty
mastery bars read as a contradiction*; it is two different measures and only one
is fed by reading. `Lessons` → `Lessons read`, with the explanation placed **where
the empty bars are**, because the contradiction is visual and the answer has to
be in the same eyeful. `0 used - 6 left` read as a balance and is now an
**allowance** on a rolling window. An em dash in a figure slot read as broken, so
absence got its own rendering instead of borrowing the shape of a value.

**LTI moved under Integrations as a card** (`31e0809`) — **the route did not
move**, and that is why the card exists: `LTI-SETUP.md` and `HANDOFF-v8_8.md`
walk an operator through those paths **by URL** while they register a real LMS.
The page's original `WHY NOT UNDER INTEGRATIONS` argument is **kept**, because it
is still right about the *data models*; a `REVISITED 2026-09-02` section beneath
it names the different question that was decided the other way. New sibling
component `LinkOutCard`, whose docblock carries the rule rather than a
description: **ask who holds the secret.** No status pill, because the vocabulary
would be a claim rather than a label.

**Exam monitor: IN PROGRESS became a card grid** (`d189675`), trilingual, 39 keys
× 3 locales. **The pace triple stays printed — it is a fraud signal and a fraud
signal should not need a click.** Collapsing it behind a `<details>` was proposed
and rejected: behind a disclosure it would be seen only by someone who already
suspected something, which is backwards for a signal whose job is to *raise* the
suspicion. The verification asserts no `<details>` exists in the file so a later
tidy-up cannot quietly collapse it. **The empty state now says the quiet part** —
*"That is the normal state: a card appears here the moment a candidate starts
one"* — because a bordered box above a `Live now: 0` counter and a spinner reads
as WAITING unless something says otherwise.

**`score_pct` in Recently completed is kept and now documented at the file**, so
nobody "fixes" the one place the number legitimately belongs: `CLAUDE.md`'s rule
is about what a partner, a verifier or another learner may see. It was never a
ban on the certification body reading its own results on its own conduct monitor.

---

## 6. A dozen guards failed and the code was almost always right

**Across both repos, roughly a dozen post-conditions failed on the first run. In
almost every case the CHECK was wrong and the work was right**, and the failures
had one shape: **a substring standing in for a property.**

The clearest run was 276 and its two functions — **three failures, all three the
checker**:

```
"cron.schedule is outside begin/commit"   matched the HEADER PROSE at :161,
                                          not the executable one at :216
"no bare unchecked close remains"         the regex matched the NEW guarded
                                          code; `= await svc` contains `await svc`
"the refusal sits inside the expiry"      found `abandoned: true` in the
                                          docblock at :64, before the code at :295
```

**Every one of them found the sentence describing the code instead of the code.**
The same family ran all day: a guard matching the comment that explained the
removal it was checking for; greps for "an English ternary" and "prose in a
template literal" that flagged **Tailwind class strings**, because they proxied
*a user-facing sentence* with *any quoted string*; a `git show` LF compared
against a working-tree CRLF, reporting "the code changed" over a docblock-only
edit.

**And a checker can be blind rather than wrong, which reads identically.** Three
instruments returned reassuring output while seeing nothing: a Bash run that
printed *"no reference outside its own file"* seven times **from a shell with no
PATH — the reassuring line was `git: command not found` hitting the `||`
fallback**; a PowerShell `-eq` that reported two files **equal** when they differ
in exactly four bytes of case, on a comparison that was entirely about case; and
a `grep -c` whose pattern collapsed to empty and returned the file's line count
as a match count. **This is why every zero now carries a control** — a search
that proves it can still find something it should find, a scanner shown a planted
NUL, a matcher shown a string that is not there.

**TWICE A GUARD SCOPED TOO WIDE CAUGHT SOMETHING NOBODY WAS LOOKING FOR**, which
is the reason to keep writing them wider than the task:

- The ASCII check asserted **whole-file** purity rather than "introduces none",
  and surfaced **84 pre-existing non-ASCII bytes in `003`, 42 in `045`, 45 in
  `065`** — a `CERT-SCHEMA-GUIDE` §8 violation predating the change.
- The vendor check asserted a whole-file property **no task had promised**, and
  surfaced `045:14`. That hit became its own commit, `67d2e97`.

A third came from the negative half rather than the width: the accent contract
declared pt-BR `title` accented by assuming symmetry with Spanish. *"Exames, ao
vivo"* carries no accent; only *"Exámenes"* does. **The merge refused against the
declaration, not against the text** — a one-directional check would have written
the author's belief about Portuguese straight into the file.

**One temptation is worth naming because it was acted on before it was caught.**
An accent contract predicted 10/25 and 16/19 and both were wrong by one. A plain
key was briefly moved into the accented set **to make the total match the
prediction** — which is fabricating evidence to fit a claim. Removed before the
run. **The contract is what the strings are, not what was forecast.**

**THE RULE, AND IT IS THE ONE THING FROM THIS SECTION WORTH CARRYING: when a
check fails, find out which side is wrong before adjusting either.** Loosening a
guard because the code "looks fine" discards the only instrument in the room;
editing the code to satisfy a guard that was measuring the wrong thing is worse.
Both times something real was found today, it came from a check nobody had a
reason to trust yet — and it was found by reading the file the guard pointed at,
not by deciding in advance which one was at fault.

---

## 7. What is still open

**Nothing from today is waiting on a deploy.** Stated first because it is the
question a reader of this document asks first, and because the commit messages
answer it wrongly: several of them record *"not deployed"*, which was true when
they were written and stopped being true the same day. **Deployed 2026-09-02:**

```
score-mock-exam           the guarded close
get-active-exam-session   the 24h refusal and the cutoff constant
get-user-cert-overview    backs the People drill-down
list-users, sync-to-ghl   on the widened census.ts
dispatch-emails           carrying the lead.received template
set-cert-link             narrowed to certidemy.com
```

**So 276 is live in both halves** — the hourly `pg_cron` job (`jobid 4`,
`'23 * * * *'`) *and* the refusal in front of the lazy path — and the race
between them is closed, not merely designed shut.

**1. Standard-setting.** ISMS-F's 80% and SPO-AI-I's 57.5% now rest on dated
market research with a criterion-referenced study named as the intended basis.
ISMS-F has issued credentials against that number.

**2. Attribution.** No first-party attribution exists for paid campaigns. The
first decision is **delete or connect** on `decorateCertiGlobalLink`, and it
turns on the cookie's `Domain` attribute and what the storefront can read.
Nothing downstream is worth wiring until the cookie is written.

**3. Voucher automation.** There is no order-ingest path at all — only
`assign-voucher` and `unassign-voucher`, both console actions. A purchase on the
store reaches the platform when a human puts it there.

**4. The pass / issuance email.** Nothing tells a holder they have anything.
**This is now unblocked**: 275 proved the queue, the key and the sending domain,
so what remains is a template and an enqueue at the mint. Per `CLAUDE.md` that
enqueue belongs **in SQL**, not in TypeScript after the insert.

**5. `/my-credentials`.** Carried as open, with one correction available:
`HANDOFF-v8_2.md` §8 concluded the route is unnecessary because the dashboard
already lists everything a user holds. That conclusion predates partner-issued
credentials and has not been re-checked against them.

**6. `/console/leads`.** Eight leads live in a table only `platform_admin` and
`marketing` can select from, **with no screen listing them and no way to move
`status` off `'new'`**. This is the reason 275 did no backfill.

**7. AIGRM-I Stage 9.** Whether AIGRM-I genuinely completed secure/practice bank
generation has been an open question since v3.6 and has never been answered. It
is live and carries assigned vouchers.

**8. SPF and DMARC.** DMARC is still `p=none`. The apex SPF is still Google-only
and still owes the store an include.

**9. The TS/SQL `is_exam_scope` divergence.** `loadDomainMastery` counts **all**
tasks; `v_user_exam_readiness` counts **exam-scope** tasks only. Measured across
every user with mastery rows, **one in ten differs** — 0.4996 against 0.4997.
**They agree today only because nearly every task is currently exam-scope, which
is a property of the data and not of the code.** The first cert with a real body
of non-exam-scope tasks makes the learner's dashboard and the console screen
disagree with nothing to flag it.

**10. The residual 24-hour scoring inconsistency** (§2, 276). Hour 23 scores a
partial attempt; hour 25 closes it unscored.

**11. `009_unpublish_placeholder_until_ready` (§1.1).** Recorded as applied, no
file here at any commit. Not on the list handed to this session — found while
checking the ledger count for this document. It sits in the same class as 268: an
applied change with no record.

**What to do, and it is ten minutes.** The name says it acted on the *placeholder*
row, so query `public.certifications` for the `22222222-2222-…` slot and read its
current state — `code`, `name`, `status`, and whatever else the row still
carries. **Then confirm that nothing about it is unexplained by migration 104**,
which is the other migration known to have reassigned a slot on this table.

**The outcome that matters is the negative one.** If 104 accounts for the row's
present state, 009 is closed as a superseded no-op and gets a line saying so. If
something in that row is explained by neither, **009 did something this
repository has no record of at all**, and that is a different and larger finding
than a missing file.

---

## 8. The line worth carrying out of this

**Not one of the four was found by something failing.**

The ledger returns seven rows without complaint. The two predicates resolve
correctly on every request. `dispatch-emails` claimed an empty queue every minute
for weeks and reported success each time. `captureAttribution` is a correct
function that has never been called. **Every one of them behaved exactly as
built, and every one of them was disconnected from the thing it existed to
serve.**

`CLAUDE.md` already names this: *the recurring failure mode of this system is
silent success.* What today adds is **where it lives**. Every instance was at a
seam — between a table and a notifier, a schema and its record, a capture and a
decorator, a session and its close. **The components were all fine. The wiring
between them was the part nobody owned, and the wiring is the part that produces
no evidence when it is absent.**

**The instrument was a question, not a test:** *what reads this?* — asked of a
table, a function, a cookie, a column, and followed until it ran out. It cost
minutes each time. It found four things in one day, and one of them had been
sitting there since migration 229.

**The corollary is uncomfortable and worth writing down.** Every one of these was
findable at any point in the preceding weeks by anyone who asked. They were not
hard. They survived because **nothing in this system asks that question on a
schedule**, and the one mechanism that would have — a ledger reconciling files
against the database — is itself the first of the four.
