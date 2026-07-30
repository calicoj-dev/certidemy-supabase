# HANDOFF v4.0

Supersedes v3.9. Migration tip **164**, next free **165**. No new migrations this
stretch. Both repos clean and pushed.

v3.9 documented the examination-integrity defect and the two migrations that
closed it server-side. This stretch finished the chain end to end, put a live
monitor over it, documented it for the sales team in two forms, and fixed two
places where the interface was flattering itself.

---

## 1. THE EXAM CHAIN IS COMPLETE

Every stage is built, deployed and verified against real data.

| Stage | How |
|---|---|
| Form recorded at generation | `exam_session_items`, migration 163 |
| Answers persisted during the exam | `save-exam-answer`, debounced on change |
| Scoring grades the recorded form | `score-mock-exam`, merges saved answers |
| Resume the exact form with saved answers | `get-active-exam-session` |
| Abandoned attempts finalise themselves | Same endpoint, lazily |
| Live monitoring | `get-exam-monitor`, `/console/exams` |

### 1.1 What shipped since v3.9

**`score-mock-exam` merges saved answers with the submission**, client winning
per item. A candidate may change an answer up to submit and a failed save must
not cost them that; the saved copy fills every gap. Tampering was closed by
grading the *form*, so this does not reopen it. Consequence: **an empty
submission is a valid finalise.**

**`get-active-exam-session`** re-serves a recorded form in `presented_order` with
its saved answers, or finalises an expired one by calling `score-mock-exam` with
empty answers. Forwards the caller's Authorization header, so finalisation runs
as the candidate and the ownership check still applies.

**Engine client + runner hydration.** `getActiveExamSession` on the `Engine`
class; `exam-runner` accepts `savedAnswers` and seeds answers, marks **and
accrued time** from them.

**`mock-exam` resume detection.** A `checking` phase on mount, scoped to *this*
certification **and** matched on session kind. Without the cert filter, opening
AIE-I could resume an AIGRM-I session; without the kind match, opening the free
simulator could drop a candidate into their live paid certification exam.

**`ActiveExamBanner`** on the learner dashboard. Also the finalisation trigger —
see §3.6.

**Live monitor** — `get-exam-monitor` + `/console/exams`, platform_admin only,
polled every 4s and paused when the tab is hidden. Conduct, not content: pace,
timing spread, idle, integrity flags. Never which options a candidate picked.

**Localized 404.** `app/[locale]/[...rest]/page.tsx` catches unmatched paths and
raises `notFound()` after `setRequestLocale`, so `app/[locale]/not-found.tsx`
renders inside the intl provider. Before this, every mistyped URL under a locale
threw *"No intl context found"* instead of 404ing.

**Session cleanup.** 20 pre-163 sessions closed with `score_pct` null and
back-dated to `started_at` so they sit in the months they happened rather than
crowding every 24-hour window.

### 1.2 Verified, with numbers

- A resumed session showed the same 40 items in the same order with 6 answers
  restored, clock continuing from the original start.
- Two abandoned sessions finalised one minute apart on consecutive dashboard
  loads: `14d8ed14` scored **2.50%** (1 of 40 — six answered, one right) and
  `5b4b4f1d` scored **0.00%** (form served, nothing answered). Under the old
  behaviour the first would have graded 1/6 = 17%.
- 36 skipped items stored as `[]` rather than producing no row at all.
- Item timings spanned 1s to 84s on one form — the spread person-fit analysis
  reads.

### 1.3 Still open on the engine

- No visibility/focus **logging**. The runner uses `visibilitychange` to flush
  saves but does not record the event. Needs §3.7 first.
- No answer-change history — six changes look identical to one answer.
- `get-active-exam-session` handles **one session per call**, newest first. Fine
  for its purpose; not a cleanup tool.

---

## 2. DOCUMENTATION AND PUBLISHING

### 2.1 Two engine documents, deliberately different

**`/console/engine`** — internal briefing for sales, marketing and support.
Contains coaching that must never reach a client: what not to claim, what we gave
up by building our own engine, how to frame the fraud analytics without
overstating it. Names commodity quiz platforms because a rep needs the comparison
in their head.

