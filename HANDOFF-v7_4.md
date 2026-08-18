# HANDOFF v7.4 - Cobertidemy: the readiness report

**Session date:** 2026-08-17 (continues v7.3, same session)
**Supersedes:** HANDOFF-v7.3 for everything analyzer-related. v7.3 section 6 (the
48 unexamined items) is UNCHANGED and still open.

**Migration tip 226. Next free 227.** Six migrations this stretch: 221-226.
**Repo:** supabase pushed clean (`7b9bb15`). Web untouched. Worker still has no
remote (carried from v7.2).

**READ SECTION 1 FIRST.** The product changed shape late in the session. Most of
the code survives; what it OUTPUTS does not. A fresh session that starts from the
code without reading section 1 will keep building a coverage score, which is the
wrong artifact.

---

## 1. THE REFRAME - what this thing actually is

It is **not a coverage scorer**. It is a **readiness report and build plan** for
training providers, and the product has a name candidate: **Cobertidemy**
(cobertura reads near-identically in en / es-419 / pt-BR; `Contrastidemy` also on
the table; internal feature key is `curriculum_coverage` and is renameable).

### 1.1 The actual question

Not "how much of our certification does their course cover."
**"What must they add to teach a course that prepares candidates for our exam."**

That inverts the sign on the finding that had been treated as a measurement
problem all session. SM-AI-I's D3 has 23 concepts: about 8 are plain event names
a syllabus lists, and about 13 are analytic or anti-pattern concepts
(`Daily Scrum as status report (anti-pattern)`, `Sprint Review is not a demo`,
`Sprint Goal vs selected items`, `Timebox violations`).

No match term will ever find those 13 in a competitor syllabus, because a
syllabus does not list anti-patterns. **They are not a gap in measurement. They
are the deliverable.** "Your syllabus lists the five events. Ours assesses the
twelve ways teams get them wrong, and here is where to teach each one."

Granularity is non-negotiable precisely because the certification was built
against it for 17024. Theirs is negotiable. That asymmetry IS the product.

### 1.2 The multi-certification scan

A partner feeds ONE syllabus and gets scored against ALL ELEVEN certifications:

> "Your course is 71% ready for SM-AI-I, 22% for SPO-AI-I."

Then they pick one and get the build plan for it.

**This is nearly free.** Drift, weighting, density and framework detection are
computed once on the text. Concept matching is the only per-certification work
and it is lexical. Eleven blueprints is a loop over a pass that already works.

This is the question a training provider actually has and has never been able to
ask anyone.

### 1.3 The report is TASK-anchored, not concept-anchored

Concepts are the matching MECHANISM. **Tasks are the unit a partner acts on**,
because a task is what the exam assesses and what a lesson maps to.

Per task:
- what they cover, in THEIR topic labels (they must see their own words)
- the concepts beneath it, matched or not
- the gap phrased as an INSTRUCTION: "add coverage of X to your module 3"
- our lesson references per gap -- `task_concepts` + `lesson_concepts` already
  make this a join we can do today

Three scores, never blended into one:
1. **topic alignment** - coarse, generous, matched at their granularity
2. **task readiness** - per domain weight; the number that matters
3. **AI concept coverage** - near zero for every pure-Scrum competitor, and that
   is the honest differentiator rather than a deficiency

**Bidirectional stays mandatory.** BCS EXIN teaches estimation, ROI and
information radiators that we do not assess. That is their differentiation, not
an error. A one-directional report reads as an attack.

### 1.4 The commercial frame changes the closing line

Partner cost is **vouchers, not cash** (order of 5-10/month). Certidemy sells at
$30; the partner resells at whatever their market bears. So the report must not
end with "you have gaps" but with:

> "You are N vouchers of work away from delivering SPO-AI-I."

The build plan IS the onboarding path. The report is the first half of a sales
conversation the partner runs themselves.

**Free public scan:** the eleven-way fit and nothing else. Useful, shareable, and
useless for copying.
**Behind the partner agreement:** the build plan - tasks, concepts, lesson links.
That is the licensed material.

### 1.5 Why a competitor cannot ship this quickly

Not because the code is hard - the core was built in a day. Because the ARTIFACT
IT READS does not exist on their side. A build plan needs, already machine
readable: a task-level JTA, a concept layer beneath it, concept-to-lesson links,
and published domain weights. A scheme that exists as a PDF can yield a topic
list; it cannot yield "task 3.7 is unaddressed, here are its four concepts, here
are the lessons."

Same reason our item bank could be swept for drift in one query and theirs
could not.

