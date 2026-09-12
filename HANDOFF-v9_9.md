# HANDOFF v9.9 — SM-AI-II is live, and a defect that will reach a real candidate

**Date:** 2026-09-11
**Covers:** everything after `HANDOFF-v9_8-addendum.md` — migrations 292 to 297, the
dropped-read sweep, translation review rounds one and two with the two schema changes
they earned, and the launch
**Repos:** `supabase` (this one) and `../certidemy-web`

**The one-line state:** `SM-AI-II` is **available**. `verify-cert` reads **53 pass, 0 fail,
3 declared warnings** and *All certs conform. Safe to publish.* No candidate has sat it.

> **READ §2 BEFORE ANYTHING ELSE.** It is the only item here that will reach a real
> candidate on its own, it has nothing to do with SM-AI-II, and it was found while
> scoping a test that was never run.

---

## 1. SM-AI-II IS LIVE

Migration 297 flipped it from `coming_soon` to `available` on 2026-09-11. **That migration,
not 294, is what opened the examination** — `generate-mock-exam` refuses to assemble a
certification exam unless `status = 'available'`, and checks before the voucher is
consumed so a freeze never burns an attempt.

### What that covers

| | |
|---|---|
| **Teaching** | 44 lessons, loaded and wired |
| **Items** | **2,376** — 1,056 secure + 1,320 practice, across en / es-419 / pt-BR, 792 question groups. Every one of the 44 in-scope tasks meets both floors in all three languages |
| **Blueprint translations** | **98 of 98 read by a human** across two review rounds. Four were rejected, repaired, and re-read |
| **Blueprint** | publishable — no repository internals, enforced by `verify-cert` invariant 23 on every run |
| **Credential** | an achievement exists, is `active`, is type `Certification`, on an active issuer. A passing candidate receives something |
| **Form** | 50 items, 150 minutes, blueprint-weighted D1 20% / D2 20% / D3 17.5% / D4 20% / D5 22.5%, which largest-remainder rounds to **10 / 10 / 9 / 10 / 11** |
| **Exposure policy** | 6 attempts, 12-month window |

### What it does NOT cover — stated plainly

**The pass mark is 75%, adopted rather than derived.** It matches its two Level II
siblings, `AIMS-IA` and `ISMS-IA`, and it is a citation, not a measurement. **No
standard-setting study has been run** — no Angoff panel, no modified-Angoff round, no
bookmark procedure, no candidate data. The number is defensible as a starting position
and is not evidence.

**No independent SME panel has validated the job-task analysis or the weightings.** The
JTA has been through rounds of second-reviewer critique, one of which materially changed
the task inventory and its cognitive levels. That is editorial rigour. It is not the
convened panel of practising Scrum Masters that ISO/IEC 17024 requires.

**The item bank is pipeline-drafted with an independent critique pass, and nobody has
read the items.** The blueprint has now been read by a human in all three languages —
**the 2,376 items have had no equivalent review.** The most useful number in this
document is that **4 of 98 blueprint rows were wrong** after two machine passes had
approved them (§6). Nothing tells you the item rate is lower.

**The cue-length tolerance is adopted from a sibling bank, not measured on this one.**
`exam_blueprint.item_model.cue_tolerance.status` says so in the published blueprint:
`PROVISIONAL - NOT YET MEASURED ON THIS BANK`.

**No candidate has sat it.** 0 vouchers, 0 sessions, 0 attempts for this certification.

---

## 2. THE SWEEP BUG — highest-priority open item

**Unrelated to SM-AI-II. Affects every certification. Will reach a real candidate.**

Found on 2026-09-11 while scoping the assembler test in §3 — a test that was never run.
The scoping found it; the test did not need to happen.

### What is wrong

```sql
-- public.sweep_abandoned_exam_sessions(p_cutoff_hours, p_limit)
where s.kind = 'mock_exam'          -- <-- certification_exam is never swept
  and s.completed_at is null
  and s.started_at < now() - make_interval(hours => p_cutoff_hours)
```

**`sweep_abandoned_exam_sessions` filters on `kind = 'mock_exam'`.** An abandoned
`certification_exam` session is never closed by anything.