**`engine_brief` PDF** — client-facing, per certification, trilingual, in the
sales library on the certification record node. Same mechanisms, **no competitor
names** (a client-facing document asserting what a named competitor does is Class
D under CLAIMS-POLICY), no claims blacklist, no internal framing.

Both put **what the examination does not do** *before* the ISO/IEC 17024 section.
A reader who meets the limits first reads the alignment as a considered position;
the reverse order reads as a claim being walked back.

The PDF carries a boxed paragraph stating that Certidemy is **designed to** the
17024 framework and **not accredited to** it, and that claiming accreditation
would be false until a third-party assessment happens. Volunteering that is
unusual; the reasoning is that a buyer who cannot find the distinction stated
assumes the stronger claim.

**Three vector diagrams** (renderer v2): the chain as two rows — authoring once
per version, delivery per candidate — the practice/secure firewall, and the
interruption timeline with the server clock spanning the gap.

`languages` on the brief is derived from the **secure pool**, not the platform's
three. A certification with no Portuguese secure items must not claim it. The API
response reports `languages_from: secure_pool | delivery_i18n` so a caller can
tell without opening the PDF.

### 2.2 Domain descriptions are now public

`loadBlueprint` carries `description`, localized like titles. The certification
page renders it as a native `<details>` disclosure under each weight bar — no
client JS, keyboard-accessible, and a domain **without** a description stays a
plain card rather than showing an arrow that opens nothing.

The 66 translated descriptions were flipped to `is_provisional = false`, so
Spanish and Portuguese are live on both the site and the generated documents.

### 2.3 K/S/A is NOT published, and translation is not the blocker

The columns exist (migration 161) and are empty. But the **English itself has not
had its editing pass** — some entries still read as internal notes:
*"Manifesto text; 4 values; 12 principles; origin (Snowbird, 2001)"*. Terse is
acceptable in a JTA sheet where a procurement reader expects it; on a public
marketing page it reads unfinished.

Order is: English editing pass → translate → publish. Skipping the first means
translating shorthand into three languages.

When it ships, it belongs in the existing `BlueprintDrawer` (which already
receives every domain and its tasks), not inline on the cert page — AIGRM-I alone
would put 51 tasks and ~150 fields on a marketing page.

---

## 3. FINDINGS

Six. Five are the same shape: **a check that reported success while doing the
wrong thing.** That is now the dominant failure mode in this project, well ahead
of anything actually breaking.

### 3.1 CRLF anchors — the most expensive and least guessable

Git on Windows checks files out as **CRLF**. Files written during a session via
`WriteAllText` with `\n` are **LF**. So a multi-line patch anchor written with
`\n` matches files authored this session and **silently finds zero** in every
original file.

This is why `library-flow.tsx`, `exam-runner.tsx` and `score-mock-exam` patched
cleanly and the certification page did not.

A zero-match report looks exactly like a stale anchor, so the instinct is to
re-read the source and re-cut it — which finds nothing wrong, because the visible
text is identical. The mismatch is invisible characters.

**Rule:** every multi-line patch script detects the file's convention, normalises
its anchors to it, and **prints what it detected**. See
`scripts/patch-cert-page-domain-descriptions.mjs`.

### 3.2 `is_provisional` is row-level; the row holds two independently reviewed fields

`domain_translations` carries `title` and `description` in one row under one flag.
Re-translating the descriptions marked the whole row provisional — including
titles reviewed weeks earlier — and every generated document correctly dropped
**both** and fell back to English.

That is what produced Spanish chrome around English domain titles in the AIHR-I
blueprint while the public catalog showed perfect Spanish.

**Either the flag splits per field, or nothing rewrites a row without
re-reviewing every field in it.** Adding an `is_provisional` filter to the public
loader would *reproduce* the fallback rather than prevent it — recorded in a
comment in `lib/blueprint/data.ts`.

### 3.3 Public site ignores `is_provisional`; generated documents respect it

So unreviewed machine translation was live on certidemy.com while the PDFs
correctly withheld it. Defensible — a webpage is correctable in a minute, a PDF
in a buyer's inbox for six months is not — but currently **accidental rather than
chosen**, and neither code path hints the other exists. Worth making explicit
whichever way it goes.

