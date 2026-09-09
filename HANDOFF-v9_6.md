# HANDOFF v9.6 — the exam looks like one, the appeals loop closed, and a policy that was correct and unreachable

**Migration tip: 282. Next free: 283.** Read the disk. `ls migrations/ | tail -1`.

**Everything pushed, both repos.**
`certidemy-supabase` — `da8e9ff`, `b8ede24`, and `b730fab`/`91cb4d2` from the
tail of v9.5's window.
`certidemy-web` — `2c3290a`, `23d8ed2`, `9911558`, `37de604`, `f2e8f11`,
`706f1ee`, `ea561f3`.

Three things happened. **A candidate sat an exam and the presentation was the
weakest thing in the product.** Fixing it broke the exam for a working day and the
fix for that revealed the actual mechanism. **The appeals process ran end to
end for the first time** — and failed on a grant that had been missing since the
table was created. And a survey taken while chasing that grant found **56
discarded Postgres errors** across the console.

---

## 1. The exam is a full-viewport three-column presentation

`2e09d80` made the exam a takeover and **the content kept the 768px width it had
when it was a page inside a sidebar.** Measured in a browser on a 1900px display:
roughly 1,100px of dead grey beside a question that scrolls, with a browser
scrollbar - which is most of what makes an examination read as a webpage.
**A browser reading, with no artifact in either repository** - the same standing
as v9.5 exam-footer figure. The 768px cap is in the code and is the checkable
half.

**`docs/EXAM-UI-SPEC.md` is the standing spec.** Three registers from one tree:
single scrolling column below `md`, item plus status rail at `md`, and
navigator │ item │ status at `lg`, capped at 1600px so the measure stays near
75–80 characters.

**The mobile case did not regress and that was a hard constraint.** A single
scrolling column is right on a phone and wrong on a desktop, and the previous
layout was the mobile one stretched.

### 1.1 Five navigator states, not four

`not visited` and `not answered` are different things, and which one a cell is
decides where a candidate spends their last ten minutes. Four states cannot
express it — a question they read and could not answer looks identical to one
they never opened.

**`visited` is derived from having been the current index and is deliberately
not persisted.** It is presentation state; a column for it would touch the path
this file protects. **It is empty on resume, which is correct** — a returning
candidate has not visited anything *in this sitting*, and showing last week's
visits as this sitting's would be a claim nothing measured.

### 1.2 The keyboard, and the refusal that matters

`1`–`9` by position, `a`–`d` by letter, arrows navigate, `m` marks, `Enter`
next, `?` for the overlay. Three refusals: a held modifier, focus in a text
surface, and **any open modal.**

> **The modal check reads a `data-exam-modal` marker on both dialogs, not a
> z-index or a `fixed inset-0` shape test.** A stray `2` selecting an option
> behind a confirmation dialog changes a paid answer the candidate cannot see —
> and a shape test would match any future overlay while missing a restyle of
> these two. Same lesson as `isCertExam`, applied before it became a defect.

**Shift is refused per-branch, not globally**, because `?` is Shift+/ on most
layouts and a blanket refusal would make the overlay unreachable on the
keyboards most candidates use.

### 1.3 Resume lands on the first unanswered question

It landed on index 0, so a candidate returning with an answered prefix clicked
past their own work.

**Mark-only saved rows are not counted as answered.** Marking an item for review
saves a row too, with an empty `user_answer` — and those are exactly the
questions the candidate flagged to come back to.

`hasAnswer` and `firstUnansweredIndex` are module-level with two call sites: the
resume initialiser reads `savedAnswers` at mount, the rail's jump control reads
live `answers`. **The lookup is a parameter and the definition is not** — a
second copy of that `findIndex` would be free to drift from the first.

### 1.4 The rail, and one thing it deliberately does not do

Timer at 40px as the hero, progress bar, three counts, mark for review, a time
budget, jump-to-first-unanswered, and **Review & submit anchored at the bottom
as the only accent-filled control on the screen.**

`9911558` moved prev/next into the item column and left submit behind, so at
`lg` a candidate finishing question 25 **had no visible way to hand in.** That
was functional, not cosmetic.

