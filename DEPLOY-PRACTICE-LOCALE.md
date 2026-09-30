# Deploy: the practice-locale fix, and the enemy rule with it

**Ruled PROMPT-96 s1 and s5. Juan deploys. Nothing here is pushed or deployed by the session that wrote it.**

Four artefacts move, in three repositories' worth of surface: two edge functions, one web build, and three
message catalogues that travel with the web build.

| # | what | where | why it is in this order |
|---|---|---|---|
| 1 | `get-review-batch` | edge function | closes a live learner-facing leak. Independent of the web build |
| 2 | `submit-quiz-answer` | edge function | new OPTIONAL `language` field. Absent field = today's behaviour |
| 3 | `generate-mock-exam` | edge function | the enemy rule. Inert today, and must be live BEFORE approval |
| 4 | `certidemy-web` | `git push origin main` | sends `language` on submit, and localises 21 player strings |

---

## Why this order, and what each ordering costs

**THE FUNCTIONS FIRST, THE WEB LAST, AND EVERY GAP IS SAFE.** Each function change is backward compatible
with the CURRENT web build, and the web change is forward compatible with the CURRENT functions. So there is
no window in which either half is broken by the other — stated per pair rather than asserted in general,
because "backward compatible" is the claim people make just before an outage.

| gap | what a learner sees |
|---|---|
| `get-review-batch` deployed, web not | reviews come back correctly localised and correctly filtered. The old web build reads `reviews[]` exactly as before; the two new fields (`skipped_reviews`, `served_from_question_id`) are additive and it ignores them |
| `submit-quiz-answer` deployed, web not | the old build sends no `language`, so the explanation comes back in the question's own language — exactly today's behaviour. The field is optional for this reason |
| `generate-mock-exam` deployed, web not | nothing. No grounded item is `approved`, so the enemy rule has nothing to act on, and the web build does not know it exists |
| web deployed, functions not | **THE ONE TO AVOID, and it is degraded rather than broken.** The web build sends `language` to a `submit-quiz-answer` that ignores unknown body fields, so the explanation stays in the question's language — today's behaviour again. But the 21 newly-localised player strings would sit over a review slate that is still unfiltered and still in the wrong language, which reads as a *worse* bug than before: a fully Spanish page serving an English question |

**So: functions first.** If only one thing can go out today, it is `get-review-batch` — that is the live
leak, and it needs nothing else.

---

## 1. `get-review-batch` — the leak, and the numbers it closes

Measured before the change by `scripts/measure-review-branch-exposure.mjs`, over 435 live cards:

```
cards pointing at a RETIRED item        196   (149 due now)   45% of every card in the system
cards pointing at a NOT-APPROVED item    27   (26 due now)
cards pointing at a secure/non-practice   0
language of the row each card points at   es-419 291, en 144
```

The due-reviews branch filtered `user_id`, `certification_id` and `due <= now` and **nothing else**, while
the new-items branch beside it filtered pool, language, status and `retired_at`. The file's own header
claimed both did. Migration 345 retired 158 pre-consolidation items; this path kept serving them, so that
retirement was half-effective in exactly the half a learner meets.

**Has a secure item ever been served through this branch? UNANSWERABLE from what is recorded, and that is
the honest answer** — not "no". Zero cards point at a secure row today. Nothing records the pool a question
had at the time its card was written, so a card written while an item was practice and read after it became
secure is indistinguishable from one that was always practice. What constrains it is the WRITER:
`submit-quiz-answer` refuses `pool='secure'` before creating a card. That is the weaker kind of guarantee —
the reader has never had the filter.

### What changed

- the three filters the other branch has had since 2026-09-18: `status = approved`, `pool = practice`,
  `retired_at is null`, applied on the embedded row with `!inner`;
- **an assertion that the embedded filter held.** A PostgREST filter on an embedded table returns the parent
  with a NULL embed rather than dropping it when `!inner` is missing. If any returned row is not servable the
  function refuses the slate with a 500 rather than serving it;
- **the dropped read error**. `const { data: due_cards }` discarded its error, so a failed read returned an
  empty slate — indistinguishable from a learner with nothing due;
- **language resolved through the sibling, never filtered away.** The card's own question id goes back to the
  client; the display text comes from the `question_group_id` sibling in the requested language;
- **no servable sibling ⇒ skip and log**, reported as `skipped_reviews` in the payload. Never English on a
  Spanish page;
