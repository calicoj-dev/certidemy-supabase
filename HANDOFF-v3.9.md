# HANDOFF v3.9

Supersedes v3.8. Migration tip **164**, next free **165**. Both repos clean and
pushed.

Two large pieces since v3.8: the claims and legal work that closed the sales
team's items 1, 2 and 9, and an examination-integrity defect found by reading
the scorer — which turned into the deepest change in the codebase this month.

---

## 1. THE EXAM INTEGRITY CHAIN

Read this section before touching anything under `functions/*exam*`.

### 1.1 The defect

`score-mock-exam` graded whatever `answers` array the browser posted, and the
server kept no record of which items it had served. Therefore:

**Score inflation.** `total` was `body.answers.length` and `score_pct` was
`correct / total`. A submission containing one known item scored 1/1 = 100%,
cleared the pass mark, and minted a credential whose attempt row recorded
`total_questions = 1`.

**Pool substitution.** Nothing verified the submitted `question_id`s belonged to
the secure pool, to that certification, or to that session. Practice-pool ids
were accepted — and the simulator openly shows correct answers.

**Session replay.** Ids from an earlier session were equally acceptable.

**Client-asserted language.** `quiz_sessions` has no language column, so the
form's language came from the request body and flowed into per-item telemetry
*and* the credential's locale.

All of it was reachable by editing a network request in a browser console during
a live exam. The resulting credential verified as genuine on the public page.

### 1.2 What now happens

**Migration 163 — `exam_session_items`.** One row per served item, per session,
in presented order, with the form's language. Written by `generate-mock-exam`
inside the request that assembles the form. If the insert fails, the exam is not
issued — a form that cannot be recorded cannot be scored honestly.

**`score-mock-exam` grades that list.** Every served item is graded; an item the
candidate never answered scores incorrect because it was on their form. `total`
is the form size the server assembled. Items submitted but never served are
ignored and recorded in `integrity_flags`, not rejected — rejecting would turn a
client bug into a lost voucher. Language comes from the served rows.

**Migration 164 — answers on `exam_session_items`.** `user_answer`,
`time_taken_seconds`, `marked_for_review`, `answered_at`. The form record became
live working state.

**`save-exam-answer`** persists on answer change, debounced ~1.5s client-side.
UPDATE only, never UPSERT — an upsert would let a client add items to its own
form, which is the 163 defect rebuilt one layer down. Guards: session ownership,
session not completed, item was actually served, clock not expired. Returns
`seconds_remaining` so the client's countdown is corrected by the server on every
save (browsers throttle timers in background tabs; a client clock drifts slow).

**`score-mock-exam` merges saved answers with the submission**, client winning
per item. That is deliberate: a candidate may change an answer up to submit, and
a failed save must not cost them the change. Tampering was closed by grading the
*form*; within the form, "the client chose differently" is just answering. The
saved copy is crash recovery, not a tamper check. Consequence: **an empty
submission is a valid finalise.**

**`get-active-exam-session`** resumes a recorded form (re-served in
`presented_order`, with saved answers, never leaking `correct_answer`,
`difficulty` or `task_id`) or finalises an expired one by calling
`score-mock-exam` with empty answers. Lazy, not scheduled — runs on the
candidate's next authenticated request. It forwards the caller's Authorization
header, so finalisation runs as the candidate and the ownership check still
applies; no service-role backdoor into scoring.

### 1.3 The check order in get-active-exam-session is load-bearing

**The form is read BEFORE expiry is considered.** The first cut did the opposite
and would have done real damage: every pre-163 session has no recorded form, so
expiry-first would have routed all of them into scoring, and each would have
written an `exam_attempts` row recording **0% on 0 questions** — a fabricated
failed attempt in a permanent record, polluting readiness views and exposure
statistics.

Rule: **no recorded form, no scoring.** Those sessions return
`unscoreable: true` and wait for an administrator. A session *with* a form and
zero saved answers IS scored — the candidate was served the form and answered
nothing, and 0 of 40 is the truth.

### 1.4 Abandoned sessions are ordinary, not exceptional

`quiz_sessions` held **22 open sessions going back to May**, three of them
`certification_exam`. Twenty-two abandonments across two months of internal
testing means closing a tab mid-exam is normal behaviour; in production it is a
steady stream of stuck entitlements.

Those three certification exams shared one test voucher (999 attempts allowed, 6
used, assigned to jroman.mobile@gmail.com), so **no real entitlement is stuck**.
Everything before today is unscoreable by the 1.3 rule and needs a deliberate
admin decision — closing them with `completed_at` set and `score_pct` null would
close them without inventing a result.

### 1.5 Verified end to end

- Fresh session recorded 40 items, orders 0–39, one language.
- A run answering 4 of 40 scored **5%** — 2/40. Under the old behaviour the same
  run would have scored 2/8 = 25%. That gap is the defect, measured.
- `served = graded = 40`; 36 rows stored `[]` for skipped items, which previously
  produced no row at all.
