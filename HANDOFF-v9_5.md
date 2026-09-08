# HANDOFF v9.5 — a clause the standard requires, an exam that felt like one, and the checker that closed a direction

**Migration tip: 281. Next free: 282.** Read the disk, not this line.

**Everything pushed, both repos.** `certidemy-web`'s tree is clean; this one
carries `.mcp.json` untracked, plus this file until it is committed.

**In commit order, which is not the order I first listed them in.**
`certidemy-supabase` — `c2e8945`, `997186b`, `562d13f`, `d2272ec`, `c8a1019`,
`1e432d3`, `d5d28d1`, `c57e19c`, `bb1df8b`, `1a0c71a`.
`certidemy-web` — `c3c3856`, `166dd2e`, `3c1a156`, `2e09d80`, `becd817`, `c8ea4d4`.

> **`d5d28d1` PRECEDES `c57e19c`, AND THE ORDER IS THE ARGUMENT.** §3.2 says the
> checker caught its author; that is only true if the checker was built before
> the correction. An earlier draft of this line had them the other way round,
> which quietly inverted the one claim the section rests on. `c2e8945` was
> missing from the list entirely — §5 is about nothing else, and it carries both
> renderer version bumps. A hash list is a claim about what happened, and it
> was wrong in both directions at once: an order that reversed a causal story,
> and an omission that left a whole section unsourced.

SM-AI-II went from a locked JTA to a written scheme. But most of this session
was not the certification, and the pattern is the same as v9.4's: **the defects
were found by being the first user of something**, and every one of them was
*this does not do what it says* rather than *this is failing*.

| what was found | how |
|---|---|
| `appeals` had a table, RLS, grants and protective migrations — and no code path | asked whether 17024 clause 9.9 was satisfied |
| the exam presented as a webpage with a sidebar | Juan sat one |
| a tab could unmount a live paid exam in one click | recon for the takeover |
| twelve scheme-claim divergences across eleven documents | built a checker and ran it |
| the factsheet told buyers to purchase at a retired storefront | asked which surfaces still named it |

---

## 1. ISO/IEC 17024 clause 9.9 — a required process that existed only as a table

`public.appeals` was created by migration 062, built to the clause: `kind` in
`('regrade','item_flag')`, five statuses, RLS letting an owner read and insert
their own and only a platform_admin update. **Zero rows since.**

**The protections around it were live while nothing could write to it.** 099
aborts a bank purge if any appeal references it — *"an appeal against a question
is examination evidence and must never be destroyed."* 127 pins
`flagged_question_id` to NO ACTION so a disputed item cannot be deleted. Perfect
guards on an empty room.

The only description of an appeals route anywhere was in
`console/objections/page.tsx` — an internal sales brief telling a rep that
appeals go to an email address no candidate is ever shown.

### 1.1 What was built

**Candidate route** (`166dd2e`) — `/appeals` under `(app)`, listing the
candidate's own attempts and any appeal against them, with `status` and
`resolution_note` visible because the RLS read policy already exposes them to the
owner. That is what closes the loop.

**Console reviewer surface** (`3c1a156`) — platform_admin only, per the
`console/exams` precedent: an appeal is a named candidate, their score, and their
written argument that the result is wrong, which is more sensitive than an exam
in progress. **team_admin is out** — the database does not expose an appeal to a
partner at all, and building a partner view would mean widening a policy written
to clause 9.9, where the appeal is between the candidate and the body rather than
the employer.

**Two entry points** (`c8ea4d4`) — `/appeals` shipped with **zero inbound links**
and was reachable only by typing the URL. A muted text link on a failed
certification result, inside the cert card and deliberately *not* in the Actions
row, where a third button would give an appeal the weight of a navigation choice.
And a durable entry in the user menu, because the contextual link vanishes when
the candidate navigates away and never renders for someone who passed.

**Migration 279** — a partial unique index on `exam_attempt_id where status in
('open','under_review')`. The action's pre-check is a read-then-write with a race
RLS does not close; the index is the guarantee, and the action maps SQLSTATE
23505 back to the same result so a lost race reads as the ordinary already-open
case.