- **the badge count**, which had NO filters at all — not even the certification. It now carries the same four
  as the queue, so the number and the slate answer the same question. A badge saying "175 due" over a queue
  that serves none of them is worse than no badge.

### Why the card's id and not the sibling's

`submit-quiz-answer` grades by reading `correct_answer` for the id it is handed, and updates `fsrs_cards` on
`(user_id, question_id)`. Returning the sibling's id would create a SECOND card and reset the learner's
interval. Returning the card's id with the sibling's text keeps scheduling attached, and grading is
unaffected because siblings share option ids and `correct_answer` — measured, 9,224 of 9,224 translated
option sets pair by id rather than by position.

---

## 2. `submit-quiz-answer` — the same page, one step later

The review is now in Spanish and the client submits the card's ENGLISH question id, so this function read
that row and returned its ENGLISH explanation. The learner answered a Spanish question and was shown an
English explanation on the same page.

It takes an optional `language` and resolves the explanation through the sibling. **Grading is untouched:**
`correct_answer` still comes from the row the id names, the FSRS card is still keyed on it, and the sibling's
key is never read.

**AND THE FALLBACK RULE IS THE OPPOSITE OF `get-review-batch`'S, DELIBERATELY.** There, no sibling means the
review is skipped — the learner has not been shown anything yet, so showing nothing costs them nothing. Here
the answer is already submitted and graded, and withholding the explanation would take away the one thing
they are owed for having answered. Wrong-language text beats no text **only after** the answer. The response
carries `explanation_language` so the caller can say which it got.

---

## 3. `generate-mock-exam` — the enemy rule, deployed before approval and not after

Ruled PROMPT-96 s5. It is inert today: `generate-mock-exam` filters `status = 'approved'` exactly and every
grounded item is `pending_review`, so the rule has nothing to act on. It must be live **before** the first
grounded item is approved, which is why it travels with this deploy rather than with that one.

**Pre-deploy checks, all green:**

```
deno check generate-mock-exam           clean
deno check get-active-exam-session      clean   (imports the same option-order module)
scripts/test-enemy-rule.mjs             all checks pass
```

Two of those checks exist because this ruling asked for them:

- **a 40-item form with NO grounded rows loses nothing.** Eleven of twelve certifications have zero grounded
  items, so their whole pool arrives with `enemy_key: null`. A rule that refused a null key would shorten
  every one of their exams into an integrity-gate refusal — eleven products broken to protect one. Asserted
  over a whole 40-item form rather than a pair, because the defect would be cumulative and two items cannot
  show it. The enemy set stays empty, so nothing is even recorded.
- **a read error on `item_grounding` fails loudly.** Asserted against the function's source: the `gErr`
  branch must `throw new HttpError(500, ...)` and must not log-and-continue or default to an empty map. The
  assertion is also fed a swallowing version of the same block and must reject it, so it cannot be a regex
  that matched something and proved nothing.

  **Why that failure mode specifically:** a swallowed read error produces an EMPTY enemy map, which is
  indistinguishable from a pool with no grounded items — and a pool with no grounded items is the normal case
  for eleven of twelve certifications. The degraded state would look exactly like the healthy one everywhere
  anybody would notice.

  It also **cannot happen on a pool with no grounded rows**: with an empty candidate list the chunk loop
  never executes and no query is made, so there is no read to fail.

A source assertion is weaker than a behavioural one and says so: it proves the code as written throws, not
that the deployed bundle does. `deno check` and the post-deploy smoke cover the second.

---

## The commands

PowerShell, **from the PARENT directory** (`C:\Users\Juan\Documents\certidemy`), because the CLI expects to
find `supabase\` beneath the working directory.

```powershell
cd C:\Users\Juan\Documents\certidemy

# --dns-resolver https, not the Node flag. `supabase functions deploy` has failed twice with
# "lookup api.supabase.com: no such host" while nslookup answered normally; this resolved it both times.
supabase functions deploy get-review-batch --dns-resolver https
supabase functions deploy submit-quiz-answer --dns-resolver https
supabase functions deploy generate-mock-exam --dns-resolver https
```

**`verify_jwt` is pinned in `config.toml` for all three and none of them is public**, so there is no
`--no-verify-jwt` flag to lose here. Checked rather than assumed: the recurring defect is a plain redeploy
dropping that flag on a PUBLIC function, and these three all require a JWT.

**The bundle includes the shared modules by import**, so no separate step:

```
functions/_shared/item-rules/language-sibling.mjs   get-review-batch, submit-quiz-answer
functions/_shared/item-rules/enemy-rule.mjs         generate-mock-exam
functions/_shared/item-rules/option-order.mjs       generate-mock-exam, get-active-exam-session
```

Then the web build:

```powershell
cd C:\Users\Juan\Documents\certidemy\certidemy-web
git push origin main
```

**`npm run cf:deploy` DOES NOT DEPLOY certidemy.com.** It pushes to a `workers.dev` subdomain. Production is
built by Workers CI from `origin/main`. The header that says which commit is serving is
`x-certidemy-build-src` / `x-certidemy-build`, and it is only present at `https://certidemy.com/en` — the
bare domain 308s with no header at all.