> **Why accent here and nowhere else.** Accent already carries *this is your
> answer* on the selected option and *this is where you are* on the navigator
> ring. A third accent object competes with both — which is why `Next` stays
> ink-filled. Submit earns it: terminal, taken once, and not a state.

**The time budget is arithmetic and never a verdict.** `secondsLeft ÷
unansweredCount`, flat, with no threshold and no colour change. *"≈1:52 per
remaining question"* is something a candidate can check; *"you're falling
behind"* is a platform telling someone mid-paid-exam that they are failing.
**The merge script enforces it** — it refuses eight judgment words across three
locales before it writes.

**A marked-questions list was rejected.** At `lg` the navigator is permanently
visible three columns away with warn dots on exactly those cells, and a second
rendering of one fact is the mirrored pair this repository keeps paying for.

---

## 2. The takeover broke every exam, and the cost was zero

**And the mechanism was not what I diagnosed.**

`AppShell` returned two structurally different trees — `<div>{children}</div>`
when immersive, `<div><AppRail/>…</div>` otherwise. React reconciles by position
and type, so at child index 0 the element went from the page subtree to
`<AppRail>` and **the entire page unmounted every time `immersive` flipped.**

`MockExam` is what sets `immersive`. So it unmounted itself:

```
phase 'exam' -> publishes live=true -> AppShell changes shape ->
MockExam unmounts -> cleanup reports live=false -> shape changes back ->
MockExam remounts at phase 'checking' -> resume check finds the same
session -> phase 'exam' -> repeat
```

**The screen said "Checking for an exam in progress" forever, and that string
was the proof.** `setPhase("checking")` appears zero times in the file — it is
the `useState` initial value, reachable only by mounting.

**It was free for years because `quizPlay` derives from the pathname**, which
only changes across a navigation where the subtree is being replaced anyway.
`examLive` is the first trigger that toggles *within* a mounted tree, and it
turned a free remount into a loop.

**My hypothesis was wrong and was disproved cleanly.** I blamed a
`router.refresh()` whose `useRef` guard resets on remount — but a remount always
starts at `phase='checking'` and the refresh effect requires `'results'`, so it
can never re-fire after the remount it caused. The revert was correct and was
not the fix.

**The fix is one tree shape.** `{children}` is always `root > div[1] > main >
children`; only what hangs off it varies. **Do not reintroduce a structural
branch anywhere in that component**, however much tidier it reads.

> **HOW LONG IT WAS BROKEN IS NOT RECOVERABLE FROM GIT, AND AN EARLIER DRAFT
> SAID EIGHT HOURS.** What git gives is the interval between commits:
> `2e09d80` at 2026-09-08 09:55 and `23d8ed2` at 14:59, **5h04m**. Deploy times
> are not in the repository, so the live window could be shorter or longer than
> that and no artifact here settles it. The commit interval is the measured
> figure; eight hours was a recollection.

**Cost: zero, and this half IS measured.** `exam_attempts` had no completions in
the window and
`quiz_sessions` had no `certification_exam` rows started in it — checked with a
control proving the query reaches rows. Nobody lost a voucher.

### 2.1 And the takeover introduced two defects of its own

**The seat pill offered to sell a voucher to someone who had just passed.**
Putting it inside `ExamPageChrome` made it remount at results; `score-mock-exam`
flips the voucher to `redeemed`, `getEligibility` reads only `assigned`, and the
`hasCredential` prop is the stale server value from page load. **Before the
takeover the pill never refetched, so it was safe by accident.**

Fixed in two halves. `credentialEarned` in context, set from `scored.passed`
before `setPhase("results")` in the same React batch — **a value already in
hand, no round trip, so the BUY state cannot appear for one frame regardless of
the network.** Then `router.refresh()` once for correctness.

> **If the refresh never resolves, the pill stays hidden and the results screen
> is otherwise complete. The failure direction is "says less", never "says
> something false."** That is the property a certificate screen needs.

**The submit-failure banner painted behind the takeover.** `mock-exam.tsx`
rendered it as a sibling above a `fixed inset-0` runner. `submitExam`'s catch
sets it and returns to phase `exam` *on purpose* so a failed hand-in can be
retried — and behind the overlay that becomes a candidate pressing Submit, the
modal closing, the exam reappearing, and **nothing saying the submission
failed.** Found by walking each phase rather than describing them.