**Migration 280** — `reviewed_by` and `reviewed_at`. Clause 9.9 requires the
reviewer not be the original decision-maker; here the original decision is
automatic, so the clause is not at risk **and that is exactly why identity is
captured now**: it cannot be captured retroactively. No
`CHECK (reviewed_by <> user_id)` — correct today, and `withdrawn` is the case
where the person named is legitimately the person acting.

### 1.2 Three constraints the schema imposed, all of them right

**`exam_attempt_id` is NOT NULL**, so the table is scoped to certification
examinations by design. A practice-quiz flag cannot live here, and making the
column nullable would turn a clause 9.9 record into a general inbox.

**The candidate never sees a question id after an attempt.** `ScoreMockExamResult`
in `lib/engine/types.ts` carries aggregates only — score, totals, concept and
difficulty breakdowns, weakest concepts — and no question identifier anywhere.
**The structure is what is verified; the file states no rationale**, so read the
absence of ids as the fact and not as a documented intent. An earlier draft of
this paragraph attributed a secure-item-analytics rationale to that file, which
is not in it. So `item_flag` has no candidate-facing source and **only
`regrade` was built.** The intended design captures an item challenge in session,
where the question is on screen, and promotes it at scoring.

**There is no results route.** Results render client-side inside `mock-exam.tsx`
and vanish on exit, so the entry point could not be the result screen alone.

### 1.3 What still does not exist, and §11 of the scheme says so

No notification — a candidate must return and look. No stated turnaround, no
deadline. No item-challenge capture. No complaints route distinct from appeals.
**And a candidate who cannot sign in has no route at all** — `info@certidemy.com`
appears only in an internal brief and is on no candidate-facing surface, so it is
not a route the body can claim.

> **The alternative was worse than the gap.** Writing an appeals section into
> eleven documents describing a route nobody operates is the `verify-grounding`
> shape — a control that exists on paper and produces no events.
> `SCHEME-AIMS-F.md` §8 already does exactly that in three sentences, and it was
> the warning rather than the template.

---

## 2. The exam did not feel like an exam

Juan sat a real AIE-I certification exam and found five things in one sitting.
Four were real; the fifth was the most instructive and it was mine.

### 2.1 The takeover — `2e09d80`

A candidate paying for a timed one-shot assessment got a nav sidebar, a green
*"exam seat active"* banner **during** the exam, and had to scroll to reach the
answer options.

`AppShell` already had an immersive escape for `quiz/play`, and its docblock
already named why the exam did not get one: *"the mock exam runs in-place on
/exam as component state, not its own route, so it can't be detected here."*
**The pattern existed and the reason it was deferred was written down.**

Done by **context, not a route** — `exam-leave-guard.tsx:79` seeds a history
entry and assumes a stable URL for its lifetime, so moving the candidate mid-exam
would fight the guard at the moment it is protecting a spent voucher.

Immersive only at phase `exam` or `scoring`. **Not `results`** — keying on
"MockExam is mounted" would strand the candidate on their own results screen with
no chrome and no way back.

**The navigator scrolls in a three-row pane rather than collapsing.** The
marked-question dots are the overview a candidate plans remaining time with, and
hiding them behind a toggle costs something real.

### 2.2 The tab could kill a live exam

`MockExam` is keyed on the launcher tab, so switching **unmounted a running
exam**. The leave-guard could not stop it: it intercepts anchors and the tab is a
button, which the guard's own comment records as deliberate.

Now hidden while live **and** disabled and click-guarded. Two defences, because
if the takeover ever regresses, **a visible tab that silently destroys a paid
attempt is far worse than one that refuses.**

### 2.3 The regression the takeover introduced — `becd817`

Putting the seat pill inside `ExamPageChrome` made it unmount during the session
and **remount at results**. That fixed the stale attempt count and broke the pass
path: `score-mock-exam` flips the voucher to `redeemed`, `getEligibility` reads
only `assigned`, so the remounted pill resolved `has_voucher: false` while its
`hasCredential` prop was still the stale server value — and rendered **"No exam
seat yet — Buy Exam Voucher" beneath the candidate's pass.**

That is verbatim the failure the pill's own docblock says it exists to prevent.
**Before the takeover the pill never refetched, so it was safe by accident.**

Fixed in two halves. The **safety half** is `credentialEarned` in the exam-session
context, set from `scored.passed` before `setPhase("results")` in the same React
batch — a value already in hand, no round trip, so the BUY state cannot appear for
even one frame regardless of the network. The **correctness half** is
`router.refresh()`, fired once. `router.refresh()` alone would not do: it is a
round trip and the pill has already refetched before it lands, which is the whole
bug.