Two consequences, both live:

**It blocks the candidate's next attempt.** `generate-mock-exam` refuses a new
certification exam with `409` when an open `certification_exam` session exists for that
user and certification. **That check has no expiry filter** — it refuses on a session
from any time, however old. The refusal carries `session_id` and `started_at` so a client
can offer resumption, which is the mitigation; it is not a fix.

**It is auto-scored as a 0% fail whenever they next open the exam page.**
`get-active-exam-session` finalises any session past `duration + 60s` grace by delegating
to `score-mock-exam`. The escape hatch that returns `abandoned: true` *instead* of scoring
is scoped the same way:

```ts
if (session.kind === "mock_exam" && elapsed_seconds > ABANDON_CUTOFF_HOURS * 3600) {
  return jsonResponse({ active: false, abandoned: true, session_id: session.id });
}
```

**Its own comment says that branch exists to stop "a fabricated result being written days
after the fact" — and the protection it describes as general applies only to
`mock_exam`.** A certification exam abandoned on Monday and revisited on Friday is scored
on Friday: an `exam_attempts` row at 0%, **50 `quiz_attempts` rows recording unanswered
responses**, and a mastery update. No credential, because 0% fails every pass mark.

Those 50 rows are the item-response data a future standard-setting panel or equating study
reads. **A fabricated 0% sitting is exactly the observation that corrupts a p-value.**

### Why it is the top item

The candidate-facing failure needs no unusual behaviour to trigger: start a certification
exam, close the tab, come back later. The 2026-08-21 incident — a candidate starting two
exams 65 seconds apart and losing both attempts — was the same family and its root cause
(`get-active-exam-session` returning the newest session of *either* kind) **is fixed**: it
now filters on `kind`, and when asked without one prefers the certification exam. This is
the part that was not fixed with it.

### What a fix has to decide

Not implemented, because it is a policy question rather than a code question:

- **Should an abandoned certification exam score as a fail?** Arguable yes — the attempt
  was paid for and consumed, and walking out of an exam is a result. If so, it should be
  scored **by a sweep at a known boundary**, not whenever the candidate happens to reload,
  and the `quiz_attempts` rows need a flag so a panel can exclude them.
- **Or should it close unscored**, like the simulator, leaving the attempt burnt but no
  response data? Then extend 4a's escape hatch to both kinds and extend the sweep.

Either way the sweep and the escape hatch must agree, and today they agree only about
`mock_exam`. The header of `get-active-exam-session` already states the principle —
*"these two numbers are one boundary expressed twice, and a gap between them is a session
neither path owns"* — and there is a third path it does not mention.

---

## 3. THE ASSEMBLER HAS NEVER RUN

`verify-cert` says the pool **can** fill a form:

```
PASS §9  Pool can fill a form at the declared profile   50-item form, every domain x language covered
```

**Nothing has confirmed that it did.** `generate-mock-exam` has never assembled an
SM-AI-II form. The gap between "the pool can" and "the assembler did" is the one thing no
check closes, and it is where a real candidate would meet it first.

### What would close it

One sitting, deliberately abandoned, never submitted:

1. Seed **one** voucher (`attempts_allowed = 1`) against a test account — **not** a real
   learner, and not `specimen@certidemy.com`, which owns the 12 specimen credentials.
2. Start the exam in the app. **Do not submit.**
3. Read back the 50 served items from `exam_session_items`: the domain split against
   10/10/9/10/11, the difficulty mix, whether any bucket came up short, and whether the
   50 are 50 distinct items.
4. **Delete the session and its items in the same sitting** — see §2. An abandoned
   certification exam left past 151 minutes self-scores the next time that account opens
   the exam page, which would create exactly the `quiz_attempts` rows this test exists to
   avoid creating.

`generate-mock-exam` writes only three things: the voucher consume, one `quiz_sessions`
row, and 50 `exam_session_items`. **It cannot mint a credential** — that is
`score-mock-exam`, which only runs on submit. Not submitting makes the credential risk
structural rather than procedural.

**Cheap rather than urgent.** Vouchers are controlled, no voucher exists for this
certification, and the first sittings will be watched. But it is the last unknown on the
launch path and it costs one voucher and ten minutes.