---

## 3. ISO/IEC 17024 clause 9.9 ran end to end, and failed on a grant

**Filed 01:45 UTC, decided 02:37 UTC, reviewer recorded, resolution visible to
the candidate.** The first appeal in the platform's history, on a table that
twelve hours earlier had zero rows and no code path.

**It failed the first time.** *"The decision could not be saved."*

### 3.1 RLS is not a grant

`062:204-207` created a well-formed UPDATE policy — **both `USING` and `WITH
CHECK`**, which is the thing an UPDATE policy usually gets wrong. `062:209`
granted `select, insert`.

```
relacl:  authenticated=ar/postgres
                       ^^   a = INSERT, r = SELECT.  No w.
```

**The table-level ACL is checked BEFORE row-level security**, so
`is_platform_admin()` was never evaluated and the write failed with a silent
`42501`. **The policy has been correct and unreachable since it was written.**

**The asymmetry was the tell and I read it too late.** Filing worked, reading
worked, deciding did not — which is `a` and `r` present, `w` absent.

**Migration 280's header read `062:209`, recorded that it was reusing the grant,
and did not notice it lacked update.** Reading a line is not checking what it
says.

**`282` grants it column-scoped** — `status`, `resolution_note`, `updated_at`,
`reviewed_by`, `reviewed_at`. RLS restricts *which rows*; the column grant
restricts *what can change*, so a candidate can never rewrite their own `reason`
or forge a `reviewed_by` even if a policy is later loosened. Verified:
`has_column_privilege` on `reason` is **false**.

> **THE INSTRUMENT TRAP, AND IT IS WORSE THAN IT LOOKS.**
> `has_table_privilege(…,'UPDATE')` returns **false** under a column grant — it
> means the whole table. And `pg_class.relacl` still reads `authenticated=ar`,
> byte-identical to before the fix, because column privileges live in
> `pg_attribute.attacl` and never appear in `relacl` at all. **The instrument
> that found the defect is blind to the repair.** A future session checks the
> table privilege, sees false, concludes the grant is missing, re-applies it
> table-wide, and destroys the scoping. `CLAUDE.md` already warns that a
> table-wide `GRANT UPDATE` silently overrides a column-level `REVOKE`.

---

## 4. Fifty-six discarded Postgres errors

`console/appeals/actions.ts` **at `f2e8f11^`** had `code`, `message`, `details`
and `hint` from
PostgREST in hand and kept none of them. Anything outside `MISSING_COLUMN_CODES`
returned a generic failure and the error went out of scope.

**That cost a full debugging session on a one-word missing grant.**

> **A function that logs the failure it predicted and discards the one it did
> not is worse than one that logs neither, because it reads as though it handles
> errors.** That same function `console.warn`s its degraded path, with a comment
> saying the person who can apply the migration may not be the person who
> clicked.

> **EVERY LINE NUMBER IN THIS SECTION IS PRE-FIX, AND IS NAMED AS SUCH.** These
> citations point at the defect, and the commits that fixed it moved the files.
> A reader opening `lib/console/appeals.ts:129` today sees a type comment, and
> `:196` today is the repaired `logPgError` call - the opposite of what the
> sentence describes. Same for `console/appeals/actions.ts`. Read them at
> `706f1ee^` and `f2e8f11^`.

### 4.1 The survey - `docs/DISCARDED-ERRORS.md`

**56 discards, 3 logging call sites. Roughly 19:1.** Discarding is the
convention.

> **THE FIXED/REMAINING SPLIT DID NOT CLOSE, AND IT IS THE THIRD SUCH COUNT IN
> THREE DAYS.** An earlier draft of this section, and
> `docs/DISCARDED-ERRORS.md:5` where the figure originated, both read "three
> sites are fixed; 51 are not" - against a total of 56. Three plus 51 is 54. The
> four `FIXED` markers in the survey name **seven** individual sites, not three:
> `lib/appeals/actions.ts:140` (1), `console/appeals/actions.ts:163, :174` (2),
> `lib/console/access.ts:43, :77, :92` (3), `lib/console/appeals.ts:129` (1).
> **56 - 7 = 49.**
>
> **The inventory was right and only the split was wrong.** The shape totals sum
> correctly - 15 + 18 + 7 + 16 = 56 - so the survey found what it says it found
> and then miscounted what had been done about it. That is the distinction worth
> keeping: a wrong total would discredit the survey, a wrong split discredits one
> sentence.
>
> After the 24-vs-22 in `PARTNER-PLATFORM-SIZING.md` and the eight-of-eleven in
> v9.5 §3.2, **this is the third count in three days that read as authoritative
> and did not close.** All three were caught the same way: by adding them up.