> **If the refresh never resolves, the pill stays hidden and the results screen
> is otherwise complete. The failure direction is "says less", never "says
> something false."** That is the property a certificate screen needs.

### 2.4 The banner defect, and why walking the phases found it

`mock-exam.tsx` rendered the resume notice and the **submit-failure banner** as
siblings above the runner. Once the runner became `fixed inset-0`, both painted
behind it.

The error one is serious: `submitExam`'s catch sets it and returns to phase
`exam` **on purpose**, so a failed hand-in can be retried. Behind the overlay that
becomes a candidate pressing Submit on a paid attempt, the modal closing, the exam
reappearing, and **nothing on screen saying the submission failed.**

Found by walking each phase rather than describing them. Both banners now render
in the pinned header.

### 2.5 I said the persistence engine was broken. It was not.

Every `exam_session_items` row in every session ever taken shares one identical
`created_at` — `distinct_write_times = 1`, spread `00:00:00`, including 80-item
sessions. **I read that as "incremental saving has never worked for anybody."**

`generate-mock-exam` inserts the entire assembled form in one statement, so
`created_at` stamps form assembly. **Identical timestamps are correct behaviour.**
The column that records saves is `answered_at`, added by migration 164 — the
migration I had already cited twice.

Measured properly: three 80-item sessions with **80 distinct `answered_at` values
spread across 56 to 108 minutes.** `save-exam-answer` is an UPDATE that never
touches `created_at`. Resume returns real work. A dead browser loses at most 1.5
seconds.

> **The sharpest evidence was the sessions where distinct timestamps are FEWER
> than answered rows** — items changed inside one 1500ms window and flushed
> together. That batching signature only exists if the debounce is running.

I then built a whole recon around a false premise, offering two hypotheses that
were both unnecessary. **The engine that actually pays the bills is sound, and it
is sound by measurement rather than by assumption.**

---

## 3. The scheme documents drifted, and nothing was watching

`verify-cert.mjs`'s own docblock states the gap it was built to close:

> *"The pipeline documented STAGES but never enforced INVARIANTS. Nothing checked
> that what a cert SHIPS matches what its scheme document CLAIMS."*

It became something narrower — verifying the database against itself, blueprint
against `v_cognitive_profile` — and **the direction was never closed.** The scheme
documents are what an auditor reads and nothing checked them at all.

### 3.1 Why a declared block and not a parser

Task count alone takes **five syntactic forms** across eleven documents: bolded
prose split across a line break, plain prose, a middot-separated line, a
two-column attribute table, and a number inside a table cell beside a filename.

> **A parser handling five forms returns null on the sixth, and "no claim found"
> reads identically to "claim absent" — silent in the direction of passing.**
> That is the defect class this repository keeps paying for, and building a
> twelfth instance deliberately would be absurd.

A fenced `scheme-claims` block, authored, at the foot of each document. **Three
states, and the middle one is the design:** a declared value is compared, an
explicit `absent` passes only if the database is also null, and **a missing key
FAILS rather than skipping** — a claim nobody declared is a claim nobody checked.

> **THE BLOCK IS AUTHORED, NEVER GENERATED.** A block produced by querying the
> database would verify the database against itself and pass forever. When a
> check fails, establish which side is wrong; never regenerate the block.

### 3.2 The first run — `d5d28d1`

**Ten of eleven documents failed. Seventeen claims.** Only `ISMS-IA` passed clean.
And the checker caught its author:

> **`d5d28d1`'s OWN COMMIT MESSAGE SAYS "eight of eleven", AND IT IS WRONG.** A
> pushed commit message cannot be amended, so the correction lives here: the
> figure is **ten**, and `d5d28d1` is where the eight came from. It was repeated
> into an earlier draft of this section on the strength of the commit message
> alone.
>
> **Ten was established by reconstruction, which is why it is now right.** The
> eleven `scheme-claims` blocks were extracted as committed at `d5d28d1`,
> `verify-cert.mjs` was confirmed byte-unchanged since
> (`git log d5d28d1..HEAD -- scripts/verify-cert.mjs` is empty), and the checker
> was re-run against them: 17 scheme-claim failures across AIE-I 4, AIGRM-I 3,
> AIHR-I 1, AIMS-F 1, AIMS-IA 1, AISM-I 1, ISMS-F 1, SD-AI-I 2, SM-AI-I 1,
> SPO-AI-I 2. **A remembered count and a re-run are different kinds of number**,
> and only one of them survives being checked.

