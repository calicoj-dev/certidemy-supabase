# HANDOFF v7.1 — AIMS-IA reaches one failure, and an invariant finds three defects nobody was looking for

**Session date:** 2026-08-13
**Supersedes:** HANDOFF-v7.0

**Migration tip 214, next free 215.**
**supabase `0e66c72`. certidemy-web `8d83b1f`.**

**AIMS-IA is at 37 pass / 1 fail. Every other certification is at 0 fail.**

The session began as "finish AIMS-IA Stage 9" and ended having corrected a live
certification's exam duration, retired five items that two separate checks could not
see, and shipped two badges that had never been embedded in the module the renderer
reads. **None of those three was on any list.** All three were found by writing down a
rule and then enforcing it — which is the through-line and the reason for §6.

---

## 1. AIMS-IA Stage 9 — the overnight run

The generator ran from 00:51 to 10:34, then two top-up passes.

| Pool | Target | Result |
|---|---|---|
| secure | 8/task/lang | **960** (320 × 3), all 40 tasks at floor |
| practice | 10/task/lang | **1,200** (400 × 3), all 40 tasks at floor |

**2,160 items. Zero secure items carry concept links** — the firewall held. Every
question group holds exactly three language rows. No invented Annex A control ids. No
false modal claims in any key.

### What the grounding fixes bought

The five grounding rules added at the end of v7.0's session (merged-document,
criterion-evidence, sub-clause prohibition, the 38-control Table A.1 list,
excluded-control routing) held across 2,160 items. Beyond that, **the critique layer
rejected two false attributions on its own**:

- secure 5.5 — a key that misattributed a requirement to ISO/IEC 42001
- practice 4.1 — *"the item asserts that clause 4.1 requires per-system role
  assignment"*, which is subtle: 4.1 requires the organization to determine **its
  roles**, not a role per system

That second catch is the class of defect that took manual dry-run analysis to find the
night before. The pipeline now finds it unaided.

### Two transient network failures, both harmless

`pt-BR translate failed: fetch failed` on secure 4.8 and `misconception sourcing
failed: fetch failed` on practice 4.10. The trilingual integrity check came back clean
afterwards, so neither left a half-written group. Worth knowing the generator survives
them.

### The QA sweep, and a lesson about regexes

The invented-control-id and false-modal-claim sweeps returned **30 rows, of which 3
were real** — and those three were distractors, not keys.

The other 27 were the regex, not the bank:

- `\y(...)\M` matched keys legitimately beginning with the word **"No"** — the correct
  answer to a yes/no stem, carrying no cue
- `A\.\d+\.1\b` matched **`A.6.1`**, a legitimate family heading
- the "risk register" hits on task 4.4 are the concept `aia-no-risk-register-requirement`
  **working as designed** — the item must name the thing in order to deny it

**Rule: a term-presence sweep finds mentions, not assertions.** Always follow it with a
key/distractor split before treating any hit as a defect. Otherwise you spend an hour
disproving your own regex.

The three real hits — secure task 5.2 items keying on "the AI Risk Owner failed to…" —
turned out to be **good distractors**. A candidate who picks them has imported a role
from ISO/IEC 27001 clause 6.1.2 c) 2) that ISO/IEC 42001 does not define, *and*
attributed a finding to a person rather than to evidence against a requirement. That is
exactly what task 5.2 tests. Left in place.

### One real item defect, and the guard rule it earned

Two items opened their options with **`"Correct:"` and `"Incorrect:"`** — one practice
(1.3), one secure (1.5). A candidate reads four prefixes and picks the one that says
Correct. Both groups deleted and regenerated.

**The cue guard has no rule for verdict-labelled options.** It catches length dominance
and absolute-word tells; a `Correct:` prefix passes it cleanly. Recorded in §9.

---

## 2. Stages 10 and 11 — six surfaces and the JTA of record

| Surface | Migration | Note |
|---|---|---|
| Catalogue claim ×3 | 210 | + `load-aims-ia-i18n.mjs` for accents |
| Long-form description ×3 | 210 | 563 / 675 / 664 chars |
| Blueprint + task translations | — | `gen-jta-translations.mjs`, 90 rows, all provisional |
| Six public samples | 209 | six distinct tasks, one per domain, two for D4 |
| Badge | — | `certidemy-web/public/badges/AIMS-IA.png` |
| JTA version | 211 | v2.0 published, snapshot projected from live rows |

