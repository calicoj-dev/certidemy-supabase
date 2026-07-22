# HANDOFF-v2.4 — Enrollment, Theme, Learner Home

Delta from HANDOFF-v2.3. Everything below is committed and pushed.

**Migration tip: 117. Next migration is 118.**

---

## 1. Enrollment — introduced, not fixed

**There was no enrollment model at all.** `/learn/[cert]` took no user and gated
on nothing; any signed-in visitor with a URL got the full module journey. The
"every user has all six certs" impression came from the RAIL SWITCHER calling
`listPublishedCerts` — nothing was ever auto-assigned.

### Migration 114 — `user_certifications`

```
(user_id, certification_id) PK
source  : self | voucher | seat | admin
status  : active | archived | completed
```

**ENROLLMENT IS INTENT, NOT ENTITLEMENT.** This is the load-bearing decision.
`vouchers` / `seat_batches` / `company_certifications` answer *who paid*; this
table answers *what am I working on*. Consequences:

- Self-enrollment is **open** for any non-draft cert. Lessons and practice are
  the funnel; the **exam gate is unchanged** and still runs on voucher/seat.
- A company granting a seat can also insert `source='seat'` so the cert appears
  without a second step.

**RLS pins client inserts to `source='self'`** and makes `source` immutable on
update — otherwise a learner could self-grant a seat-labelled enrollment and the
console would show a seat nobody paid for. Delete is restricted to `source='self'`.

**Back-seeded** from module progress, lesson progress and claimed vouchers
*before* any gate shipped, so existing users were not locked out. Verified: no
user had progress without an enrollment.

### The gate lives in the cert LAYOUT

`app/[locale]/(learn)/learn/[cert]/layout.tsx`. Not per-page: the child routes
are ten files today and a per-page helper **defaults to unguarded** for anything
added later. A layout wraps routes that do not exist yet.

It **renders `EnrollmentPreview` in place of children** rather than redirecting —
a layout cannot tell which child it wraps, so redirecting the index would loop,
and a deep link to `/quiz` gets "add this certification" instead of a dead end.

`EnrollmentPreview` is purpose-built rather than `ModuleCatalog` in preview mode:
**it has no href fields at all**, so it cannot leak a lesson link.

### Unenroll = archive, never delete

ISO/IEC 17024 requires retention of certification decisions and results. Archiving
keeps progress, quiz history, FSRS cards and credentials; re-adding restores
everything. **Hidden entirely when a credential exists** — a learner may stop
studying; they may not un-pass an exam.

---

## 2. Learner home — `/dashboard`

Was a redirect stub into a cert. Now cert-agnostic.

**Leads with reviews due, not percent complete.** "17 due today" is an instruction
and brings someone back tomorrow; "43% complete" is a status and brings nobody
back. Percent appears as a ring on the card, where it reads as momentum.

**Certified certs show the credential, not readiness.** A pass probability against
a cert you already passed is meaningless, and "not measured yet" on a passed cert
reads as the product not knowing who you are.

**Credentials are their own section and render independently of enrollment.**
Enrollment is a study list the learner controls; a credential is the record.

Cards order by **last activity**, not enrolment date.

### Migrations 115 / 116 — home views

`v_user_due_reviews`, `v_user_cert_activity`, `v_cert_lesson_totals`.

**`security_invoker = true` is load-bearing.** A normal Postgres view runs with the
OWNER's rights and would bypass RLS on `fsrs_cards` / `user_lesson_progress`,
exposing every learner's data to every learner.

**116 exists because 115 read the wrong table.** `user_progress` has **zero rows for
every user** — it appears vestigial (still carries triggers, nothing writes it).
Progress lives entirely in `user_lesson_progress`. Symptom was a learner with 43
completed lessons being told "Not started". `user_progress` was NOT dropped —
dropping a table on one afternoon's observation is how you lose data some
quarterly path writes.

**Progress rolls up by `lesson_group_id`.** A lesson completed in two languages is
one lesson. The cert dashboard counts per-language rows, which is why it shows
"36 / 31" — over 100%. Worth reconciling.

---

## 3. Migration 117 — the silent-failure class

`credentials` had a correct RLS policy and **no table-level GRANT**. Postgres checks
the grant BEFORE the policy, so every read failed 42501, swallowed by
failure-tolerant loaders. A learner holding two credentials saw none of them
anywhere in the app.

**RLS IS NOT A GRANT.** Whenever a policy is added, add the matching grant.

Audit query — anything it returns is another feature quietly doing nothing:

```sql
select p.tablename,
       has_table_privilege('authenticated', format('%I.%I', p.schemaname, p.tablename), 'SELECT')
  from (select distinct schemaname, tablename from pg_policies where schemaname='public') p
 where not has_table_privilege('authenticated', format('%I.%I', p.schemaname, p.tablename), 'SELECT');
```

Still returning: `admin_actions`, `audit_logs`, `chat_messages`, `chat_sessions`,
`company_invites`, `document_chunks`, `lesson_format_preferences`,
`module_prerequisites`, `quiz_questions`, `simulation_attempts`, `simulations`,
`source_documents`.

Most are service-role tables and correctly locked. **`quiz_questions` being locked is
load-bearing** — practice and exams go through edge functions with the service role.
But **`chat_sessions`, `chat_messages` and `lesson_format_preferences` look like they
should be user-readable** — worth checking whether the tutor and lesson preferences
are failing the same way credentials was.

---