**`c8a1019`, hours earlier, had reconciled three Scrum schemes and got the
inventories wrong** by counting retired items. `verify-cert` filters
`retired_at is null` because it verifies what a cert *ships*. That commit
corrected one wrong number and introduced a subtler one; the tool built
immediately afterward found it (`c57e19c`).

**Two bugs in the checker itself**, both found before reporting. It compared
formatting rather than values, failing `D1=40.0` against `D1=40` — *a checker
that fails on a trailing zero is one someone silences.* And its item fetch hit
PostgREST's 1000-row cap, producing counts that were **wrong and plausible**.

### 3.3 What the reconciliation found — `c8a1019`, `bb1df8b`

**Twelve failures, eleven fixed, one deliberately left.**

> **A scheme document can safely state a WEIGHT and cannot safely state a COUNT.**
> Fifteen domain weights were correct across three schemes. Every number that had
> drifted was derived from counting rows. A weight is a decision the body made
> and holds until the body changes it; a count is a fact about a moving database
> that a task-splitting migration moves without anyone editing the file. Counts
> now carry an "as at" date and a pointer to what owns them.

**All three Scrum schemes understated duration** — migration 100 moved every
Level I Scrum exam to 90s per item and no document followed. One correction,
three documents. **They did not start from the same place:** `SM-AI-I` came from
45s, `SPO-AI-I` and `SD-AI-I` from 68s (`100:63-66`). An earlier draft said all
three came from 45s — the destination was shared, the origin was not, and
collapsing three rows into the worst one makes the migration sound more dramatic
than the file it cites.

**`SM-AI-I` said "All 51 tasks are within examination scope."** Task 5.11 is
`5_evaluate` and deliberately excluded because it sits above the MCQ ceiling.
**That was the only divergence that was FALSE rather than stale** — it asserted
the examination measures something it does not.

**`AIMS-IA` was the opposite of the worry.** Its `duration: absent` failed against
a populated column, and I read that as *something set it and the document does
not know*. Migration 212 is a 140-line migration devoted to that one value: it
refused to inherit ISMS-IA's 150, showed the arithmetic, picked the binding
language and said why, benchmarked the market, set a review trigger, and declined
the overclaim — *"the defensible claim is not that 165 minutes is correct, it is
that the number was derived from the built bank by a stated rule."* **The gate was
satisfied on 2026-08-13 and the document never learned about its own success.**

> **THE DATE WAS 08-12 IN THREE PLACES AND WRONG IN ALL THREE.** 212 was authored
> and committed `2026-08-13 14:00:19 -0400` and carries no date in its body, so
> `SCHEME-AIMS-IA.md` §6 was the only source — written yesterday in `bb1df8b`,
> whose commit message repeats it from there, into an earlier draft of this
> section. **2026-08-12 belongs to migration 205**, the AIMS-IA scaffold, whose
> blueprint JSON stamps `"declared_on": "2026-08-12"`. A date one migration
> earlier on the same certification reads as corroboration rather than as a
> collision. The scheme document is editable and was corrected; `bb1df8b`'s
> message is pushed and stands wrong.

**`SD-AI-I` ships at exactly its design minimum on both pools.** The inflated
counts were hiding it, and the sentence *"some tasks exceed the floor, which is
benign over-coverage"* was true of retired-inclusive numbers and false of the
shipping bank. **Any single retirement drops that live certification below its own
declared minimum**, and nobody knew.

**`ISMS-F` holds 192 concepts against 171's 191, and the difference is not one
row.** Diffing 171's seeded slugs against the live table:

```
in DB, not in 171:   climate-change-relevance
                     planned-change
in 171, not in DB:   environmental-conditions-relevance
```

**Two rows appeared and one seeded row vanished.** 191 - 1 + 2 = 192, which is
exactly why a count alone looked like a single quiet addition. An earlier draft
of this paragraph said "one concept with no migration, nothing inserted it", and
both halves were wrong.