**The finding is that both functions which log also discard.** `loadIssuing`
logs six query errors and drops two more in the same body — in a function whose
own comment describes fixing this exact class across five queries. **This is not
a place where nobody thought about errors.**

**Seven sites fixed** (`f2e8f11`, `706f1ee`), **49 recorded and not fixed.** Two
were worth doing immediately:

**`lib/console/access.ts` — the gate.** Three discards in the single source of
truth for console authorization. A failed `profiles` read leaves `platformRole`
undefined, the function returns null, and **a platform_admin is bounced with no
signal anywhere** — indistinguishable from a learner who wandered in. Logged at
three call sites, and **all three at the same severity**. `logPgError`
(`lib/log-pg-error.ts:76-92`) takes `(where, error, context)` and has no level
parameter; its body is a single `console.error`. What distinguishes them is the
`where` string, the context keys and the comment above each - not the weight.
**The `companies` read genuinely matters less** - it degrades a label, where a
failed `profiles` read bounces a platform_admin - **and the logger cannot
currently express that. That is a gap, not a design.**

**`lib/console/appeals.ts:129` at `706f1ee^` — the same defect, same feature,
read side.** Any
error triggered the migration-280 fallback, **including a `42501` the fallback
cannot fix** — so a permissions refusal presented as *"280 is not applied"*,
which is the wrong diagnosis delivered confidently, and it is the wrong
diagnosis you would have been given twice. Now gated on `PGRST204`/`42703`.

**And that file's header claimed something it could not do.** It said the
profiles degradation *"IS the measurement nobody could take from the
repository — if names appear, platform_admin can read profiles; if uuids appear,
it cannot."* **The error was discarded at `:196` (also `706f1ee^`), so uuids
appeared for a policy
refusal and for a genuine absence alike.** A claim to be measuring something,
resting on a value nothing recorded. It is a real measurement now because the
read is logged — and the *rendering* is deliberately still identical for both,
because that is the honest presentation and the client cannot responsibly guess.

### 4.2 The open decision on the gate

A failed read and a genuinely absent profile return the same thing today, and
the header states that as policy: *any query error degrades to no access rather
than throwing.*

**An absent profile is a real answer; a failed read is no answer at all**, and
the current behaviour converts it into the negative one. **It fails closed,
which is the right direction for an authorization gate.** The cost is
availability, not safety.

**Decision: leave it, and decide from evidence when the log shows it happens.**
The only alternative that improves what the bounced person experiences is a
third `"unavailable"` state, and that is a complete migration of every caller to
be worth anything.

---

## 5. Partner-authored certifications — sized, with the governance decision made

`PARTNER-PLATFORM-SIZING.md` (`b730fab`).

**THE GOVERNANCE DECISION: partners are the certification body for their own
schemes. Certidemy is the platform.** Under 17024 the body owns the competence
claim, and adjudicating an appeal on a partner's subject matter would mean
asserting competence this body does not have in a domain it did not design — and
adopting their standard-setting as our own. **Their indefensible cut score is
their exposure.**

**The credential half is already multi-tenant and already in production.**
`test-partner-02` holds six credentials signed with its own Vault key,
`can_read_issuer()` backs eight policies, `requireIssuerAccess()` backs eight
functions, and every OB3 identifier is issuer-parameterised. **Nothing has
connected it to a certification. That is the whole gap.**

**19 of 45 `is_platform_admin()` policies must change** — 17 operational plus the
two appeals, which join them under the governance decision — **and 16 are the
same policy written sixteen times.** Three unique indexes are global where they
should be issuer-scoped, and two already have hand-maintained cert-prefix
conventions that exist *because* of it, so the schema fix retires an authoring
rule.