### The claim

> Validates that the holder can audit an AI management system against ISO/IEC 42001 and
> raise findings that rest on requirements the standard actually states.

Where ISMS-IA's hook is *findings survive challenge*, AIMS-IA's is narrower and sharper
because that is this scheme's distinct competence — a `should` in Annex B cannot carry a
nonconformity, nor can a note, nor can anything in ISO 19011. Neither field mentions
ISO/IEC 27001: the differentiators are stated as facts about ISO/IEC 42001, never as
things a sibling product lacks.

### The snapshot is projected, not pasted

Migration 211 builds `blueprint_snapshot` with `to_jsonb` and nested `jsonb_agg` **from
the live rows**. Two reasons, both of which generalise:

1. It cannot drift. A hand-written snapshot is a second copy of the JTA that can
   silently disagree with the database.
2. It cannot be corrupted in transit. Forty tasks of knowledge/skills/abilities pasted
   as literal JSON into the SQL editor is the exact route that has produced mojibake
   before. Here only the query text is pasted.

**Use this pattern for every future `jta_versions` row.**

### Task 2.6 — amendment 3

`verify-cert` flagged 2.6 as publishing an apply verb (*Select*) against a declared
`4_analyze`. This is **Amendment 1's defect in the opposite direction** — that pass
moved five statements *up* where the S field described applied work; 2.6 is the mirror
case and was missed because the check then compared blooms against the JTA rather than
verbs against blooms.

The statement moved, not the bloom. The 54 items already generated for 2.6 stayed valid
because items carry the task's bloom, not its verb. **Corrected while no translations
existed** — a day later it would have flipped 80 rows to provisional.

---

## 3. The exam-duration standard — the piece with the longest reach

AIMS-IA's duration was deliberately withheld by SCHEME-AIMS-IA §6, which forbade
inheriting ISMS-IA's 150 minutes. The bank now exists, so it was measured. **The rule
that came out of it is now in COGNITIVE-MODEL §5 and enforced by verify-cert.**

### Tier sets the base

| Tier | Items | Min/item | Form |
|---|---|---|---|
| Level I | 80 | 1.50 | 120 min |
| Level II | 50 | 3.00 | 150 min *(base)* |

Not a preference — **the cost of the item contract.** A Level I item asks the candidate
to find one correct answer among three wrong ones. A Level II item asks them to
evaluate four defensible options and determine which is *better*, for a reason they
could state in one sentence. That is a different act and it costs roughly double.

Fewer items is not a concession either: past a point a longer form stops measuring
competence and starts measuring stamina, and 80 analyze items is past that point. Same
move PSM I → PSM II makes, for the same reason.

### Measurement adjusts within tier

Two inputs, both computed from the **built bank**, never inherited:

**1. Reading load in the longest language.** One duration serves en, es-419 and pt-BR,
so a duration set on English disadvantages Spanish candidates. Measured across two
schemes, es-419 runs **116.9%** and **117.4%** of English — consistent enough to treat
as structural. **The longest language binds.**

**2. Analyze share** against the tier's reference scheme. Character counts cannot see
reasoning time.

### The AIMS-IA working

```
ISMS-IA:  50 items × 1354 es-419 chars in 150 min = 451 chars/minute
AIMS-IA:  50 items × 1408 es-419 chars ÷ 451      = 156.1 min   ← floor
          + analyze premium (69.48% vs 65.60%), rounded to a quarter hour
                                                  = 165 min, 3.30 min/item
```

### Against the market

There is **no ISO/IEC 42001 *internal* auditor exam with a published duration** — that
market is course-based with a final assessment rather than a timed independent exam.
The nearest anchors are Lead Auditor:

| Body | Format | Per item |
|---|---|---|
| PECB Lead Auditor | 80 MCQ / 180 min / open book / 70% | 2.25 min |
| PECB Lead Auditor *(alt.)* | 12 essay / 180 min / open book | — |
| GSDC Lead Auditor | 62 MCQ | not published |

**Sources disagree on which PECB format is current** — both an 80-MCQ and a 12-essay
form are reported within months of each other. Treat as unresolved.

At 3.30 min/item AIMS-IA gives 47% more time than PECB's MCQ figure. Intended: PECB's
is open book, so time is partly spent looking things up. Ours is closed book with four
defensible options, where the whole task is deciding.