**`planned-change` was inserted deliberately and it is written down.**
`scripts/patch-isms-f-clause-6-3.ps1`, committed 2026-08-06 in `6a4e3b2`, carries
the literal `insert into public.concepts ... 'planned-change'` at `:129-130` and
states the transition in its own header — *"Concepts go 191 -> 192."* What is
true is narrower and duller than the original claim: **it was never a numbered
migration.**

**The other two have no record anywhere**, and together they are a substitution
rather than an addition. ISO/IEC 27001 Amendment 1:2024 replaces the
environmental-conditions wording with climate change, and the database has been
moved to match — `environmental-conditions-relevance` out,
`climate-change-relevance` in — by something nobody wrote down in either repo.
That half is the same class as the `is_published` drop and the uncaptured RLS
predicates. The `planned-change` half never was.

> **A NET COUNT HID A THREE-WAY MOVE.** +1 was true and told me the wrong story:
> one unexplained insert, when what happened was two inserts, one deletion, a
> standards amendment behind them, and a committed script explaining a third of
> it. `bb1df8b`'s commit message carries the same wrong sentence — *"no later
> file inserts one"* — and is pushed. **Diff the members, never the cardinality.**

> **SEVENTEEN AND TWELVE ARE BOTH RIGHT, AND THEY ARE SCOPED DIFFERENTLY.**
> Seventeen is the whole first run. `c57e19c` then fixed five of them — `SD-AI-I`
> 2, `SM-AI-I` 1, `SPO-AI-I` 2 — leaving the **twelve** `bb1df8b` faced across the
> remaining eight documents, of which eleven were fixed and one deliberately
> left. Read together with nothing between them the two numbers look like a
> contradiction, which is what they looked like to a reader checking this file.

### 3.4 The one left failing, deliberately

**`AIE-I` claims 730-day validity; the database issues 365.** No migration ever
set 730. **Five credentials have been issued**, each with `expires_at` stamped at
365 days.

Editing §9 silently retracts a published two-year promise to five holders. Setting
the column changes what the credential means going forward. **Neither is a
documentation decision**, so §9 records the conflict in full and the block still
declares 730 — the checker reports it on every run until the body decides.

---

## 4. `SCHEME-SM-AI-II.md` — the thirteenth, and the first born checked — `1a0c71a`

**All twelve declared claims pass on the first run**, because it was written
against the live database rather than reconciled to one later.

> **TWELVE, NOT THIRTEEN — AND `1a0c71a`'s COMMIT MESSAGE SAYS THIRTEEN.** The
> block holds twelve keys, the checker prints twelve rows, twelve pass. The
> commit is pushed and cannot be amended, so the correction lives here. It
> collided with the true thirteen in the heading above: this is the **thirteenth
> scheme**, carrying **twelve** claims.

**§5 is the catalogue's first cognitive-only rung argument.** ISMS-IA and AIMS-IA
are Level II because internal auditor is a different job; this scheme cannot make
that argument. The position: **17024 requires two sets of competence criteria, not
two job titles.** Same title, different competence class is permitted; same
competence, harder items is not.

The distinction rests on the Guide's own account of itself, cited verbatim — *"The
Scrum framework is purposefully incomplete, only defining the parts required to
implement Scrum theory"* — **and deliberately not on what SM-AI-I examines**,
because a sibling's task inventory moves and a level boundary resting on one
drifts with it.

**§7.1 is the first minimally-competent-candidate definition in the catalogue.**
`ISMS-IA` §7 uses the term twice and defines it nowhere. Eleven schemes say
standard-setting is blocked on candidate data; **that is true of validating a cut
score and false of defining the borderline candidate**, which needs no candidates
at all. Stage 1 is DONE, stage 2 is blocked by *recruiting a panel*, stage 3 by
live operation — three stages with three different constraints, which eleven
documents collapse into one.

The definition is the deployed `SCRUM_L2_JUDGMENT` from `item-grounding.mjs` —
**one artifact with two homes**, so the published standard and the instrument that
produces items cannot drift apart.

**§11 is the first appeals section describing a process that runs.**

Two things the drafting session wrote better than they were briefed. §9: *"the
interval is set by the fastest-moving quarter of the body of knowledge, not by
its average"* — a sharper rule than "D5 is 22.5%", and it generalises. And §3:
**declaring a prerequisite the body does not verify would itself be a finding**,
because 17024 asks a scheme to define its prerequisites *and apply them*. So
"recommended, not required" is the only honest option available, not a soft one.

