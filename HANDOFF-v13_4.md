# HANDOFF v13.4 — four rules failed to prevent their own recurrence

2026-09-18. The day did not go where any of it was planned, and the list of
defects is not the finding. This is.

---

## 1. The through-line

Four rules already written in this repository were broken today, each by the
author who had read or written them, and each was closed by **something that
runs** rather than by restating the rule.

| the rule, already written | how it failed today | what closed it |
|---|---|---|
| *verify against `pg_catalog`, not against this line* | 339 and 340 reported unrun while both had run — eighth instance that day; the migration tip had been wrong eight times | **`scripts/check-migration-state.mjs`** — a probe that asks the database |
| *run the check as the party the property is about* | 339's post-conditions passed **as a superuser** and took `explain_task` down in es-419 and pt-BR for ~2 hours | **RAN vs EFFECTIVE** in the probe, plus role-scoped post-conditions that `set local role` |
| *derive, never duplicate, when two lists mean one thing* | three copies of the item rules; the deployed generator read **none** of them | **`scripts/check-prompt-parity.mjs`** — two implementations, same inputs, same bytes |
| *post-conditions name a property, not a count* | 344 recorded the fourth population error; **345 committed the fifth in the next file** | **before/after derivation**, and the population named in the key |

**A rule is a description of a save. It is not the mechanism of one.** That is
the sharpest thing learned today, and it came from asking why 329 and 330 were
caught and 339 was not:

- **329 broke a NEW path.** Nothing worked until someone tried it, and the first
  person to try it was the author, minutes later. Trying a new feature *is*
  running the check as the caller. It happens for free.
- **339 broke an EXISTING path.** `explain_task` had served Spanish for weeks.
  Nobody called it **because it already worked.**

So the variable is maturity, not diligence. The rule described what had already
saved us and conferred none of that protection. Every one of the four above was
closed by an instrument, and three of them were **watched to fail first**.

### The corollary, which cost us twice

**A mechanism that contains a literal is halfway back to being a note.**

- 340's fingerprint asserted `n === 35` on `lesson_translation_reviews`. Six
  reviews landed the same evening and **340 reported NOT RUN — a migration that
  had run, failing its own probe.** Now `>=`; a migration that APPENDS is proved
  by "its rows are there", never by "the table has not grown".
- 345 asserted `secure pool ... expected 12637`. That is the **total** secure row
  count, read off a query with no `retired_at` predicate and asserted of LIVE
  rows. 126 secure items have been retired since 2026-08-10 — a deliberate
  trilingual two-option pass, 42 groups x 3 languages — so live is 12511 and the
  database was right. **Nothing was written: the assertion worked.** Every count
  in 345 is now captured before and compared after.

### And the mechanism that was already there proved the point

Retiring 158 items cleared two standing `verify-cert` failures and immediately
**created a third**: `SM-AI-I §8 scheme claim: document says 525, 535, 520,
database says 520, 520, 520`. The scheme document counts practice items, so
retiring items falsified a published claim — and `verify-cert` caught it within
minutes, because it derives from the database and compares. That is exactly the
shape of the four mechanisms above, already in the repo, doing its job on the
consequence of our own change.

**Fix by editing `SCHEME-SM-AI-I.md` to 520/520/520**, which is also now uniform.
Do not change the data to match the document.

---

## 2. What ran, measured

```
342  RAN + EFFECTIVE   module titles translated; ISMS-F es-419 49 rows, 0 fallbacks
343  RAN + EFFECTIVE   certification accepts language; es/pt differ from en
344  RAN               3 item_model(s) measured, no provisional marker, no false claim
345  RAN               160 generated practice items, 0 live, 2,249 attempts preserved
```

- **`check-prompt-parity` 24 pass, 0 fail, 0 skip.** Started at 1 pass / 6 fail.
- **`smoke-courseware` 31 pass, 0 fail.** Was red on two stale expectations since 334.
- **ISMS-F is 49/49 in three languages.**
- **`verify-cert`**: AIE-I 54/1/3, SM-AI-I 58/1/5, ISMS-F 56/0/2. Both remaining
  failures are scheme-document claims, not data.

**Item rules now live in `functions/_shared/item-rules/`** — five modules, four
moved wholesale. `scripts/lib/item-cue-guard.mjs` is the env override and nothing
else; **if it ever contains a number it has become the thing it replaced.**

**`get-review-batch` now filters `status` and `retired_at`.** It filtered neither,
so 132 already-withdrawn items were reachable there as "new" — and without it 345
would have been cosmetic for the path a learner meets first.

---

## 3. The 158, and why they mattered

`generate-practice-questions` was created **2026-05-20, in this repo's initial
commit** — five to seven weeks before `item-pipeline.mjs` (06-26) and
`item-profile.mjs` / `item-grounding.mjs` (07-11) existed. **It never diverged
from the shared rules; it predated them.**

It is also the unexplained AIE-I ungrouped-items writer. Exact reconciliation:
90 + 30 AIE-I, 15 + 5 SM-AI-I = **140 = AIE-I's 120 + SM-AI-I's 20.**

Graded against the authored pool with the same code:

| live practice | n | validator | cue-guard FAIL | `true_false` |
|---|---|---|---|---|
| generated | 158 | 67.7% | **53.8%** | **25.9%** |
| authored | 15,190 | 83.1% | 9.5% | **0.0%** |

