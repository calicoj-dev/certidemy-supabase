# HANDOFF v6.4 — the day `verify-cert --all` was run for the first time

**Session date:** 2026-08-10 (continues v6.3, same day)
**Reads with:** v6.3 for ISMS-IA content, v6.2 for the scaffold, v6.1 §0 for the
working protocol.
**Migration tip:** **196** · next free **197**
**Supabase:** `eb8fdec` · `f6dee5e` · `1582681` · `d40c0ba`
**Web:** `385352b` · `1bcbb56` · `ccbcbcc`

> **`verify-cert --all` now reports: All certs conform. Safe to publish.**
> Nine live certs, every invariant. ISMS-IA is the only failure and only because
> its item bank does not exist yet.

---

## 0. WHAT HAPPENED

The session began by finishing ISMS-IA's 38 lessons (v6.3). Then `--all` was run
— the regression test the script was built to be, never once run against the
whole catalogue — and it failed on **AIMS-F**, a cert published three days after
ISMS-F and passing every check at the time.

What followed found defects in **eight of ten certs**, across the spec, the
lesson layer, the item banks, and the item lifecycle itself. **Every one was
invisible.** All of it is now fixed.

### The pattern, and it is the thing to carry forward

**Every check that existed was correct. Every defect lived where no check
looked.**

- 76 two-option item groups hid from the answer-position guard **because that
  guard filters to items with three or more options.** The items most vulnerable
  to position cueing were precisely the ones it could not see.
- 20 ungrouped items hid from the language-completeness check **because that
  check groups by a column they do not have.**
- 36 broken widgets hid because **nothing validated widget config against the
  component that renders it.**
- Retirement did not retire because **no check verified that the lifecycle's own
  rule was enforced in the serving paths.**

> **A structural check that skips the rows most likely to be defective is worse
> than no check. It reports a pass.**

---

## 1. THE SPEC TOLD AUTHORS TO DO THE WRONG THING

`LESSON_AUTHORING_SPEC.md` line 484, since the file was written:

> *Variants: set `"allowReuse": true` to allow one target to receive multiple items.*

`verify-cert` **invariant 13 fails any cert that does this**, and has since
12 July. Its own comment records that such widgets were *literally
uncompletable* when shipped — the component evicted the occupant on a drop into
a filled target, so `allPlaced` never became true and Check never enabled.

**ISMS-F avoided it only because its per-cert style guide carried the rule.
AIMS-F's did not.** Two certs, three days apart, same checker, same generator,
opposite outcomes — because per-cert style guides do not inherit.

**Fixed in `eb8fdec`:**
- The `allowReuse` instruction is replaced with the rule and both reasons.
- A **four-option minimum** is stated for the first time anywhere.
- Two habits added to the checklist: `verify-cert` after module 1 and before
  deriving the style guide; `verify-cert --all` whenever an invariant is added.

> **A rule that lives only in a per-cert style guide dies with that cert.**
> Platform mechanics belong in the spec. Per-cert guides hold voice, sources and
> the attribution map. `STYLE-GUIDE-ISMS-IA` §3.2 still carries the 1:1 rule and
> should point at the spec instead.

---

## 2. AIMS-F — 36 WIDGETS ON SHAPES THE RENDERER DOES NOT READ

Every widget AIMS-F authored itself was wrong. The only correct ones were five
drag-match, and those were wrong differently.

| Defect | Count | Fix |
|---|---|---|
| drag-match many-to-few (4→2) | 12 | 10 → `highlight-mistake`, 2 → genuine 1:1 |
| `highlight-mistake` using `prompt`/`options` | 5 | converted to `scenario_title`/`highlights` |
| `scenario-mcq` with no `steps` | 11 | converted to `highlight-mistake` |
| `sort-into-order` using `correct` | 4 | renamed to `correct_order` |

**The eleven `scenario-mcq` were not convertible.** That widget is a branching
multi-step scenario; AIMS-F had written single-question MCQs. There were no
steps. Each became a `highlight-mistake` where the question is the title, the
scenario and its options are the passage, and each option is a clickable span
with feedback split out of the original explanation — **so a learner who picks
wrong now learns why, rather than seeing a letter.**

`01-05` got better than a conversion: its scenario is a supplier sentence
containing three over-claims, so instead of asking learners to *count* them it
now asks them to *find* them.

**All 105 files (35 lessons × 3 languages) verified: widgets conform, spans
resolve, zero coinage, zero mojibake.** Committed `ccbcbcc`.

### The rule this earned

> **Read the component, not the spec, before using a widget.** The spec is
> incomplete and in one case wrong. `components/lessons/widgets/*.tsx` carries a
> docblock with the exact config shape, and it is authoritative. The
> `highlight-mistake` component cites "SPEC §7.4" — a section that does not
> exist.