**Note for whoever runs it:** an edge function authenticates its caller with
`userClient.auth.getUser()`. A service-role key is not a user token, so this cannot be
driven from a script without impersonating a real account through the admin API. It has to
be a real sign-in — which also exercises the client path.

---

## 4. MIGRATIONS 292 TO 297 — all run clean

| # | what |
|---|---|
| **292** | **SM-AI-II gets an achievement.** Nothing creates one: migration 231 inserted one per certification as a one-time backfill over the eleven that existed on 2026-08-19 and left no forward mechanism. Without it a passing candidate receives nothing |
| **293** | **The blueprint becomes publishable.** `grounding_note` 2,385 → 1,846 chars; blueprint 5,730 → 4,805. Everything cut was confirmed per item to exist in SCHEME, the BoK, the JTA or a migration first — nothing existed only in the note |
| **294** | **The catalogue policy stops meaning `available` and starts meaning `not draft`.** See §5 of the addendum for the full finding |
| **295** | **`is_provisional` gets a third state.** `review_status` = `unreviewed \| approved \| rejected`, sticky on rejected, enforced structurally by a trigger |
| **296** | **Provenance status.** `jta_version_status` and `company_id_status` record what the *writer observed*, set by the writers, no trigger |
| **297** | **SM-AI-II goes available.** Guarded by `trg_guard_cert_has_active_achievement` (migration 249), which the pre-conditions mirror so the error is readable rather than a `check_violation` from mid-transaction |

**The shape all of these settled on, and it is worth keeping.** One paste; pre-conditions
as a `do $$ … raise exception $$` block rather than selects to read, because **the SQL
editor returns only the last result set** — two readable pre-guards would execute with
their output discarded and the write would run regardless. 294 and 297 go further and put
the post-conditions inside the transaction too, so the paste reverts itself.

**Behaviour, not policy text.** Anything asserting what an anonymous reader can see does it
under `set local role anon`, never by reading the policy back. **Except the write path**,
which is verified against `pg_policy` on purpose: migration 246 shipped a `drop trigger`
as an "expect 42501" verification, the drop succeeded, and signup was silently dead.
*When the check and the damage are the same action, the check is the damage.*

---

## 5. THE DROPPED-READ SWEEP → `READ-FAILURE-AUDIT.md`

Three instances of one shape surfaced on a single day, which is what prompted a sweep of
both repos:

```js
const { data } = await db.from("x").select(...)   // error discarded
const rows = data ?? [];                          // a failed read is now an empty table
const n = count ?? 0;                             // a failed count is now zero
```

**`count ?? 0` is the model.** On an errored read it reports *zero leaked links* — the
answer that passes.

**Fixed, because they reported a believed number:**

- **`certidemy-web/lib/console/readiness.ts`** defaulted the pass mark to
  `DEFAULT_PASSING_PCT = 80`. **All three Level II certifications use 75** and the nine
  Level I certs use 80, so the defect was invisible on 9 of 13 and wrong on exactly the 3
  where it mattered. There is now **no default on that path** — a cert whose pass mark
  cannot be read produces no readiness at all. There were **two** defaults; the page had
  its own `?? 80`.
- **`get-governance-snapshot`** did `count ?? 0` on **78 sequential counted reads** (13
  certs × 2 pools × 3 languages). One failure reported an empty bank cell on the surface
  built to show an assessor per-clause evidence. Fixed at the boundary. **The `profiles`
  authorisation read is deliberately left unwrapped** — a null profile must stay a 403.

**Fixed, because they manufactured false failures:** seven reads in `verify-cert`, now
behind a `must()` wrapper that aborts the run naming the certification and the query. One
sweep had reported **three confident failures against AIMS-IA's 2,160 healthy items**
because a single page errored and the bank came out empty.

**`READ-FAILURE-AUDIT.md` §4 and §5 are the expensive half: sites that LOOK wrong and are
not.** Seven check-then-insert pre-checks with the backing unique index named per site —
`credentials_idempotency_unique`, `issuer_api_requests_idempotency_unique`,
`credentials_one_active_per_cert`, `appeals_one_open_per_attempt` and three more,
confirmed from `pg_index` rather than assumed — and nine more that fail **closed**,
including `requireIssuerAccess`. **Read those before "fixing" anything in them.**