---

## Verification, after each step

### After `get-review-batch`

```powershell
# 1. the shape, as a learner. A real JWT is needed; take one from a browser session.
#    The two new fields must be present and the reviews must all be in the requested language.
#    `skipped_reviews` is a NUMBER, and 0 is a fine answer -- but the field must EXIST, because its
#    absence means the old bundle is still serving.
```

Then, read-only from this repo:

```powershell
cd C:\Users\Juan\Documents\certidemy\supabase
node --dns-result-order=ipv4first scripts/test-review-language-sibling.mjs
```

That is the rule, not the wiring. What it shows on the live card set:

```
cards                      435
after status/pool/retired  239      196 refused -- the exposure closing
en       served 234   own language  34   via sibling 200   SKIPPED  5
es-419   served 234   own language 205   via sibling  29   SKIPPED  5
pt-BR    served 229   own language   0   via sibling 229   SKIPPED 10
ZERO cards resolve to a row in another language, in any locale
```

**The 5 and 10 skips are the edge case the ruling anticipated**, and they are small for a measurable reason:
177 cards point at a question with NO `question_group_id` at all — the known ungrouped-items defect on AIE-I
and SM-AI-I — and **every one of those is already retired**, so the status filter removes them before the
sibling resolution is ever asked. The two halves of the fix interact; the filter is what makes the resolution
tractable.

### After `submit-quiz-answer`

Answer one question in a Spanish practice session and confirm `explanation_language` comes back as `es-419`.
If it comes back `en` with a Spanish question on screen, the sibling has no explanation — the log line says
so by question id.

### After `generate-mock-exam`

```powershell
cd C:\Users\Juan\Documents\certidemy\supabase
node --dns-result-order=ipv4first scripts/check-enemy-feasibility.mjs
```

Start a SIMULATOR for a certification with no grounded items — AIGRM-I or ISMS-F — and confirm it still
assembles a full form. **That is the check that matters**, because it is the one thing this change could
break for eleven products that gain nothing from it.

### After the web build

```powershell
curl.exe -sI https://certidemy.com/en | Select-String -Pattern "x-certidemy-build"
```

Then `https://certidemy.com/es-419/learn/aie-i/quiz/play?mode=practice` — the bug this started from. Expect
every label in Spanish and every question in Spanish. The exact strings to look for, read out of
`messages/es-419.json` rather than typed from memory:

```
PREGUNTA {n}        DIFICULTAD {n}        Comprobar respuesta        Volver al menú
```

```powershell
cd C:\Users\Juan\Documents\certidemy\certidemy-web
node --dns-result-order=ipv4first scripts/audit-quiz-player-i18n.mjs   # target: 0
```

---

## Rollback

Each function is independent and rolls back on its own.

```powershell
cd C:\Users\Juan\Documents\certidemy
git -C supabase log --oneline -- supabase/functions/get-review-batch   # find the previous commit
# then check that path out at the previous commit and redeploy that one function
```

**Rolling back `get-review-batch` restores the leak**, so it is the one to think twice about: the state it
returns to is 149 retired and 26 unapproved cards reachable by learners today. If the new version
misbehaves, the safer intermediate is to keep the three filters and drop only the sibling resolution — they
are independent, and the filters are the half that closes the leak.

Rolling back `generate-mock-exam` costs nothing today, because the enemy rule is inert until the first
grounded item is approved.

---

## What is NOT in this deploy

- **`quiz-mode-picker.tsx` still uses a local `STR` table**, a third translation convention on the same
  screen. The audit reports it; it is not a defect a learner meets, and converging it was not ruled.
- **The 41 letter-referencing explanations in the live bank.** Queued, per PROMPT-96 s3: practice does not
  shuffle option order, so their letters are still correct today.
- **The `item_origin='generated'` rows stay `pending_review`.** Nothing in this deploy approves anything; see
  `AIMSF-PATH-TO-LIVE.md`.