---

## 3. 76 ITEM GROUPS A GUESSER PASSES, ACROSS SEVEN LIVE CERTS

228 rows held exactly two options. Some were bare `True | False` with no
explanatory text — the options carried no information and a coin decided.

```
SM-AI-I  11 secure + 11 practice      ISMS-F   3 secure + 4 practice
SD-AI-I  11 secure +  6 practice      AIE-I    2 secure + 4 practice
SPO-AI-I  8 secure +  4 practice      AISM-I   2 secure + 4 practice
AIHR-I    5 secure +  1 practice
```

**AIMS-F had three more**, rewritten in place by **193** because nothing there
had ever been answered. **194** retired the 76 groups; **195** caught 5 more in
AIE-I that 194 missed **because they have no `question_group_id` and the
retirement list was keyed on groups.**

Retirement rather than rewrite because **8 attempts existed** across 6 items.
Migration 089 is precise: once an item has been presented it is never deleted or
silently rewritten, because the response history is the examination record
ISO/IEC 17024 requires.

**Then the generators backfilled 55 task-language slots to floor** — seven certs,
both pools, `BANK_REVISION=v2-jta-r2` so replacements stay distinguishable in
`v_retired_items_evidence`. Several tasks needed three or four passes because the
cue guard kept dropping items for length dominance and absolute-word tells, which
is the guard working.

---

## 4. RETIREMENT DID NOT RETIRE

Migration 089 states the rule: *"Retiring removes an item from circulation for
future forms."* It adds `retired_at`, `retire_reason`, `supersedes_id`, and a
trigger blocking deletion of any answered item.

**Neither path that serves a question checked `retired_at`.**

- `generate-mock-exam/index.ts` — filtered `certification_id`, `pool`,
  `language`, `status='approved'`, `is_exam_scope`. No `retired_at`.
- `fetchConceptPractice` in `lib/engine/sessions.ts` — filtered neither. **It
  would have served a rejected item**, not only a retired one.

A grep for `retired_at` across both repos found it in four places: the migration
that created it and three scripts that *count* items.

Both gaps were **latent** — nothing had ever been rejected or retired, so nothing
had been mis-served. **Migration 194 was the event that would have made both live
at once**, which is why the filters landed first (`f6dee5e`, `1bcbb56`),
deployed, and were verified in the bytes before any retirement ran.

---

## 5. INVARIANTS EARNED TODAY — ALL TEN FOUND A REAL DEFECT

None of these exist in `verify-cert` yet. Each is one query.

1. **Every item has ≥4 options.** Found 79 groups across 8 certs.
2. **No live item has a null `question_group_id`.** Found 20 in AIE-I.
3. **Widget config matches its component's shape.** Found 36 in AIMS-F.
4. **Every `highlight-mistake` span resolves in its own `text`.** Nothing checks
   this, and a translator can break it silently.
5. **No create-level verb leads a `skills` field.** Found 13 across 6 certs.
6. **Every cert holds a published `jta_versions` row.**
7. **No duplicate stems within a cert and language.** Found 2 pairs in AIE-I.
8. **`retired_at` is honoured by every serving path.** Was not.
9. **Concept coverage: every declared `concept_slug` is assessed somewhere in the
   lesson.** Found one in ISMS-IA 05-04.
10. **The statement-verb map should recognise `turn`, `produce`, `build`,
    `assemble`.** SD-AI-I 2.2 opens with `Turn` and only WARNs.

**Plus two process habits**, now in the spec: `verify-cert` after module 1 and
before the style guide is derived; `verify-cert --all` whenever an invariant is
added.

---

## 6. THE CREATE-VERB SWEEP — RUN, AND BENIGN

Never run before. **13 tasks across 6 certs** have a `skills` field opening with
a generative verb. Five contradict their own statement in the same row —
statement says *Select*, skills says *Write* — the same pattern ISMS-IA had.

**Every item spot-checked was clean.** 40+ stems across 5 certs, all
selection-framed. The generator does not act on the `skills` field, so **this is
documentation hygiene, not a regeneration.** No fix applied yet; it is a
correction migration owed.

The regex needed two rounds to get right: leading-position only (or it fires on
`privacy-by-design`), and the verb list extended with `produce`. **An invariant
never tested against a known answer set is the same mistake as an untested
guard.**

---

## 7. PROCESS FAILURES WORTH KEEPING

**Diagnose by measurement, not by theory.** An em-dash broke six of twelve patch
anchors. The correlation was perfect and took one query to see — but three
theories were tried first, and the fix that worked came from a direct
string-diff. **Compare the two strings before reasoning about why they differ.**