**Latent, recorded where it will be tripped (§7 of that document):** the exam path has
**zero `.range()` calls** and PostgREST caps at 1,000 rows, so a `(cert, pool, language)`
bucket crossing 1,000 is silently truncated and forms drawn from a partial pool. No bucket
exceeds 800 today; SM-AI-II divides to ~352 per language. The two ways it starts biting are
**adding a language** and **raising a floor**, so the warning and the query sit in
`TRANSLATION-PIPELINE.md`'s new-language checklist and beside the floors in
`jta/ASSESSMENT-ENGINE.md`.

---

## 6. TRANSLATION REVIEW — two rounds, four defects, two schema changes

| round | scope | result |
|---|---|---|
| one | 5 domain titles + D5's 9 tasks, both languages | 28 rows: **27 approved, 1 rejected** |
| two | D1–D4 task statements, both languages | 70 rows: **67 approved, 3 rejected** |
| **total** | | **98 rows, 4 rejected — 4.1%** |

**Every one was a meaning defect. Not one was a typo.** All four survived the
retired-vocabulary gate, the generator and the independent critique pass.

| row | defect |
|---|---|
| 5.7 es-419 | `throughput` → `rendimiento`, which reads as **performance** — the other half of the pair the task exists to separate |
| 1.9 es-419 + pt-BR | *"mejora **de** la Sprint Retrospective"* reads as improving the **event**; the task is an improvement **identified at** it |
| 3.8 es-419 | `engagement` → `compromiso`, which is the correct es-419 rendering of Scrum **COMMITMENT** — and **eleven SM-AI-II tasks across D1, D2, D4 and D5** turn on an artifact commitment |

All four were repaired, left provisional, re-read and approved on 2026-09-11. **A fourth
mark, `[r]`, distinguishes a repaired row from one that was right first time** — both
clear the flag; they differ in what they record. The review documents keep each original
defect note and append what the repair changed.

### The two schema changes these earned

**Migration 295 — `review_status`.** After round one this was written up and *held on
purpose*: one rejection in 28 is not evidence. Two rounds later the rate was rare and
steady (3.6%, then 4.3%) — **and the rate is not what decided it.** `5.7` was rejected in
round one, repaired within the hour, and was still provisional after round two. By then
*all four* provisional rows were repairs awaiting re-read and **not one was unreviewed**,
so the check's own detail line — *"the English moved, or they were never reviewed"* — was
false for 100% of the rows it was failing on. **A column that cannot express the state
produces a check that misdescribes it.** Rarity argued *for* the column: a failure reading
71 of 98 gets worked, one reading 4 of 98 reads as nearly done and gets deferred.

**Migration 296 — provenance status.** `jta_version_status` / `company_id_status` record
whether a lookup **succeeded, found nothing, or failed** — three states a NULL cannot
carry. Measured before building: **zero unexplained** across 13 attempts and 21
credentials. **Zero is why it was cheap, not why it was unnecessary** — the query proving
the stamps were not missing needed a three-way join that inferred intent from a null, and
*that query got it wrong on its first attempt*, silently dropping six rows to an inner
join.

**295 and 296 went opposite ways on purpose.** 295 uses a trigger because seven writers
all wrote *text* and none knew anything about review state. 296 has the writers set it,
because the fact is *"did my read succeed"* — which only the reader can know, and which no
trigger can reconstruct once the row has landed.

---

## 7. THREE FINDINGS THAT GENERALISE

Worth a reader's time even if they never touch SM-AI-II.

### A grounding list is only as current as the corrections it encodes

`SCRUM_GUIDE_FACTS` holds the claims the 2020 Scrum Guide does **not** make, injected into
both the drafting and critique prompts. An audit against migrations 285–289 — each of which
had retired a claim that reached this job-task analysis — added nine entries and
**corrected three**. Two of the originals were not merely missing but **actively wrong**:
one asserted *"the Developers are accountable for the Increment"*, the exact claim
migration 289 had retired hours earlier, and a dry run keyed it.