### The 17024 position

**17024 prescribes no duration.** It requires the examination be planned and structured
so that assessment is valid and reliable, and that the decisions be documented. So the
defensible claim is never *"165 is correct"* — it is that the number was derived by a
stated rule from the built bank, benchmarked against what the market publishes, and
carries a review trigger.

**Review trigger:** re-measure when the bank is regenerated, when the cognitive profile
moves more than 2 percentage points, or when the binding language's expansion ratio
leaves 110–125% of English. Otherwise semi-annually.

---

## 4. Three defects the new invariant found within minutes

The duration check was written, run, and immediately failed on a **live certification**.

### DEFECT 1 — AIHR-I was 17% under-timed (migration 213)

`1.25 min/item`, the only cert below its tier floor. Not a tuned choice:

| Cert | en chars | es-419 chars | Time | min/item |
|---|---|---|---|---|
| **AIHR-I** | **745** | **896** | **50** | **1.25** |
| AIMS-F | 726 | 862 | 60 | 1.50 |
| ISMS-F | 685 | 806 | 60 | 1.50 |

**AIHR-I's items are the longest of the three 40-item Tier I certs and it gave the
least time.** A Spanish candidate read 11% more than ISMS-F's in 17% less time — on a
scheme about legal exposure in employment decisions.

Set to **60**, the tier base, not a measured number. ISMS-F and AIMS-F both sit at
exactly 60 despite a 7% item-length difference, which means **Tier I durations were set
by tier convention and never measured** — so there is no reference rate to derive from
(the two siblings imply 537 and 575 chars/min). 62–67 would have been false precision.

### DEFECT 2 — five items two checks could not see (migration 214)

AIHR-I task 3.5 held **15 es-419 practice items against 10 en and 10 pt-BR**. The five
extras carried **no `question_group_id`** — written in one go on 2026-08-12 at
`bank_revision v2-jta`.

**The important part is not the five items.**

`question_group_id` is how an item is reached. A null made these invisible to the
three-language check **by construction** — the check groups by that column, so it
cannot fail on what it cannot see. And **one of the five carries only two options**
(*"Verdadero o falso: …"*), the only sub-four-option item in the entire catalogue — yet
AIHR-I passed *"Every item offers at least four options"*. The same null hid it from
that check too.

**One missing column, two checks bypassed.** This is the answer-position blind spot in
a new place: **a check that filters before it counts cannot see what the filter
dropped.**

Retired uniformly rather than deleted — two of the five have attempts and
`quiz_attempts` is RESTRICT, so a hard delete would fail on those anyway; splitting
treatment by attempt count would be arbitrary. Follows 194 and 197.

### DEFECT 3 — two badges were never in the module the renderer reads

`gen-badges-module.mjs`'s `CODES` array stopped at AIHR-I. **ISMS-IA and AIMS-IA both
had PNGs in `public/badges/` and neither was embedded in `_shared/badges.ts`.**

`credential-og` is the only consumer, and `badgeDataUri` returns `null` for an unknown
code, so the card **rendered without a badge rather than failing** — the "looks like a
design choice rather than a bug" case the generator's own docstring warns about.

Regenerated: 11 badges, 245.5 kB raw → 331 kB module. `credential-og` redeployed.

**No `OG_RENDERER_VERSION` bump was needed**, and the reasoning matters: neither cert
has issued a credential, so no `verify/[id]` URL of theirs was ever crawled. The
marketing page's `?cert` OG URL carries no `&v=` at all, so it refreshes as the CDN's
`s-maxage=604800` expires. *An earlier claim in-session that a paying customer's card
was affected was wrong — the one real credential is SM-AI-I, which was always in the
nine.*

---

## 5. JTA files consolidated

`jta/` now holds **eleven `CODE_JTA_v2.0.md` files, one per certification.** Four were
stranded outside it under working names:

```
AIMS-IA_JTA_v1_1.md      -> jta/AIMS-IA_JTA_v2.0.md
AIMS-F_JTA_v1.3.md       -> jta/AIMS-F_JTA_v2.0.md
AIMS-F_JTA_v1.2.md       -> jta/_archive/          (v1.3 names it as superseded)
docs/ISMS-F_JTA_v2_0.md  -> jta/ISMS-F_JTA_v2.0.md (dot, not underscore)
```