### 5.1 "Move the invariants into the database" was the wrong instruction

The firewall, the item floors, the trilingual-group rule, the four-option floor,
the cue guard and the blueprint fill all live in `verify-cert.mjs`, a script run
from a terminal. **A browser author never runs it.**

> **A constraint says this state is impossible; a gate says this state cannot be
> published.** A constraint must hold at every instant, including while a bank is
> half-built — and enforcing the item floors at write time would **forbid
> writing the first item.**

**Two are constraints. Four are publication gates.**
`trg_guard_cert_has_active_achievement` is already that pattern:
`BEFORE UPDATE OF status`, one query, affordable precisely because it runs once
per publication rather than once per row.

**A deferred trigger does not rescue the trilingual rule** — the three language
rows do not land in one transaction, and pt-BR does not exist for AIMS-IA at all.

**The cost is three decisions, and almost none of it is SQL.** 36 live items
carry fewer than four options, all practice, zero secure. Making the per-item cue
check a row trigger changes the rule from a 2% tolerated escape rate to zero —
**and ISMS-IA already failed its own audit on 26 items sitting between the
tolerance they were built with and the one they were judged by, none defective.**
And a publication gate no partner can bypass also binds Certidemy, whose own
workflow publishes by running a script and reading the output. **A gate with an
exemption for the platform is not a gate.**

---

## 6. `LESSON_AUTHORING_SPEC` §4.7 described something that never existed

It said checkpoint questions are inserted into `quiz_questions` at publish time
with `is_exam_scope = true`. **No code path does that**, and none ever did:
`git log --all -S'quiz_questions' -- lib/lessons/` returns nothing across all
history, and `73fcc99` *documented* the client-side behaviour rather than
removing a path.

**My "firewall breach" framing was wrong and the correction corrected itself.**
`pool` defaults to `'practice'` and the retired sentence named only
`is_exam_scope` and `task_id`, so such a row would reach the **simulator** —
carrying a question the candidate has just been shown the answer to, with
`is_exam_scope = true` where `generate-practice-questions` sets it false.

**§7.4 is not missing and never was.** It has been in the spec since `1101acf`,
2026-06-25.

> **AN EARLIER DRAFT OF THIS PARAGRAPH CITED A LINE NUMBER, AND THAT IS THE
> ERROR RESTATING ITSELF.** It said "line 579". §7.4 was at **559** when
> `1101acf` created it, had drifted to **579** by yesterday, and sits at **745**
> today - moved the second time by `91cb4d2`, the commit this same paragraph
> describes. A line number asserted as stable, inside a paragraph about four
> documents getting a §7.4 claim wrong, and falsified by the fix it is
> reporting. **A durable citation is a commit.** The date and the hash do not
> move; nothing else in a file reference survives an edit above it. **HANDOFF v6.4 asserted its absence from the very tree
that contained it**, and the claim propagated through v6.7, v6.8 and
`NEXT-SESSION-AIMS-IA.md`. **v6.9 flagged it as likely stale and said "git log
the file". Nobody ran it for two months.**

**And a §8 hazard found while checking:** four checkpoint stems match secure-bank
items *verbatim* across certifications. Not derived — generic definitional stems
on a shared framework collide, and nothing detects it. Now a §9 checklist line.

---

## 7. Carried

**AIE-I's validity conflict.** 730 claimed, 365 issued, five holders. Still the
only scheme-claim failure `verify-cert --all` reports, deliberately, until the
body decides.

**49 discarded errors**, inventoried and unassigned. Seven of the surveyed 56
are fixed; see §4.1 for why the figure was 51 in an earlier draft.

**36 items with fewer than four options.** All practice.

**`isCertExam` is a shape proxy** — `kind === "certification_exam" ||
conceptBreakdown.length === 0` — and now load-bearing on one more surface.

**Focus can escape the exam takeover.** No focus trap exists anywhere; nothing
hidden is focusable, since the rail and bar are unmounted rather than hidden.

**Two browser-only acceptance tests remain unclaimed**, plus `?` on a non-US
layout.