**The list guarded against the errors the field makes and not against the errors this
credential had already made.** Any grounding artefact written before the corrections it
should encode has this property. Audit it against your own change log, not against the
literature.

### Review translations side by side, never one language at a time

Task 5.7's English: *"Analyze rising throughput accompanied by falling Increment
usability."* The Spanish rendered `throughput` as `rendimiento`.

> **Neither translation is wrong on its own.** Read the Spanish alone and it is fluent and
> correct. **The defect exists only in the relationship between them**, and a reviewer
> working one language at a time has nothing on the page to compare against.

The reviewer caught it because the Portuguese sat two lines above the Spanish. **That is a
property of the document, not of the reader.** One document, every language for a row
adjacent, one shared English above them. Written up as `TRANSLATION-PIPELINE.md` §3.6, and
it applies to any multilingual assessment.

### A failure-tolerant read reports a broken query as a finding about the data

The three instances in §5 are one shape: `?? []` and `?? 0` make a *failed* read
indistinguishable from a *legitimate empty* one. The consequence ranking is what matters —
**a dropped read in a catalogue listing shows an empty page and someone notices; a dropped
read in a gate reports PASS and nobody does.** `count ?? 0` on a firewall check reports
zero leaked links, which is the answer that passes.

And it is worse than a skip when it fails loudly but wrongly: the AIMS-IA sweep named 120
task/language slots "below floor" against a healthy bank, which looks exactly like real
content debt. **Whoever chases it finds nothing wrong — which is how a checker teaches
people to discount it.**

---

## 8. OPEN ITEMS

> **NUMBERS IN THIS DOCUMENT PREDATE 2026-09-12 unless a line says otherwise.** The
> retired-vocabulary counts in item 2 were re-measured that day after a pattern defect
> was found; `verify-cert --all` now reads **five certifications failing** — AIE-I 2,
> AIMS-IA 1, SD-AI-I 1, SM-AI-I 2, ZZ-TEST-I 11 — with SM-AI-II and SPO-AI-I both at
> **0 fail**. AIMS-IA's failure is new and correct: `trilingual.lessons` became
> status-aware, and AIMS-IA is `available` with English-only lessons.

**Highest priority — will reach a candidate:**

1. **The sweep bug (§2).** `sweep_abandoned_exam_sessions` and
   `get-active-exam-session`'s escape hatch both scoped to `mock_exam`. Needs a policy
   decision, then a migration and a function change together.

**Content debt, the largest on the platform:**

2. **Retired vocabulary in LIVE secure banks. BOTH FIGURES BELOW WERE WRONG, in opposite
   directions, and the corrected census is in the table.**

   > **This item originally read "SM-AI-I's 52 and SPO-AI-I's 35". Neither number was
   > right.** `35` was a SINGLE-LANGUAGE undercount, taken before `items.vocabulary` read
   > es-419 and pt-BR. `52` was INFLATED by a pattern defect: `\b` did not stop
   > `equipo de desarrollo` matching inside `sub-equipo de desarrollo`, because a hyphen
   > is a word boundary. Thirteen SPO-AI-I "defects" and two SM-AI-I ones were that bug —
   > scenarios about a Scrum Team split into a testing sub-team and a development
   > sub-team, where **the sub-team is the misconception under test** and a sweep would
   > have produced `sub-Developers`. Fixed 2026-09-12 with a negative lookbehind, tested
   > both directions. **Every count this check produced before that date was inflated.**

   The real census, measured 2026-09-12 after the fix — secure items broken down by
   where the term sits, because placement decides the treatment:

   | cert | status | secure | key / stem / distractor / explanation | practice | lesson rows |
   |---|---|---|---|---|---|
   | **SD-AI-I** | available | **9** | 1 / 9 / 2 / 6 | 45 | 7 |
   | **SM-AI-I** | available | **50** | 6 / 27 / 34 / 22 | 52 | 6 |
   | SM-AI-II | available | 0 | — | 0 | 0 |
   | SPO-AI-I | available | **0** | — | **99** | 1 |
   | | | **59** | | **196** | **14** |

   **SPO-AI-I's secure bank is fixed** (2026-09-12): six keys read individually and
   swapped, 22 English rows swapped deterministically, 42 es-419/pt-BR rows re-translated
   from the corrected English because Spanish and Portuguese need article and verb
   agreement a term swap cannot do. Verified by reading rows back: 0 affected. It now
   reads **56 pass, 0 fail**.

   **SD-AI-I's 9 were never reported before and are mostly not defects.** The evidence
   reads `[KEY+STEM+EXPLANATION] A 2017-era wiki states the Development Team is
   'self-or…'` — these are TERMINOLOGY-DRIFT ITEMS whose stem quotes a 2017 document on
   purpose. **One has it in the KEY**, which is a real defect; the rest need the
   item-level equivalent of `teaches_retired_vocabulary`.

   **SM-AI-I's 50 is the remaining job**, and the placement line says six of them are in
   the KEY. Its first evidence line — `[STEM+DISTRACTOR] A Scrum Master learns
   'self-organizing' was deprecated` — is the misconception-under-test case, so this is
   a read-then-sweep job and not a sweep.

   **SPO-AI-I's 99 PRACTICE items are new to this record.** `items.vocabulary` FAILs on
   secure and WARNs on practice, so they have never blocked anything and never appeared
   in a failure count.