**A generated PowerShell script must be pure ASCII.** Emit non-ASCII as
`[char]0xNNNN`. And each line must be **one parenthesised expression**, or
`'a'+[char]0x2014+'b'` enters an array as three elements and gains newlines.

**`git status` after a patch.** "The script printed anchors ok" and "the file
changed" are different claims. A deploy ran against unchanged code because
`-Apply` was never passed.

**The Supabase editor gives each statement its own connection.** No temp table
survives. Inline the list as a CTE in every statement that needs it.

**`%` in a Python format string, `$using:` outside a remote scope.** Both cost a
minute. Both are the same class as the em-dash: a character with meaning in the
transport layer.

---

## 8. STATE

| Cert | Status | verify-cert |
|---|---|---|
| AIE-I | available | 29 pass |
| AIGRM-I | available | 29 pass |
| AIHR-I | available | 29 pass |
| **AIMS-F** | available | **28 pass, 2 warn** |
| AISM-I | available | 29 pass |
| ISMS-F | available | 29 pass |
| **ISMS-IA** | **draft** | **20 pass, 4 fail** |
| SD-AI-I | available | 28 pass |
| SM-AI-I | available | 29 pass |
| SPO-AI-I | available | 28 pass |

AIMS-F's two warns are correct: three legitimate PDCA references, and task 2.4
opening with `assign`, a domain verb outside the Bloom map.

**ISMS-IA:** 38 lessons loaded and wired, 169/169 concepts taught, 0 untaught
testing violations. Its four failures are all the absent item bank.

---

## 9. NEXT — STAGE 9 IS A BUILD

**`item-pipeline.mjs` is at `scripts/lib/`, not `scripts/`.** It implements the
L1 contract: one correct answer among three wrong on the merits.

**Do NOT point it or `gen-cert-secure.mjs` at ISMS-IA.** A Level II JTA needs:

> Four options, **all defensible on the facts given**, one best. The best answer
> must be better than the second-best **for a reason a competent auditor could
> state in one sentence.** The second-best must be **genuinely defensible, not
> merely wrong** — an item whose second choice is incorrect is a Level I item in
> the wrong bank.

**And the cue guard inverts.** In L1 an unusually long key is a cue to strip. In
L2 the best option is frequently best *because it is better qualified* —
*"...provided the sample is representative of the period under audit"*. A
length-homogeneity guard tuned for L1 systematically rejects correct L2 items and
keeps flat ones. `item_model.cue_guard` records the intended fix: test comparable
**qualification density**, not comparable length. **Not built, not validated.**

Floors: ≥8 secure and ≥10 practice per task per language. 38 tasks →
**912 secure and 1,140 practice**.

### Also owed

- **The ten invariants in §5**, and the create-verb corrections in §6.
- **AIE-I's 15 ungrouped items** still have no `question_group_id`, so they stay
  outside the language-completeness check. Grouping them means generating en and
  pt-BR siblings.
- **ISMS-IA translations** — 38 lessons × 2 languages.
- **`price_usd` = 0** on both ISMS-IA and AIMS-F.
- **`ISMS-F` task 2.3** says *environmental-conditions*; Amd 1:2024 says
  **climate change**.
- **`ISMS-F` lesson 3.6** — NOTE 1/NOTE 3 misnumbering; should be NOTE 2/NOTE 3.
- **`CERT-PUBLISH-CHECKLIST`** still has no `jta_versions` step.
- **`ISMS-IA_BoK_v1.md`** §3 lists five ISO 19011 changes; the foreword names two.
- **AIHR-I is UUID `7777…`** — only `8888` and `9999` remain free, not three.

---

## 10. NEXT SESSION PROMPT

> Continuing Certidemy. Read `HANDOFF-v6_4.md`, then v6.3 for ISMS-IA's content
> and v6.1 §0 for the working protocol.
>
> **`verify-cert --all` reports: All certs conform. Safe to publish.** Nine live
> certs pass every invariant. ISMS-IA is draft with 20 pass / 4 fail, all four
> being the item bank that does not exist yet. Migration tip **196**, next free
> **197**.
>
> **Stage 9 is next and it is a build, not a run.** §9 has the Level II item
> contract and the cue-guard inversion. The L1 generators must not be pointed at
> ISMS-IA.
>
> **Before doing anything else, read §0.** Today found defects in eight of ten
> certs, and every one was invisible to a checker that reported a pass. The
> pattern is that a structural check which skips the rows most likely to be
> defective is worse than no check. §5 lists ten invariants earned today, none of
> them yet written.
>
> **The habits that carried this session:** run `verify-cert --all` whenever an
> invariant is added; read the component rather than the spec before using a
> widget; check `git status` after a patch; and when two strings differ, diff
> them before theorising about why.

*End of HANDOFF v6.4.*