- Answers appeared in `exam_session_items` during the exam with real
  `time_taken_seconds` and `answered_at`. Two items sharing a millisecond
  timestamp confirmed debounced batching.
- Item timings ranged 1s to 84s on one form — the timing spread that person-fit
  and pre-knowledge analysis reads.

### 1.6 What is NOT done

- `getActiveExamSession` is not on the Engine client.
- No dashboard resume banner; nothing calls `get-active-exam-session` yet.
- The runner does not hydrate saved answers on mount.
- No realtime monitoring dashboard (requested: superadmin, per cert, live).
- No visibility/focus telemetry. `exam-leave-guard` still only handles
  `beforeunload` and link clicks; no `visibilitychange` *logging* (the runner
  uses that event to flush, but does not record it).
- No answer-change history — a candidate who changes an answer six times is
  indistinguishable from one who answered once.

### 1.7 Anti-cheating: what is worth building and what is theatre

**Screenshots cannot be blocked on the web.** No browser API exists; the OS owns
the screen. A phone camera defeats it regardless. Anyone selling screenshot
protection for a webpage is selling nothing.

**Copy-blocking is weak and costs accessibility.** `onCopy`, right-click disable
and `user-select: none` are bypassed by devtools, view-source, print-to-PDF or
OCR in seconds — and they break screen readers, against a stated *Adaptaciones*
commitment.

**The realistic attack is a second device.** A phone with the lesson open. Every
browser-side control addresses the least likely method while the most likely one
is invisible.

**So: log everything, block almost nothing.** Detection feeds the psychometric
infrastructure; prevention feeds nothing. Worth capturing: per-question timing
(exists), focus/visibility events, answer-change history, copy *attempts* logged
not blocked (forty copied stems is item-bank harvesting — a worse threat and a
different response), person-fit statistics, cross-candidate response-vector
similarity. The one control with proven deterrent value is **telling candidates
their timing and focus are recorded.**

### 1.8 Two consequences to handle before telemetry ships

**It is personal data.** Behavioural telemetry during an exam needs disclosing in
the privacy policy — what is collected, why, retention. The policy is one day old;
cheaper to amend once.

**GDPR Article 22.** If statistical analysis leads to revocation, that is
automated decision-making with legal effect: human involvement and a right to
contest are required. Both exist in practice (management decides, appeals to
info@certidemy.com) but the policy must *say* so, and the handbook must describe
the sequence: flagged → candidate notified → opportunity to respond → human
decision → appeal.

---

## 2. CLAIMS AND LEGAL

### 2.1 Claims policy — item 9 CLOSED

`CLAIMS-POLICY.md` — claim classes (A permitted, B evidence-required, C forbidden
until earned, D never), approved texts in three languages, forbidden
formulations, review procedure.

**Violations found and fixed, all three languages:**

- About page asserted competitors' blueprints sit behind paywalls. **Largely
  false** — ITIL, PMI, ISTQB and the Scrum Guide all publish syllabi free.
- `home.subhead` and `auth.showcase.headline` said "globally-recognized
  certifications" — Class C.
- `home.heroSubhead`: "Most certifications still pretend AI doesn't exist."
- "Built on the work nobody else does" → "Built on work you can inspect."
- "An AI tutor that can't hallucinate" → "An AI tutor that cites its sources."
  Grounding reduces hallucination; it does not make it impossible.
- 37 superseded `home` keys pruned, including the PSM I / SMPC scoring-weight
  comparison — the last unsourced competitor claim in the repo.

**The framing that matters:** the differentiator is not "we use Bloom" — everyone
does, or says they do. It is that the profile is *computed* from the analysis and
verified against it, plus the claim almost nobody states publicly: **an exam that
under-tests is as invalid as one that over-tests.**

### 2.2 Legal — items 1 and 2 substantially done

Entity **RC Capital Partners LLC**, New Jersey, 210 Westervelt Ave, North
Plainfield NJ 07060. Certidemy and CertiGlobal are both brands of that company —
which removed the need for a controller/processor split. Contact
**info@certidemy.com** (a Gmail alias of info@certiglobal.org; same mailbox).
Processors: Shopify with Stripe for cards, Google for email.

**Cookies need no consent banner** — a codebase sweep found no analytics,
advertising or non-essential cookies of any kind. The clause states that as fact.

**Article 27 GDPR representative note removed** — it applies where a company
offers services to EEA/UK data subjects, and accessibility is not targeting.

**Two clauses are DRAFTS, flagged in a comment inside `content.ts`:** §5 refunds
(14 days while the voucher is unredeemed) and §12 courts (New Jersey, with a
mandatory-consumer-protection carve-out). Conventional; neither read by counsel.

**Language position: English only with a request mechanism.** Defensible, and it
keeps one authoritative text. **Ask counsel:** Colombia's Estatuto del Consumidor
and Brazil's CDC both require consumer information in the local language, and the
Company now contracts directly with consumers in both.
`scripts/gen-legal-translations.mjs` exists, unused, if the position changes.