**`ci-press` is defined nowhere and used widely.** No Tailwind config, no
`globals.css`, no non-usage occurrence anywhere outside build artifacts. **The
reach is the argument, so all three numbers:** 26 files in `components/` (the
figure `docs/EXAM-UI-SPEC.md:208` gives, and it says *component* files), **30**
across `app` + `components` + `lib`, and **53** repo-wide excluding build
output. Logged, deliberately not touched - defining it changes every one of
those usages at once.

**Before Stage 9:** `item-profile.mjs` routes on the certification NAME via
`/\bscrum\b/` and does not read tier, so SM-AI-II would generate against
SM-AI-I's Level I difficulty profile. And the tier-2 generation constants still
live in a shell, owed since v6.5.

---

## 8. Method notes

**Four proxy-check failures in one file, all the same shape.** Asserting class
*adjacency* in a `className` string when the property is class *membership* —
`text-left` sitting between two tokens was enough to fail it. **For Tailwind, a
phrase search over a className is a contiguity proxy.**

**Two count-as-property failures.** *"`savedAnswers` appears exactly 4 times"*
when it appears 6, and a call-site count that included the definition. A count
standing in for a property, which this repository's own history names.

**A comment that falsified itself.** Step 1's status-rail docblock said "carries
only the timer for now" and "type is step 2" — true when written, false once
step 2 filled the rail. Rewritten rather than left.

**`space-y-5` beats a plain `mt-auto` on specificity.** Its `> * ~ *` selector
sets `margin-top` on every child after the first, so the submit button would not
have pinned and **the failure would have been silent.**

**`my-auto` rather than `justify-center`.** Auto margins collapse to zero once
content exceeds the container; `justify-center` overflows in *both* directions
and clips the top of a long question **where the scrollbar cannot reach it.**

**The diacritic detector earned itself twice.** `·` in a navigator string and
`≈` in the time budget are both non-ASCII and neither is an accent. Under the
old "any non-ASCII" test **a flattened Spanish string would have passed** — and
in the budget's case Spanish carries no diacritic in that set at all.

**A regex built through shell → JS string → RegExp lost its backslashes**, so
`\?\?` became a quantifier. Replaced with a literal `includes`, which has no
escaping layer.

**The documented instrument was verified rather than assumed.** `ls migrations/
| tail -1` works because zero-padded prefixes make lexicographic and numeric
order agree — worth confirming in a session with this many broken instruments.

**A handoff is a record of a moment.** Three v8.8 addenda still read
"Migration tip: 263" and were deliberately left, because editing a dated
document's header falsifies it. Only `CLAUDE.md` is a live instruction, and only
`CLAUDE.md` was corrected.

---

## 9. What is next

**Stage 7 — 44 lessons for SM-AI-II.** Module 1, external review, extract the
style guide, redo module 1, review again, then the remaining four. The spec is
now correct enough to author against, which it was not this morning.

**Owed on the catalogue:** MCC definitions for the other twelve schemes, written
**from the JTA and not from the item bank** — an MCC derived from a bank
describes the bank rather than the job, and then a panel judges those items
against a description derived from those items.

**Still open from v9.3 through v9.5:** no order-ingest path; nothing tells a
holder they passed; eight leads in a table with no screen; DMARC at `p=none`;
AIGRM-I's Stage 9, open since v3.6 on a live cert carrying assigned vouchers.

---

## 10. The line worth carrying

**Every defect this session was found by using the thing.**

The presentation was wrong for months and nobody saw it until someone sat an
exam on a wide monitor. The takeover loop existed for hours and surfaced
the moment a real candidate opened a real session. The appeals grant had been
missing since the table was created and could only fail on the first decision
ever recorded. The discarded errors were a convention nobody questioned until
one of them cost an afternoon.

v9.4 said the reliable way to find silent success is to be the first user of
something. v9.5 added that the way to prevent it is to make the absence produce
an event.

**What this session adds is the third: an instrument can be wrong in the same
way the thing it measures can.** A grep that reports zero because it was
case-sensitive. A privilege check that reports false because column grants live
in a different catalog. A class-adjacency test standing in for membership. A
count standing in for a property. Every one of them looked like a finding and
was a broken tool — and the only reason any of them was caught is that something
else contradicted it.

*End of v9.6.*