**`AISM-I_JTA_v1.md` was NOT renamed to v2.0.** Its own banner declares it superseded
for all factual content and records that it **disagrees with the database on 22 task
statements**; the authoritative document is `AISM-I_JTA_generated.md`. It went to
`_archive`. AISM-I therefore has **no v2.0 file** until one is generated from live rows.

**House rule confirmed: every JTA locks at v2.0 for launch**, whatever working versions
it passed through. All eleven `jta_versions` rows already read v2.0 and `published`.

Known header drift, **not corrected**: AIMS-F still reads *"DRAFT, not locked"* though
`jta_versions` published its v2.0 on 2026-08-07; ISMS-F names family `security` where
the database says `ai-security`.

---

## 6. Invariants earned

**`form.duration`** — every certification declares an `exam_duration_minutes`, and its
minutes-per-item sits at or above the tier floor (1.50 Tier I, 3.00 Tier II).

Two reasons this exists:

1. **AIMS-IA reached Stage 11 with a NULL duration and nothing objected.** It was
   caught only because SCHEME-AIMS-IA happened to say "publication gate" — a note in a
   document nobody is required to read. A cert built without that note publishes with
   no time limit.
2. It found AIHR-I within minutes of being written.

**The floor is a floor.** Measurement adjusts upward — longer items or a heavier analyze
share earn more time. Nothing earns less, because the item contract does not get
cheaper.

Result: **eleven certs PASS.**

---

## 7. What shipped

### `supabase` — `3e135f3` → `0e66c72`

| Commit | |
|---|---|
| `040abb3` | 208 — AIMS-IA task 2.6 statement verb |
| `481022d` | 209 — AIMS-IA public samples |
| `161f9da` | 210 — AIMS-IA claim + description ×3 |
| `c863313` | 211 — AIMS-IA JTA version v2.0 |
| `fada245` | JTA files consolidated under `jta/` |
| `5fbf2d5` | AIMS-IA JTA header → launch-baseline format |
| `7a0aa80` | header dedupe |
| `f13bc3f` | `badges.ts` regenerated with 11 badges |
| `8d64b5c` | COGNITIVE-MODEL §5 — form shape follows the item contract |
| `f64c827` | verify-cert — the duration invariant |
| `6276200` | 213 — AIHR-I duration 50 → 60 |
| `0e66c72` | 214 — AIHR-I five ungrouped items retired |

### `certidemy-web` — `74fa417` → `8d83b1f`

| Commit | |
|---|---|
| `2a3382c` | AIMS-IA badge PNG |
| `8d83b1f` | `gen-badges-module` — ISMS-IA and AIMS-IA added to CODES |

### Files created

- `supabase/migrations/208`–`214`
- `supabase/scripts/load-aims-ia-i18n.mjs` — accented claim/description via API
- `supabase/scripts/patch-cognitive-model-form-shape.mjs` *(gitignored)*
- `supabase/scripts/patch-verify-cert-duration.mjs` *(gitignored)*
- `certidemy-web/public/badges/AIMS-IA.png`

---

## 8. Rules earned today

1. **A term-presence sweep finds mentions, not assertions.** Always split
   key-vs-distractor before calling a hit a defect. 27 of 30 hits were the regex.
2. **A check that filters before it counts cannot see what the filter dropped.** One
   null `question_group_id` bypassed two independent checks.
3. **Project the snapshot, never paste it.** `to_jsonb` + `jsonb_agg` from live rows
   cannot drift and cannot be corrupted in transit.
4. **The longest language binds.** One duration serves three; es-419 runs ~117% of
   English consistently across schemes.
5. **The floor is a floor.** Measurement adjusts a duration upward, never down.
6. **Refuse false precision.** AIHR-I's two siblings implied 62.4 and 66.7 minutes; the
   honest answer was the tier base of 60, because Tier I was never measured at all.
7. **A document that declares itself superseded must not be renamed to the launch
   baseline.** AISM-I's own banner stopped that rename.
8. **PowerShell patch anchors must respect CRLF.** `verify-cert.mjs` is 1,214 CRLF
   lines and 0 bare LF; an anchor ending `=\n` never matches. Detect EOL and emit it.
9. **Check the claim before asserting harm.** The "paying customer's badgeless card"
   was wrong — one query would have shown ISMS-IA has issued no credentials.

---

## 9. Open items

### AIMS-IA — the last four