---

## 5. `certiglobal.org` was live on a buyer-facing PDF

The store wind-down reached `set-cert-link`, migration 267's purchase-URL
constraint, `buy-link.ts` and the marketing copy. **It missed
`functions/_shared/factsheet.ts`, because that string lives in a shared module
behind an asset renderer rather than on a page.**

Three languages, `tier: "client_safe"`, in the section headed *"Getting
started"*, telling buyers to purchase at a storefront that was retired and sells
nothing.

**The bump was the fix, not the wording.** `contentHash` covers `FactSheetData`
and the STRINGS table is not in it — change the copy and the path is identical,
the cached object is returned, and every existing factsheet keeps the old text
forever. `FACTSHEET_RENDERER_VERSION` 4→5 and `OBJECTIONS_RENDERER_VERSION` 1→2.

**The factsheet names no store host.** Migration 267 and `buy-link.ts:20-25` both
record that naming a store host is what let the old brand outlive its truth, and a
cached forwardable PDF is the worst place for a third copy. **Objections does name
it**, because it is internal enablement whose purpose is telling a human where to
send someone.

Also corrected: the objections *why* line said pricing *"genuinely isn't ours"* —
true when a separate company owned the storefront, **false now that the store is
our own subdomain.** It was teaching a salesperson to say something untrue about
their own employer.

**Twelve assets exist at old paths**, all 28–30 July: ten factsheets at versions
up to v4, across **three** certifications — `AIE-I`, `AISM-I`, `AIGRM-I` — plus
two `platform/objections/v1/` PDFs, which are platform-scoped and belong to no
certification at all. An earlier draft said four certifications, which counted
the two platform assets as if they were cert-scoped. Old
objects stay in the bucket; forwarded PDFs are unrecallable. **A note to whoever
sent them is worth more than the code change.**

---

## 6. A mark is a bookmark — `281`

Three objects carried one wrong idea, in three different wordings. Quoted
exactly, because an earlier draft quoted one column and attributed its words to
both:

- `exam_session_items.marked_for_review` (`164:89`) — *"Part of the examination
  record for the reviewer and appeals surface."*
- `quiz_attempts.marked_for_review` (`064:17`) — *"part of the examination record
  and the reviewer/appeals surface."*
- `idx_quiz_attempts_marked` (`064:19-20`) — the index exists because
  *"reviewers/appeals queries filter to marked items only"*.

Same idea three times, no two of them phrased alike — which is the whole reason
a catch-all grep had to match the shape rather than a remembered sentence.

Read next to the appeals docblock — which correctly plans to capture item flags
in-session and promote them at scoring — **the conclusion is automatic: this IS
that flag.** It is not. It is a navigation aid, and the candidate has asserted
nothing about the item.

> **If a promotion were built on it, every bookmark would become a filed
> challenge attributing to a candidate a claim they never made, in a clause 9.9
> record, at a volume set by how carefully candidates use a navigation aid. The
> most diligent candidate would generate the most false complaints, and nothing
> in the schema could object because every row would be structurally valid.**

**All three moved together.** An earlier draft corrected one and recorded the
others as owed — **worse in one narrow way than leaving all three wrong**, because
a reader who checks one and not the other gets a confident answer either way
depending on which table they opened.

**The replacement text avoids the word "appeal" entirely so the catch-all needs
no carve-out.** A check with exceptions is one nobody can run without first
reading which mentions are legitimate, and that is the property that let three
instances hide.

The index comment records that **nothing in either repository reads
`quiz_attempts.marked_for_review`**, rather than inventing a purpose. Kept because
it is partial on the TRUE rows and costs almost nothing.

---

## 7. Recorded, not built: item timing normalised by length

`ITEM-TIMING-ANALYSIS.md` (`1e432d3`). Migration 100 called every Level I Scrum
duration an interim setting to be replaced from observed completion data; this is
that deferred item, written before there is data rather than re-derived when there
is.

**Compare seconds-per-character for the same item across languages.** Measured:
es-419 runs **121.2%** of English by length and pt-BR **115.3%**, so a
proportional time difference is the language, not the item. **The residual after
normalising is the signal**, and an item whose es-419 seconds-per-character is an
outlier against its own English version is a **translation defect, which nothing
currently detects.**

