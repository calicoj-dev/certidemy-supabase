# HANDOFF v6.7 — ISMS-IA, built and cleared

**Session:** 2026-08-11/12, continues v6.6.
**Migration tip:** **203** · next free **204**
**Supabase:** `17f3f97` · **Web:** `770ee8e`
**Read with:** v6.5 and v6.6 for the Level II pipeline, CERT-PUBLISH-CHECKLIST for the
publish path.

> **ISMS-IA is one console flip from live.** verify-cert: 33 pass, 0 fail.
> Everything the checklist calls for is done. `status` is still `draft`.

---

## 1. WHERE ISMS-IA STANDS

| | |
|---|---|
| Lessons | 38 × 3 languages, 114 rows |
| Secure bank | 912 items (8/task/lang × 38 tasks) |
| Practice pool | 1,140 items (10/task/lang) |
| Catalogue claim | en, es-419, pt-BR |
| Public samples | 6 tasks, 5 domains, 4 analyze / 2 apply |
| Badge | `public/badges/ISMS-IA.png` |
| Exam | 50 items · 150 minutes · 75% |
| Validity | **730 days** — the first cert off the house default |
| Scheme doc | current, including both new decisions |

**Remaining: flip `draft` → `coming_soon`, confirm the catalogue card and the
sample carousel render in all three languages, then → `available`.** Both flips
are in the super-admin console. Note that `open-badge` only serves an Achievement
document for `available` certifications, so the flip is what activates the
credential infrastructure, not merely the storefront.

---

## 2. WHAT THE PIPELINE LEARNED — ALL OF IT REUSABLE

Five defects fixed, none specific to ISMS-IA. AIMS-IA (ISO/IEC 42001 Internal
Auditor) inherits every one.

### The yield collapse was three L1 constraints stacked on L2 items

**Difficulty rejected instead of repaired.** ~9 of 22 rejects were sound items
discarded because the model omitted an optional metadata field. Now defaults to 3;
out-of-*range* still rejects, because that is the model asserting something wrong
rather than omitting something.

**Two length checks with opposite consequences.**

```
character-based cue guard (stage 4) -> fails -> normalizeOptions -> repaired
word-based ceiling (stages 2 and 3) -> fails -> DISCARDED, silently
```

`normalizeOptions` exists to shorten over-long options while preserving meaning
and sat *downstream of the gate that made it necessary*, reachable only from the
cue-guard branch. Items died over one option 1–4 words past the ceiling, taking
three good distractors each. `validationFault()` now names the fault and
`keepOrRepair()` routes **only** `option-length` to the repair.

**The repair did not know its target.** `normalizeSystem` asked for options
"closely matched in length" — relative, correct for its original job — so given
46/44/43/41 against a 45 ceiling it returned 44/44/43/43, still over. Stating the
hard number took the repair rate from **1 in 5 to 6 in 8**, and fixed the L1 path
too.

> **ROUTE, DON'T RAISE.** At a 25-word ceiling the model writes 22–28 word
> options; at 45 it writes 35–63. It writes to whatever ceiling it is given and
> overshoots by the same proportion. Raising the number moves the cliff. The
> ceiling is worth keeping for the QUALITY it buys — options now carry reasoning
> instead of being truncated — but it never fixed yield.

### The checker and the generator used different numbers

`verify-cert` line 507 hardcoded `KEY_LEN_MARGIN = 5, KEY_LEN_PCT = 10` while the
guard read env. ISMS-IA generated 912 items at 25/15 and then failed its own audit
on 26 "escapes" — measured at 25/15, **zero**. None of those items was defective.

Now `exam_blueprint.item_model.cue_tolerance` carries the declaration and both
sides read it (`cueConfigFor`). Absent → L1 defaults, so the nine live certs are
untouched. Env still overrides but the resolved source is printed and appended to
the verify detail line, so a loosened setting cannot pass silently.

**The measured distribution that justifies 25/15**, recorded because the next
audit cert will need the same argument: of 304 English secure items, 144 have the
key longest — 114 by 1–20 characters, 30 by 21–40, **none beyond 40**, mean margin
13 characters on ~200-character options. Two or three words. The L1 defect this
guard exists to catch looked entirely different: key longest 75–82% of the time
against thin distractors.

### The reviewer overruled the scheme from memory

`critiqueAndRevise` rejected a correct item with *"ISO 19011:2026 does not exist;
the current edition is ISO 19011:2018"*. `draftSystem` interpolated
`groundingFor(certName)`; `critiqueSystem` never did. Fixed — but see §4, it is
not fully closed.

### The mint path ignored the validity column