**And they were not one learner's private history**, which was checked rather
than assumed because it would have made them harmless: `quiz_questions` has no
`created_by` and no `user_id`, so nothing *can* filter by creator. 40 of the 149
ever served reached a learner other than the first to see them, and **49 appeared
in 16 simulated certification exams for 6 learners.**

---

## 4. Decided, not built: item generation over MCP

**Rubric, not generation.** `draftSystem` is one stage of five; generating for a
partner means owning the repair loop, the model cost, and items landing in *our*
bank — which forces §5.5 and a post-back contract first. Rubric-only touches
none of it.

**Decisions taken 2026-09-18:**

1. **Separate `courseware:rubric` key**, not folded into `courseware:lessons`.
2. **Publish the never-say list** — 12,270 of SCRUM_L2's 18,583 characters. It is
   the expertise, not a secret; a partner's model without it writes the myths.
3. **No post-back in v1**, and the description says items land in the partner's
   system **as the design, not a limitation.**
4. **Rewrite the three migration references in the source**, not at serve time.

**The shape, ~8 hours:** one resource on `courseware-read` — and it reads the task
from **`mcp.task`**, not `public.tasks`, so 338's KSA withholding and the
`allowed` gate extend to the new surface for free. `log` is the precedent for a
resource the handler answers before `buildQuery`. One tool on `/mcp` over it.
**Insist on a rubric-parity assertion**: what a partner receives must be
byte-identical to what the generator uses, or the tool becomes a fourth copy —
and this time the copy is the one partners quote back.

**What withholds, measured across all ten certifications:** only three internal
migration references in `SCRUM_GUIDE_FACTS` (lines 173, 201, 243), used as
provenance for list corrections. Nothing else — no vendor names, no secure-bank
internals, no answer keys, no file paths.

**Two counts of mine were wrong and are corrected here.** "219 quoted clause
runs" was a pattern artifact: `"[^"]{60,}"` paired unrelated quote marks and
captured the prose between them. Bounded properly, **the longest single quotation
anywhere is 55 characters** and quoted text is 0.6-3.3% of any block, mostly
quoting a standard to say what it does *not* say — comfortably inside
IP-POSITION §6. And "158 of 158 fail the validator" was a query that never
selected `question_text`, which the validator checks first; the real figures are
in §3, and **the authored control is what exposed it.**

---

## 5. Open

1. **`SCHEME-SM-AI-I.md` practice counts: 525/535/520 -> 520/520/520.** Caused by
   345. One edit.
2. **The three migration references** in `SCRUM_GUIDE_FACTS`.
3. **§5.5.** Four options scoped. **A (draft-by-default) is nearly free now**,
   because today's `get-review-batch` fix already excludes non-approved items and
   the creating learner still sees their own five via `.in('id', ids)`. But **A
   without B (a review surface) is a drafts pile with no drain** — the state
   `ksa_is_provisional` reached at 256 rows. **C (take weak-concepts off the mode
   picker) is a one-line revert** if it is ever needed in a hurry.
4. **The `en_hash` gap.** Both review tables hash the ENGLISH, so an English edit
   re-closes the gate and a **translation** edit does not. 139 approvals are in
   that state, and they are exactly the rows the gate lets through. **The 252
   `cláusula` references are load-bearing on this**: that sweep would invalidate
   ISMS-F's newly cleared rows and leave all six marked `approved`.
5. **Concepts have no translation table** under either convention. 1,730 concepts,
   ~497k characters both languages, **16x the ISMS-F KSA pass.** A project, and
   the review model decides first.
6. **123 paragraphs** across 68 rows in `BILINGUAL-QUEUE-2.json` (58 worked);
   3 refusals; ~20 held paragraphs.
7. **Two guard gaps recorded and not patched**: compound `poder`, and English
   `required` strong while `necesario` is narrowed.
8. **Fingerprints for 330, 331, 333, 334** — they report "no probe", which is
   honest and is not the same as verified.
9. **`get_lesson` has never been observed end-to-end.** It needs `CERTIDEMY_KEY`.
   The gate's inputs are verified; that is not the same as seeing the body.

---

## 6. What to distrust

§2 is measured. §3 and §4 carry numbers taken while working.

**The specific thing to distrust is a number in prose, including in this file.**
Today produced a stale count in a migration assertion, a stale count in a
fingerprint, a stale count in a scheme document, and two counts of mine that
measured the wrong population. Every one was caught by something that derives
and compares; **none was caught by re-reading.**

```
node --dns-result-order=ipv4first scripts/check-migration-state.mjs
node --dns-result-order=ipv4first scripts/check-prompt-parity.mjs --runtime
node --dns-result-order=ipv4first scripts/smoke-courseware.mjs
node --dns-result-order=ipv4first scripts/verify-cert.mjs --all
node --dns-result-order=ipv4first scripts/verify-profile.mjs
node --dns-result-order=ipv4first scripts/verify-grounding.mjs
```

Two operational notes that cost time today: the Supabase CLI needs
**`--dns-resolver https`** (the Node `--dns-result-order` flag does nothing for
it), and `scripts/lib/fn-auth.mjs` was the one credentialled path with **no retry
loop** — now fixed, opt-in on `callFunction` because its callers are mints and a
blind retry could mint twice.