### 2.3 CertiGlobal is a marketplace, not a parent

CertiGlobal sells vouchers for multiple certification bodies including
independent ones such as CertiProf. **"A CertiGlobal Partner" in the footer is
accurate.** I initially read "brands of one company" as implying a misrepresented
relationship; that was wrong.

Worth having ready for a call: a reader sees "brands of the same company" in the
privacy policy and "A CertiGlobal Partner" in the footer. Both true — corporate
ownership versus marketplace participation — but the pairing invites an
issuer-independence question, which the AIHR-I curriculum itself teaches buyers
to ask. The answer is that the examination does not discriminate: fixed 80% pass
mark, published blueprint, items drawn mechanically. No lever for an incentive to
act on.

One stale comment: `certiglobal-badge.tsx` line 6 says the mark "signals the
parent brand." CertiGlobal is a sibling brand; RC Capital Partners LLC is the
parent. The badge renders correctly; only the comment misleads.

### 2.4 `/pricing` is parked, deliberately

The route exists for possible future use; for the foreseeable future pricing is
CertiGlobal's. Consistent already — `nav.pricing` was in the dead-key set, so
nothing links to it.

---

## 3. THE RULE THIS SESSION EARNED

**A verification that fails silently is worse than none, because it converts
"I don't know" into "I checked."** Four instances, three of them today:

1. **`Get-Content` reads as ANSI** (v3.8 §2) — four sessions of phantom mojibake.
2. **The claims sweep** searched `globally recognized` with a space against copy
   that reads `globally-recognized`, and `reconocimiento global` against copy that
   says `reconocidas mundialmente`. Reported clean twice while a Class C claim
   sat on the home page and both auth pages.
3. **The dead-key scan** used `return void 0` inside a `for` loop, which exits the
   whole loop rather than skipping one entry. `node_modules` sorts early, so the
   walk abandoned the tree and reported **674 of 674 keys dead** — including keys
   we had just watched render.
4. **A patch idempotence guard** tested for the single short token `answerFor`.
   It should have tested `answers_from_server += 1`.

**Practice:** every guard tests something specific enough that a coincidental
match is implausible. Every scan prints what it scanned (file count, byte count)
so a broken walk is visible. Never report "clean" — report what was checked and
what was found.

---

## 4. NEXT SESSION

**Finish the exam chain (client side).** In order:
1. `getActiveExamSession` on the Engine client.
2. Dashboard resume banner — active exam, time remaining, re-enter. This is also
   what triggers lazy finalisation, so tonight's two recorded sessions close.
3. Runner hydration — load `saved_answers` on mount so a returning candidate sees
   their own work.
4. Close the 20 pre-163 sessions with an admin decision (see 1.4).

**Then the realtime monitoring dashboard** (requested). Superadmin, per cert,
live exams with per-item timing and integrity flags. **Poll a service-role edge
function every 3–5s rather than using Supabase Realtime** — Realtime respects
RLS, and `exam_session_items` has RLS on with no policies deliberately; a browser
subscription would need a policy that weakens it. Indistinguishable for a
monitoring view, considerably more defensible.

**Then telemetry** — visibility events, answer-change history — after §1.8's
privacy-policy and Article 22 amendments.

**Still open from v3.8:** English K/S/A editing pass (~900 fields; blocks the
K/S/A translation); native read of the 66 provisional domain translations;
SM-AI-I task 4.12 missing from D4; *fuentes principales* has no column;
`listCatalogGroups` never asks `cert_categories_i18n` for a label so program
headings render English on the public Spanish and Portuguese catalog;
`COGNITIVE-MODEL.md` §4 holds a hand-typed profile table that no longer matches
the database.

---

## 5. OWED BY JUAN, NOT BY CODE

**Exam operation (item 6) — mostly answered this session:** no proctoring on
Level I; appeals to info@certidemy.com with proof; issuance automatic on
criteria; revocation by Certidemy management on partner request or suspicion of
fraud; incident review via dispute tickets; disconnect handled by a pre-exam
connection warning; fraud detection by psychometric analysis.

**Still needed:** AI use and internet use during the exam — stated policy, since
neither is prevented. And the missing middle of the fraud process: analysis flags
a pattern → *what?* → revocation. Whether the candidate is told, whether they can
respond before a decision, who decides. Without it, revocation on statistical
suspicion with no stated process is what an appeal attacks.

**Level II attestation wording.** "HR proctored" on a certificate is an
attestation by an interested party, not proctoring. Word it as *"attested as
supervised by [organisation]"* — get this right before certificates are in the
wild.

**Counsel:** the two draft clauses and the English-only position. One
conversation.

**Design team:** wordmark PNG, corrected badge codes.

**Trademark:** ™ not ® (® is for USPTO-registered marks and misuse is unlawful),
once per page at first prominent use, and **mark the codes not the Scrum-derived
names** — `AIGRM-I™` is coined and safe; "Scrum Master I — AI" is built on an
industry term others have interests in. Full guidance in `LAUNCH-READINESS.md`.