**It cannot run.** No item in any language has more than 15 timed responses; seven
item groups have three or more on both the English and Spanish sides; **zero have
five.** pt-BR has never been answered by anyone.

**The depth gate is written into the query rather than applied to its output.**
Ungated it returns 85 rows that look exactly like findings and someone would act
on them; gated it returns zero, which is the correct answer today.

**`PSYCHOMETRIC-PROCEDURES` does not exist.** Migration 100:60 records this
deferral as living there *"as a deferred item with a live trigger"*, and no such
file has ever existed in this repository. **A pointer to a record is not a
record.**

---

## 8. Carried, not urgent

**`AIE-I` validity — 730 claimed, 365 issued, five holders affected.** A body
decision, not an edit. See §3.4.

**`isCertExam` is a shape proxy.** `kind === "certification_exam" ||
conceptBreakdown.length === 0` — a shape test standing in for identity, already a
known issue, and **now load-bearing on one more surface** since the certification
result view contains a link into appeals. Each surface built on it makes it more
expensive to settle.

**The exam footer measured 209px in devtools.** Not a break; the body scrolls and
submit stays reachable. Wants a look on real hardware.

> **THIS ONE HAS NO ARTIFACT AND THE ARITHMETIC DOES NOT CARRY ITSELF.** `209`
> appears nowhere in `components/exam/` — the height is composed at runtime from
> padding and control heights, so nothing in either repo can confirm it. An
> earlier draft called it *38% of an iPhone SE viewport*: 209/667 is **31%** on
> the 2nd- and 3rd-generation SE, and 38% holds only against roughly 550px, i.e.
> after browser chrome. That may well be what was measured, and the sentence did
> not say so. **A number carried out of a browser session is a reading, not a
> fact about the code**, and the next reader cannot re-derive it.

**`SD-AI-I` has no item-bank margin.** Exactly at floor on both pools; one
retirement drops it below its own declared minimum.

**The ungrouped-items invariant has moved by 70 and gained a second cert, and
`CLAUDE.md`'s baseline is stale.** That file records *"AIE-I, §8 'Every item
belongs to a question group' — 15 ungrouped items"* as the one known failure.
`verify-cert --all` today reports **AIE-I at 85 and SM-AI-I at 20** (and 1 on the
`ZZ-TEST-I` fixture). Found while re-running the suite to check something else,
not investigated.

> **A BASELINE NOBODY RE-CHECKS IS WORSE THAN NO BASELINE**, and `CLAUDE.md` says
> so in the paragraph this contradicts: *"a clean baseline nobody re-checks turns
> the next real failure into noise someone has already decided to ignore."* The
> defence it prescribes is comparing against the recorded table and investigating
> anything that moved. Seventy items moved and a second certification joined,
> and the run that surfaced it was looking for something else entirely.

**Focus can escape the exam takeover.** No focus trap exists anywhere in
first-party code, and no focus-trap library is used: `@radix-ui/react-dialog` is
a declared dependency that **no component imports**. Nothing hidden is focusable
— the rail and bottom bar are unmounted, not hidden. A polish gap, not a leak.
**One qualifier:** `@radix-ui/react-dropdown-menu` IS used
(`components/ui/dropdown-menu.tsx`) and manages its own focus scope while open.
That is a menu, not a modal trap, and it is nowhere near the exam surface — but
*"no focus trap exists anywhere in the codebase"* was stated flatly and is not
quite true.

**`ISMS-F` is 192 concepts against 171's 191, by a three-way move.**
`planned-change` in by a committed script and never a numbered migration;
`environmental-conditions-relevance` out and `climate-change-relevance` in, by
nothing anyone recorded. See §3.3.

**Before Stage 9, both blockers:** `item-profile.mjs` routes on the certification
NAME via `/\bscrum\b/` and does not read tier, so SM-AI-II would generate against
SM-AI-I's Level I difficulty profile. And the tier-2 generation constants still
live in a shell — owed since v6.5.

**pt-BR remains the answer to two unrelated questions.** Rendered once across six
renderer families, and never answered by a candidate.

---

## 9. Method notes