### 3.4 Domain bars were scaled to the largest domain, not to 100

`(weightPct / maxWeight) * 100` meant the largest domain always filled the track.
AIHR-I's 20/30/30/20 rendered as 67/100/100/67 — the eye adds that to far more
than the exam, under headings reading **"exam composition"** and
**"Transparencia total"**.

Fixed on both surfaces: the certification page and the home transparency section.
Every other number in this system is honest; this was the one place the interface
flattered itself, on the pages a buyer sees first.

### 3.5 Chrome does not overwrite downloads

A repeated filename lands as `name (1).ext`, and `Move-Item name.ext` silently
moves the **stale** file. This put a certifications catalog page into
`app/[locale]/console/exams/page.tsx`, which then rendered the wrong page.

The tell was in the build output: `/certifications` dropped from 3.65 kB to
**140 B** and `/console/exams` appeared at **139 B** — near-identical because
they were near-identical files. That size change was noticed and dismissed as a
caching artifact.

**Rule:** list before every move — `Get-ChildItem -Filter "name*.ext"` — and read
the result before running the next command.

### 3.6 Mounting `ActiveExamBanner` IS the finalisation trigger

`get-active-exam-session` is not a pure read: it scores and closes an expired
session when it finds one. The dashboard banner looks cosmetic; remove it as "just
a convenience" and abandoned attempts stop closing. Written into the component
header for that reason.

### 3.7 Telemetry has two prerequisites before it ships

**It is personal data.** Behavioural telemetry during an exam needs disclosing in
the privacy policy — what is collected, why, retention. The policy is one day old;
amend it once.

**GDPR Article 22.** If statistical analysis leads to revocation, that is
automated decision-making with legal effect: human involvement and a right to
contest are required. Both exist in practice; the policy must *say* so, and the
handbook must describe the sequence — flagged → notified → opportunity to respond
→ human decision → appeal.

---

## 4. NEXT SESSION

1. **English K/S/A editing pass.** ~900 fields, 302 tasks. Blocks translation and
   blocks publishing. The single largest content item left.
2. **Then** K/S/A translation, then the `BlueprintDrawer` rendering with the
   all-or-nothing language rule.
3. **Visibility/focus logging and answer-change history** — after §3.7.
4. **The `is_provisional` decision** (§3.2 and §3.3). A schema change or a written
   rule; either is fine, drifting is not.
5. Still open from v3.9: SM-AI-I task 4.12 missing from D4; *fuentes principales*
   has no column; `listCatalogGroups` never asks `cert_categories_i18n` for a
   label so program headings render English on the public Spanish and Portuguese
   catalog; `COGNITIVE-MODEL.md` §4 holds a stale hand-typed profile table.
6. Certificate still lacks **competencies** and **scheme version** — small
   renderer changes, and the last two gaps in the demonstration credential.

---

## 5. OWED BY JUAN

**Exam operation, remaining:** AI use and internet use during the exam — stated
policy, since neither is prevented. And the missing middle of the fraud process:
analysis flags a pattern → *what?* → revocation. Whether the candidate is told,
whether they can respond before a decision, who decides.

**Level II attestation wording.** "HR proctored" is an attestation by an
interested party, not proctoring. Word it as *"attested as supervised by
[organisation]"* — before certificates exist in the wild.

**Counsel:** the two draft clauses (Terms §5 refunds, §12 courts) and the
English-only legal position against Colombia's Estatuto del Consumidor and
Brazil's CDC. One conversation.

**Design team:** wordmark PNG, corrected badge codes.

**Trademark:** ™ not ®, once per page at first prominent use, and mark the codes
not the Scrum-derived names. Full guidance in `LAUNCH-READINESS.md`.

---

## 6. CONSOLE SURFACES ADDED THIS STRETCH

| Route | Who | What |
|---|---|---|
| `/console/exams` | platform_admin | Live examinations, pace and integrity signals |
| `/console/engine` | admin + marketing | Internal briefing: how the exam works, what not to claim |

Both English-only by console convention. Nav entries live in
`app/[locale]/console/layout.tsx`, role-branched — `/console/engine` appears in
both arrays because marketing needs it more than admin does.