**TWO CAUTIONS.** Do not assume they *cannot* - assume they *have not*, which is
verifiable rather than hopeful. And any claim reaching a partner must be about
what Certidemy HAS, never about what a named competitor lacks: CLAIMS-POLICY
Class B, source URL plus `verified_as_of`.

---

## 2. MIGRATIONS THIS STRETCH

| # | what | note |
|---|---|---|
| 221 | widen `Scrum roles` pattern | **achieved nothing it was written for** - see 2.1 |
| 222 | exclude section numbers from that pattern | corrects 221 |
| 223 | `language_unsupported` suppression reason | |
| 224 | `tasks.scope_tag` core / extended | 7 AI tasks tagged |
| 225 | `concepts.match_terms text[]` | shipped inert, 0 authored |
| 226 | `platform_features` + `company_features` | entitlements |

### 2.1 221 and 222 - a cautionary pair, kept for the record

221 widened rule 5 so the CSM blog's "three primary roles" would be caught. **It
did not.** The blog was already firing via its "Scrum Roles in the CSM Course"
heading; the count was never the mechanism. 221 was written against an ASSUMED
match, not an inspected one.

Its only real effect was on BCS EXIN, 4 drift -> 5, where the matched span turned
out to be `"3 Other roles"` from the section number in `2.3 Other roles`. 222
added a negative lookbehind and it went back to 4.

> **A COUNT IS NOT EVIDENCE.** `verify-cert` passing 29/0 did not mean the bank
> was clean. A rule firing did not mean the item was wrong. A drift count moving
> 4 -> 5 did not mean the rule improved. **Read the matched span. Every time.**

### 2.2 224 - scope_tag

`core` = a competent course in the base discipline could reasonably cover this.
`extended` = it could not, because the task is stated in terms outside that
discipline.

All 7 SM-AI-I AI tasks (1.7, 2.10, 2.11, 3.11, 4.11, 5.10, 5.11) are `extended`,
INCLUDING 1.7 and 4.11 whose underlying competences (empiricism, Definition of
Done) are core Scrum. The test applied was "could a pure-Scrum course match this
task AS STATED", not "is the underlying idea Scrum."

**A concept is extended-only when EVERY task reaching it is extended.** 14 of 107
qualify. `Definition of Done` stays core because a core D4 task also reaches it.

Measured impact on coverage: **about 2 points.** Correct and worth having as the
differentiator, but it was not the explanation for the 19-vs-49 gap.

### 2.3 226 - entitlements

Deliberately declined earlier in the session (no feature to gate), built once
`curriculum_coverage` existed. Three decisions:

- **No `enabled` boolean.** A grant row exists or it does not. A boolean creates
  the state where a row says false and two places disagree about what "no row"
  means.
- **Revoke, do not delete.** `revoked_at` preserves who had access when. That
  question gets asked in a contract dispute.
- **`company_has_feature()` is the ONLY definition of liveness** (not revoked AND
  not expired). Every loader calls it; nothing re-implements the comparison.

**`public.companies` is EMPTY (0 rows).** The partner side is entirely unbuilt.
The entitlement table is correct and proven but has no subject, and the
super-admin toggle UI will render an empty list.

---

## 3. THE ENGINE

`supabase/functions/_shared/analyzer/` - pure modules, no `Deno.*`, no `fetch`,
no Supabase client. `reader.ts` is the ONE impure module and `engine.ts` does not
import it.

| file | role |
|---|---|
| `types.ts` | Blueprint, DriftRule, Finding, RunGates |
| `regex.ts` | Postgres-to-JS regex translation + self-match assertion |
| `normalize.ts` | text folding, hyphenation rejoin, word count |
| `gates.ts` | density, framework detection, suppression precedence |
| `drift.ts` | rule matching + contrastive detection |
| `weights.ts` | percentage extraction + divergence |
| `concepts.ts` | `LexicalMatcher` (IDF-weighted), coverage formula |
| `engine.ts` | orchestration |
| `reader.ts` | `BlueprintReader` + the firewall |

`package.json` with `{"type":"module"}` lives in that folder because the repo
root declares `"type": "commonjs"`, which disables Node's ESM syntax detection
and makes the `.ts` files load as CJS. Deno is unaffected (`deno check` clean).

### 3.1 The firewall is TESTED, not assumed

`assertTableAllowed()` is exported specifically so it can be tested - it was
private until it became clear that made the control unprovable, which is the same
category of problem as a rule that never fires.