1. **Translation review, 90 provisional rows.** The single remaining failure.
   `gen-translation-review.mjs`. Spanish and Portuguese sheets fall back to English
   until the flag flips — that is the pipeline being honest, not a bug.
2. **`render-asset` cache key must land BEFORE the flip.** Its own docstring: neither
   PDF's cache key includes a domain stamp, so flipping `is_provisional` will not
   refresh an already-generated sheet. Nothing is cached for AIMS-IA yet, so the order
   is still free to get right.
3. **`cue_tolerance` re-measurement.** Still PROVISIONAL (25ch / 15% / spread 100,
   `measured_over: null`). The bank now exists. **Strict-longest is 45.6%** — above the
   threshold SCHEME-AIMS-IA §8.1 itself names as a concern, though mitigated: mean
   margin 13.7 chars (6.8% of an option) and 0% guard escapes. Worth a deliberate look,
   not a PASS.
4. **`set-cert-status` → `available`**, plus `exam_link` purchase link.

### Recorded, not done

5. **Cue guard has no verdict-prefix rule.** An option opening `Correct:` / `Incorrect:`
   is a positional tell as fatal as length dominance. Add to `item-cue-guard.mjs`.
6. **The four-option check counts through groups.** It must count items directly, or an
   ungrouped item escapes it — as one did.
7. **verify-cert's summary line miscounts.** It printed `11 cert(s) with failures` on a
   run where ten certs had 0 fail, and `1 cert(s) with failures` on AIHR-I at 0 fail. A
   summary that says DO NOT PUBLISH on a clean cert trains people to ignore it.
8. **Tier I durations catalogue-wide were never measured.** AIHR-I's items being longest
   of its cohort suggests 1.50 may be tight for scenario-heavy schemes. Eight certs.
9. **AIMS-F JTA header reads DRAFT**; ISMS-F names family `security` not `ai-security`.
10. **AISM-I has no v2.0 JTA file** — generate one from live rows.
11. **OG version asymmetry**: `verify/[id]` carries `&v=`, the marketing `?cert` URL does
    not. Not a defect today; a future badge redesign is invalidatable on one path only.

### Carried from v7.0

12. Re-issue Julio's second seat (`SM-AI-I-V-6BBH-YSW8` spent by defect).
13. `exam-results.tsx` — render `credential_error` honestly.
14. Pin `verify-credential` and `credential-og` (both public, neither pinned).
15. `check-ob3-endpoints.ps1` into `CERT-PUBLISH-CHECKLIST.md`.
16. `translate="no"` on the exam surface.
17. Server-side finalisation on timeout.
18. No pass email. No learner-facing `/my-credentials`.
19. ISMS-IA cue_guard — ISMS-F task 2.3 field describes the wrong guard type.
20. Four certs (AIMS-F, ISMS-F, AISM-I, AIHR-I) route to NEUTRAL grounding.
21. CAIP-I unbuilt. AIMS-IA's own sibling **AIMS Lead Auditor** is the next IA-family cert.
22. PL 2338 trigger for AIHR-I D2.
23. GHL live push verification; advertising vendor-enable console panel; CertiGlobal
    checkout webhook.

---

## 10. State summary

- **Migration tip 214. Next free 215.**
- **Eleven certifications; ten `available`, AIMS-IA `draft`.**
- **AIMS-IA: 37 pass, 1 fail, 5 warn.** The failure is the translation review.
- **Every other certification: 0 fail.**
- **AIMS-IA bank:** 960 secure + 1,200 practice, firewall clean, all groups trilingual,
  no invented control ids, no false attributions in any key.
- **AIMS-IA exam:** 50 items, 165 minutes, 75% pass mark, 12-month attempt window.
- **`jta/` holds eleven v2.0 JTAs**, one per cert, plus `AISM-I_JTA_generated.md`.
- **`badges.ts` holds eleven badges**, deployed to `credential-og`.
- **One real credential exists**, `SM-AI-I-ZZMV-JPC8`, unaffected by anything today.

---

**End of checkpoint v7.1.** AIMS-IA went from Stage 9 unstarted to one failure from
publishable. Along the way an invariant written to stop the *next* NULL duration found
a live certification that had been giving candidates 17% less time than its siblings,
five items that two checks were structurally unable to see, and two badges that had
never reached the renderer. **Every one of those was found by writing down a rule and
then enforcing it in code — not by looking.**