**A query returning zero rows is not evidence of absence until you have checked
the query.** Three instrument failures this session: a `col_description` join on
`ordinal_position` instead of `attnum` returned nothing while the foreign key it
contradicted proved the columns existed; `grep -c $'\r'` reported 0 CRs on a file
with 767; a case-sensitive grep reported warnings absent that were present at two
named lines. **In all three the check was wrong, not the thing being checked.**

**I measured the wrong column and read the result as a defect.** `created_at` on
`exam_session_items` stamps form assembly. The column that records saves is
`answered_at`, in a migration I had cited twice. **The recon I then commissioned
was built entirely on a false premise**, and the session that ran it found the
truth by reading rather than accepting the framing.

**Ten unverified claims this session**, each stated with confidence and each
wrong: that no scheme had a complaints section (one did), that nothing read
`difficulty_level` (the planner does), that nobody knew what
`trg_guard_cert_identity` forbids (migration 105 says), that `dvh` was unused
(two files use it, one recording why it was adopted after trapping real phone
users), that `exam_session_items` had no second-write column, and five line
numbers recalled rather than looked up. **The rule is not "read files before
editing them" — it is "measure before asserting", and an absence is a claim.**

**Sessions refused to fabricate, three times.** One declined to reconstruct three
buyer-facing strings it had never authored when a prompt claimed they were its
own. One declined to write an unverifiable citation *into the correction for an
unverified assertion*. One declined to mint a session for a named person's
production account to run a verification step. **All three were correct, and the
third could have been rationalised as helpfulness.**

**A guard that has never been seen to fail is not a guard.** The leak guard was
proved by planting a term and observing a non-zero exit — and **all eight routing
cases still printed `ok` while the leak was live.** Routing correct, vocabulary
wrong, and nothing but the wired guard could tell.

**Two defences are not redundant when the first is presentation.** The exam tab is
hidden while live *and* disabled and click-guarded. If the takeover regresses, a
visible tab that silently destroys a paid attempt is far worse than one that
refuses.

**A check you relax to make it pass stops being a check.** A `flush` grep hit
inside a new comment was fixed by rewording the prose, not by loosening the grep.

**The accent contract caught a real error in every wave.** Five waves, five
catches — four over-declaring accents, one under-declaring. The under-declaration
is the half easy to wave through: harmless in itself, and **indistinguishable at
the check from a string that gained an accent it should not have.**

---

## 10. What is next

**Stage 7 — 44 lessons.** The gate: author module 1 → external review → extract
the style guide → redo module 1 → review again → author the remaining four
modules to a proven guide. That gate exists so a defect in the first module does
not propagate into 44.

**Owed on the catalogue:** MCC definitions for the other twelve schemes, **written
from the JTA and not from the item bank** — an MCC derived from a bank describes
the bank rather than the job, and then a panel judges those items against a
description derived from those items. Batch them: the two Internal Auditors, the
two ISO Foundations, the three Scrum Level Is, AIE-I, and the governance three.

A shared standard-setting policy document each scheme references rather than
restates. And the **Minimum Competency Profile** as a candidate-facing artifact
derived from each scheme's MCC — framed as what the examination is set to
measure, never as an outcome claim, which `CLAIMS-POLICY` forbids.

**Still open from v9.3 and v9.4, untouched:** no order-ingest path; nothing tells
a holder they passed; eight leads in a table with no screen; DMARC at `p=none`;
whether AIGRM-I ever completed Stage 9, open since v3.6 on a live cert carrying
assigned vouchers.

---

## 11. The line worth carrying

**Every defect this session was a component that worked correctly and was joined
to nothing.**

The appeals table with its guards and no writer. The leak guard computing a result
and discarding it. The `SD-AI-I` instruction that asked a future reader to verify
the one number that was wrong. `PSYCHOMETRIC-PROCEDURES`, pointed at by a
migration and never written. `marked_for_review`, captured for a reader that does
not exist.

**None of them failed. Failing requires being called.**

v9.4 said the reliable way to find silent success is to be the first user of
something. What this session adds is the other half: **the reliable way to prevent
it is to make the absence produce an event.** The leak guard now increments a
failure count. The missing scheme claim now fails rather than skips. The partial
unique index now refuses what the pre-check might miss. The `absent` state now
passes only against a null.

Every one of those turns *nothing happened* into *something said so*.

*End of v9.5.*