**Correctness:**

3. **`readiness.ts`'s mixed-roster bug.** `passingScorePct = knownMarks[0]` takes the
   *first* certification's pass mark and applies it to every row — wrong for a roster
   spanning a Level I and a Level II cert **whatever the read does**. Pre-existing, not a
   dropped-read bug. Fixing it means threading a per-row nullable mark through
   `ReadinessRosterTable` → `readiness-detail-modal` → `DomainBar`, all typed `number`. A
   row whose cert is unavailable also currently renders like a learner with no data.

4. **`verify-cert`'s `--all` baseline in `CLAUDE.md` is stale.** It says *43–44 checks* and
   *1 cert with FAILURES*. Measured 2026-09-11: **49–56 checks** and **5 certs failing** —
   AIE-I 2, SD-AI-I 1, SM-AI-I 2, SPO-AI-I 1, ZZ-TEST-I 11. Re-baseline from a saved run.
   A clean baseline nobody re-checks is what let item 2 read as ordinary drift.

**Verification:**

5. **The assembler test (§3).** One voucher, one started exam, read the 50, delete the
   session. Cheap, not urgent.

**Deferred by decision, not pending:**

6. **The standard-setting panel and the independent SME validation.** These are named
   open items on the path to accreditation in every scheme document. They are **not**
   work waiting to be scheduled by an engineer — they require convening practising Scrum
   Masters, and the credential is positioned as *designed to the ISO/IEC 17024:2026
   framework — audit-ready by design*, not as accredited. **Do not treat this as a
   backlog ticket.**

7. **Item-level human review of the 2,376 items.** Same category. The blueprint review
   found 4.1% meaning defects in text two machine passes had approved; the items have had
   no equivalent read.

*(The four repaired translation rows are closed and deliberately not listed. `review_status`
and provenance writer coverage are complete across all five mint paths and both
translation tables — `verify-cert` invariant 24 fails on any `unrecorded` row, naming all
five writers, so a missed writer surfaces as a check failure rather than as a gap in this
list.)*

---

## 9. THE HONEST POSITION

SM-AI-II is sellable and nobody has bought it. The blueprint a candidate reads has been
read by a human in three languages and four of its ninety-eight rows were wrong before
they were. The bank is complete, meets its floors, and **no human has read an item**.

The pass mark is a citation. The cue tolerance is a citation. The published blueprint says
so in the field a verifier can read.

**What was actually built this week is not the certification — it is the machinery that
refuses to lie about it.** A blueprint that cannot carry engineering history past a release
gate. A review flag that can say *"a human rejected this"* instead of *"provisional"*. A
provenance stamp that distinguishes *"nothing to record"* from *"the read failed"*. A
verifier that aborts instead of inventing an empty bank.

Every one of those was built because the alternative had already produced a confident
wrong answer at least once.

**The next thing is §2, and it is not about SM-AI-II at all.**