15/15 cases pass: allows `certifications`, `domains`, `tasks`, `concepts`,
`task_concepts`, `lessons`, `lesson_concepts`, `modules`; refuses
`quiz_questions`, `question_concepts`, `quiz_attempts`, `exam_attempts`,
`credentials`, `fsrs_cards`, and anything simply off-list.

Structural non-reachability (secure items write no `question_concepts`) is NOT
the control. The allowlist is.

### 3.2 Postgres regex is not JS regex - twice over

`\b` is BACKSPACE in Postgres; boundaries are `\m` `\M` `\y`. Rule 11 shipped
dead in migration 220 and only the self-match assertion caught it.

Then the reverse: **JS `\b` is ASCII-only.** A term whose first or last character
is accented never matches - `/elimin[o-acute]\b/` fails on "elimino-acute el
termino". So `regex.ts` translates `\m`/`\M` to Unicode-aware lookarounds over
`\p{L}\p{N}_`, NOT to `\b`. Interior accents are fine; edges are not. This would
have silently killed most of the future es-419 and pt-BR ruleset.

`compileRules()` REJECTS a rule whose translated pattern does not match its own
legacy term, and the engine emits a high-severity internal finding naming it. A
rule that finds nothing looks exactly like a clean document.

### 3.3 Contrastive detection

A legacy term near an edition marker (`no longer`, `formerly`, `the 2020 Scrum
Guide`, `elimino el termino`) becomes a `structural_note` requiring review, NOT a
drift finding.

This exists because of v7.3 section 6.2: the ruleset's first 19 hits were SM-AI-I
items and **all 19 were correct** - items that teach the drift the rule detects.
A document teaching drift and one suffering from it are identical to a substring
match.

### 3.4 Clean pass requires rules to have RUN

`cleanPass` requires `drift.rulesetSize > 0`. AulaUtil reported `drift=0
cleanPass=true` on a competitor syllabus containing four legacy terms, because
the document is es-419 and every rule is en, so zero rules applied.

**A false clean pass is worse than a false positive.** A false positive gets
argued about; a false clean pass gets believed.

Fix: `ruleLangs` defaults to `[lang, "en"]` for non-English sources, because the
official translated Scrum Guides keep roles, artifacts and events in English
(TERMINOLOGY-POLICY rule 4). AulaUtil literally contains `Development Team`,
`Daily Sprint`, `Sprint Planning Meeting`, `Time-Boxing`.

Pass `ruleLangs` explicitly for a source family whose translations DO localise -
ISO standards translate their control names, so applying the English ruleset to
a Spanish ISO syllabus would be wrong.

### 3.5 Coverage is suppressed when the matcher cannot measure

`ConceptMatcher.supports(sourceLang, blueprintLang)`. `concepts` has no `lang`
column and no i18n table, so concept names are English only. Against AulaUtil the
matcher produced **8.9% versus a hand score of 35%** - a figure made almost
entirely of language, and one that would have read as a devastating competitor
finding.

Migration 223 adds `language_unsupported`. This is a MATCHER limitation, not an
engine one: a multilingual embedding matcher would declare support and the branch
would never fire.

### 3.6 IDF weighting

First matcher counted a plain fraction of tokens present. The ambiguous band ate
50-68% of every document, because concept names share vocabulary (`sprint`,
`scrum`, `product`, `team`, `goal`) and any Scrum syllabus is full of those. It
measured "does this use Scrum words", not "does it teach this concept".

`lexical-v2-idf` weights tokens by inverse frequency across the concept
vocabulary. Ambiguous collapsed to 8-23. **Coverage did not move** - those
concepts went to `absent`, and neither band is credited. Honesty improved; the
number did not.

---

## 4. CALIBRATION STATE

`scripts/calibration-manifest.json` is COMMITTED and is the regression baseline;
fixtures stay gitignored in `fixtures/calibration/`.

Six fixtures, five assertions each (sha256, suppression, framework, drift,
cleanPass). **6/6 green.** Exits 1 on regression, usable as a build gate.

| fixture | words | drift | coverage | hand |
|---|---|---|---|---|
| agileplaza-scrumstudy | 96 | 1 | suppressed (framework) | 14 |
| aulautil-certiprof (es) | 1267 | 4 | suppressed (language) | 35 |
| bcs-exin | 3181 | 4 | 10.4 | 38 |
| csm-blog | 1315 | 3 | 16.6 | 29 |
| scrummanager (78pp manual) | 13398 | 5 | 20.0 | - |
| tuv-sud | 1673 | 2 | 19.0 | 49 |