## 4. Theme system

`data-theme` moved to `<html>`, read from a **cookie server-side** so the correct
theme is in the first byte of HTML. This is why no blocking anti-flash script is
needed — localStorage is invisible to the server, which is the only reason those
scripts exist.

**~23 hardcoded `data-theme="dark"` wrappers stripped.** CSS resolves to the
nearest ancestor, so those subtrees pinned every visible pixel dark regardless of
`<html>`; the toggle flipped its own icon and nothing else.

**Light accent changed from "Pro Blue" `#0066cc` to brand magenta `#be185d`.** A
wordmark that changes colour when a user flips a display setting is not an
identity. `#be185d` is the AA-compliant magenta already documented in the file;
`#ff2d72` fails on white for small text and stays reserved for dark.

**Cost, stated:** the AI-Era badge was magenta *because* nothing else on a light page
was. It keeps its pill treatment but loses hue as a distinguishing feature.
Reverting is four lines.

**Hardcoded whites swept** across checkpoint, callout, diagram, all six widgets,
lesson-nav and the tutor drawer. `text-white` on accent chips and the switch knob
deliberately kept — those tokens are dark enough for white text in both themes.

---

## 5. Lesson fixes

**Focus pager chains at its boundaries.** Panel 1 "Previous" walks to the previous
lesson; the final panel's "Next" to the next one. Dead greyed buttons framed the
most important moment in the lesson and read as broken rather than as boundaries.
Keyboard deliberately does NOT cross — an arrow key is too cheap a gesture to
leave a lesson with.

**The lesson-to-lesson footer is review-mode only.** In focus mode it competed
with the panel pager: two controls both saying previous/next, meaning different
things.

**Trilingual chrome.** `FinalSlide`, `CheckpointView` and review mode were hardcoded
English inside Spanish and Portuguese lessons. Now keyed off **the LESSON's
language, not the UI locale** — a lesson row is per-language, so its chrome must
match its content.

### STILL OPEN, AND IT IS THE BIG ONE

**In-lesson checkpoints do not reach the server.** Answers are scored client-side
against the embedded `correct` array and discarded — no mastery update, no FSRS
scheduling. A learner working through lessons watches their dashboard numbers
stay flat, which reads as the product being broken. Wiring it touches the engine
and the **practice/secure pool boundary**, where a mistake could leak secure items
into practice. Deserves a dedicated session.

---

## 6. Patch-script methodology — three silent failure modes

All three cost real time in this session and none of them throw.

1. **Repo-original files are CRLF**; files written by this workflow are LF. A
   multi-line anchor written with `\n` matches **zero** times against a CRLF file.
2. **Indentation is not uniform**, so even single-line literal anchors miss.
3. **Never import `Link` / `useRouter` from `next/*`** — always
   `@/lib/i18n/navigation`. `next/navigation` pushes raw paths that match no route
   under `app/[locale]` and **fail silently**: no error, no URL change, nothing.

**The pattern that always works:** match a line by REGEX, read that line's own
indentation, reuse it. Detect the file's EOL and preserve it on write. Every patch
built this way applied first time; roughly half the literal-anchor ones did not.

Scripts must **fail closed** — hold all writes until every anchor in every file
matches. Partially-applied edits across two files are worse to debug than none.

---

## 7. Scorer investigation — NO DEFECT

Two sample credentials exist at 8.75% and 35% against an 80% threshold. Checked
because a credential issued below the pass mark is an audit finding.

`score-mock-exam/index.ts:112` reads `Number(cert.passing_score_pct ?? 85)` and
line 282 compares `score_pct >= passing_threshold`. Fallback is 85 — stricter than
80, so even a null cannot let anyone through. **The scorer is sound**; those rows
were seeded or predate a threshold change. They are slated for purge before launch.

**One real inconsistency:** `_shared/prompts.ts:169` tells the study-plan model that
passing is **70%** while certs are set to **80%**. The tutor is calibrating advice to
a bar that does not exist.

---

## 8. Queued next, in priority order

1. **JTA translation backfill — 388 strings.** 19 domains and 175 tasks across
   SD-AI-I, AIE-I, AIGRM-I, AISM-I have **zero** es-419/pt-BR rows; SM-AI-I and
   SPO-AI-I are missing 2 tasks each. Largest remaining gap between this and
   something a Spanish speaker would pay for. One source of truth = the JTA.
2. **Checkpoint server wiring** (§5). The learning loop is open.
3. **Fix the 70% / 80% prompt inconsistency.**
4. **Check `chat_sessions` / `chat_messages` / `lesson_format_preferences` grants** (§3).
5. **Reconcile the cert dashboard's "36 / 31"** — per-language counting vs the
   deduped home view.
6. **Blueprint drawer labels** still hardcoded English (`triggerLabel="Blueprint"`,
   `subtitle="Job-Task Analysis"`).
7. **Claims into the scheme docs** — six `SCHEME-<CODE>.md` files.
8. **CertiGlobal logo** has no dark-on-light variant; fades out in light mode.
9. **`/certifications/family/[slug]`** still says "family" in a public URL.

### Commercial-readiness

The learner surface is materially stronger than at session start: enrollment is
real and gated, the app is themeable, the lesson experience is trilingual and
navigable, and there is a learner home worth landing on. The remaining blocker is
unchanged and unglamorous — **four certs show English domain and task names on
Spanish pages**. Everything else on this list is polish; that one is the product
not being finished in the languages it claims to serve.