`score-mock-exam` hardcoded `getFullYear() + 1`. Migration 158 had recorded this
gap in its own header and left it as a follow-up. Setting `validity_days = 730`
without the patch would have made the fact sheet say two years while every
credential still expired in one. Now reads the column, **adds days rather than
incrementing the year** — `getFullYear() + N` on 29 February silently rolls to
1 March.

---

## 3. TWO SCHEME DECISIONS, WITH THEIR REASONING

**150 minutes, 3.00 min/item.** A Level II item is ~90-word stem plus four
~200-character options, 65.6% at analyze. That is ~270 words — roughly eighty
seconds of reading before any weighing. Three minutes leaves ninety seconds for
the judgment. A tighter allowance measures reading speed, hardest in es-419 and
pt-BR which run 15–25% longer for identical content. Sits inside the range
established internal-auditor exams use, which is a sanity check on the estimate,
not its basis. **Revisit against real completion data.**

**730 days.** Validity is a commitment to re-review the body of knowledge on that
schedule. ISO 19011 ran 2018→2026; 27001 ran 2013→2022 with Amd 1:2024;
17021-1 stable since 2015. An annual re-review would in most years find nothing
changed and ask the holder to recertify with nothing new to demonstrate.

---

## 4. OPEN, IN ORDER OF WHAT IT COSTS

**`achievement.image` is absent from every credential the platform issues.**
`ob3.ts` builds `name`, `criteria`, `creator`, `alignment`, `description`,
`resultDescription` — no `image`. The spec makes it optional, so credentials are
valid, but it is the field LinkedIn and wallet apps read to display a badge. Ten
badges sit in `public/badges/` rendering only on Certidemy's own pages. One field:
`image: { id: "${siteUrl}/badges/${certCode}.png", type: "Image" }`. Touches all
ten certs, so it deserves its own change.

**The critique reviewer still rejects correct annex citations.** It now has the
edition set but not the *contents*, so when an item cites ISO 19011 Annex A.17 it
rejects on suspicion. Verified against the standard: A.17 *is* "Conducting
interviews" in the 2026 edition, and the concept row says so correctly. Cost some
yield on ISMS-IA and will cost the same on AIMS-IA. Fix: add the annex list to the
AUDIT grounding so the reviewer can verify rather than guess.

**ISMS-IA's secure bank predates the critique grounding fix.** Some correct items
citing 19011:2026 were rejected during that run and never made it in. The bank is
sound — 912 items, zero cue escapes — but slightly thinner than it would be today.
Not worth regenerating; worth knowing.

**Owed from earlier sessions:** `exam_blueprint.item_model.cue_guard` still
documents a qualification-density guard that does not exist (the guard measures
characters; `KEY_LEN_MARGIN` is the interim). LESSON_AUTHORING_SPEC §7.4 missing.
16 tasks with create-verb skills fields. ISMS-F task 2.3 says
"environmental-conditions" where Amd 1:2024 says "climate change". AIE-I content
directory is `content/spo-i/`.

---

## 5. METHOD NOTES

**One variable per measurement.** Four were changed at once — ceiling, CHUNK,
spread, margin — and the result attributed to the ceiling. That was a measurement
error, caught by Juan asking the obvious question: *if that was the problem and
not the ceiling, why not test the ceiling alone?* Every change after that moved
one thing, and the single-variable test found the real cause immediately.

**Instrument before theorising.** Three hypotheses, three misses, then one log
line gave the answer. The log had been saying `no valid drafts` fifteen times —
the stage was named in the output all along.

**Verify the verifier.** Seven times this session a check I had just written was
itself wrong: a round-trip simulator that ate a literal `+`; a duplicate-stem
check whose severity would have destroyed 44 legitimate variants; three
post-check regexes that matched the explanatory comment warning against the
pattern; a script block that reported a successful write that never happened; and
a round-trip decoder with an off-by-one (`[char]0x` is **eight** characters) that
had passed every prior patch by luck, because 4-hex-digit codepoints leave a
stray `x` that still parses as hex. `00A7` does not.

**In every one of those cases the change was correct and the machinery around it
was wrong.**

Two rules that follow, both earned:

- **Post-checks anchor on executable syntax, never on a string a comment could
  quote.** `exp.setDate` was the right check; `getFullYear() + 1` was not, because
  a paragraph explaining the old behaviour sat directly above the new code.
- **Single-line anchors only.** Six of seven patch failures involved multi-line
  matching. Line endings differ per repo — the supabase `.md` files are LF,
  `load-cert-i18n.mjs` in the web repo is CRLF — and any multi-line anchor must
  detect the file's endings *before* the anchor strings are built, not after.

**`node --check` parses, it does not resolve.** A missing import passed every
syntax check and failed at runtime on all 60 passes of a generation loop. The load
test — `node -e "import('./path.mjs')"` — is what catches it, and belongs after any
patch touching imports or module-scope names.

---

*End of HANDOFF v6.7.*