**Language is DECLARED in the manifest, never guessed.** The old filename
heuristic is what let the AulaUtil bug hide.

`hand_*` and `expect_*` are separate fields. The hand score is an anchor, not an
oracle - **TUV's hand score of zero drift is recorded as WRONG**, with the reason:
the document carries `Sprint Planning meeting`, `Sprint Review meeting` and
`Sprint Retrospective meeting` as literal rows in its own weighting table.

**Do NOT add `expect_coverage` as an assertion yet.** Under the reframe, a single
coverage percentage is not the output, and freezing it would lock in the wrong
artifact.

---

## 5. THE MATCH-TERMS ATTEMPT - what went wrong

Migration 225 added `concepts.match_terms text[]` so a concept could carry the
surface forms a document prints, separate from its analytic name. Zero authored.

`scripts/propose-match-terms.mjs` generated a D3 review file. **The output was
about 97% noise, from three bugs plus one missed source:**

1. **Language bleed.** `lessons` has a `language` column and the proposer does
   not filter on it. Spanish and Portuguese candidates polluted an English
   blueprint.
2. **Bold spans are emphasis, not labels.** `**...**` marks emphasis mid-sentence
   in these lessons, so candidates included fragments like *"2020 Scrum Guide
   removed that as a requirement."* Headings alone would have been defensible.
3. **No discrimination within a lesson.** `sprint`, `sprint-cancellation` and
   `sprint-container` share a lesson and received byte-identical candidate lists.
4. **`concepts.description` was never checked.** It exists and is written in
   plain language: *"15-minute Developer-owned event for inspecting progress
   toward Sprint Goal."* A better per-concept source than lesson prose, with no
   lesson-sharing problem.

**But the deeper finding is that match terms were the wrong fix for D3.** The 13
analytic/anti-pattern concepts are not phrased differently in a syllabus - they
are ABSENT from one. See section 1.1. Match terms remain useful for the narrow
case of a topic-grain concept whose name is analytic where a syllabus is plain;
that is a much smaller set than 99.

`scripts/emit-match-terms-sql.mjs` is built and tested. It refuses single-token
terms, terms colliding across concepts, and terms restating the name - the three
ways a term silently INFLATES a competitor's score, which is the one failure in
this engine that looks like a good result.

---

## 6. WHAT TO BUILD NEXT

1. **`concepts.grain`** - `topic` | `detail`, declared like `scope_tag`. Not a
   denominator fix: it tells the report which gaps to phrase as "you do not list
   this" versus "no syllabus lists this, here is what to teach". Different
   sentences, different sections. **Confirm the partition with Juan first** - he
   wrote the concepts.
2. **Multi-certification scan.** Loop the reader over all eleven blueprints. The
   harness can run it against the six existing fixtures immediately and answer a
   real question: does the CSM blog actually score highest against SM-AI-I, and
   does TUV's Product Owner half pull it toward SPO-AI-I? Cheap, high
   information, validates the feature on documents we already have.
3. **Task-anchored report projection.** Replace the single weighted percentage
   with the per-task rollup of section 1.3.
4. Fix `propose-match-terms.mjs` (language filter, headings only, use
   `description`) - lower priority now.
5. Edge function `analyze-curriculum` + Renderer A. **`verify_jwt = true` pinned
   explicitly** - the INVERSE of the OB3 rule, easy to get backwards.

**Blocked on a first partner existing:** Renderer B, the entitlement toggle UI,
any real test of the feature gate.

**Still open from v7.3, untouched:** the 48 unexamined item-bank hits (19 of 67
were read and cleared), the es-419/pt-BR drift rulesets, the CSM blog's 6-vs-3
drift gap, BCS EXIN's 20 unread reverse gaps, the invariant runner in CI, and the
self-match assertion in `verify-cert.mjs`.

---

## 7. THE LESSON

v7.3 said: read the artifact, the rule tells you where to look but never what you
will find.

This stretch says something else. **Four times, a number was believed instead of
inspected**, and each time the inspection reversed the conclusion:

- 19 servant-leader hits looked like contamination; reading them showed the
  content was more sophisticated than the rule.
- Drift 4 -> 5 looked like a better rule; the matched span was a section number.
- 8.9% coverage looked like a devastating competitor finding; it was a language
  artifact.
- 19% versus 49% looked like a measurement failure; it was the blueprint being
  deliberately finer-grained than a syllabus, **which is the product.**

The last one is the important one. **The gap that looked like the engine's
biggest defect turned out to be the thing worth selling.**
