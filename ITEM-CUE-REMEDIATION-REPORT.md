# Item-Quality Control Report — Answer-Cue Detection and Remediation

**Scheme owner:** Certidemy (the certification body)
**Applies to:** SM-AI-I (Scrum Master I — AI), SPO-AI-I (Scrum Product Owner I — AI)
**Pools covered:** Secure (examination) and Practice (learning), all three languages (en, es-419, pt-BR)
**Document version:** 1.0
**Status:** Closed remediation; preventive control active
**Last updated:** June 2026

---

## About this document

This is an internal item-quality control record. It documents a defect found in
the assessment item bank, how it was measured, how it was corrected, and the
standing control now in place to prevent recurrence. It is written as audit
evidence: ISO/IEC 17024 requires a certification body to have a documented policy
for when an item is found to be poorly performing and what corrective action is
taken, and the 2026 revision adds explicit expectations where AI tooling is used
in examination development. This report is the worked instance of both.

Consistent with the body's posture, it is honest about scope: what was fixed is a
*mechanically detectable* item-writing flaw. It is **not** a substitute for
subject-matter-expert (SME) review or for psychometric validation against live
candidate data, both of which remain pending and are named as such in the scheme
documents.

---

## 1. What was detected

A review of the multiple-choice item bank found that the correct answer could be
identified at well above chance **without knowing the content**, through three
independent surface cues:

1. **Length cue** — the correct option tended to be the longest of the four.
2. **Position cue** — the correct option's letter was disproportionately "b".
3. **Semantic cue** — the correct option tended to be the most developed,
   "balanced / inspect-and-adapt"–worded option, while distractors clustered the
   rigid or absolute phrasings.

For a four-option item, an uninformed candidate guessing by any single heuristic
should succeed about 25% of the time. The bank deviated sharply from that.

### Measurement method

The analysis is reproducible from the item store and uses no candidate data
(it is an *a-priori* item-writing-flaw screen, distinct from the post-hoc item
statistics that require live candidates):

- **Length:** for each single-choice item, compare the character length of the
  keyed option against the longest distractor; report the share of items where
  the key is strictly the longest ("strictly-longest %"). Chance ≈ 25%.
- **Position:** for each item, tabulate the correct option's letter; report the
  distribution across a/b/c/d. Chance ≈ 25% each.

### Baseline (pre-remediation)

Length — share of items where the key is strictly the longest:

| Pool | SM-AI-I | SPO-AI-I |
|---|---|---|
| Secure | ~80% | ~83% |
| Practice | ~72% | ~80% |

Position — share of items keyed to each letter (aggregate, illustrative):

| Pool | a | b | c | d |
|---|---|---|---|---|
| Secure | ~11% | ~74% | ~15% | ~0.2% |
| Practice | ~5% | ~70% | ~24% | ~1% |

The position skew was severe enough that "always answer b" alone scored ~74% on
the secure examination, and "always pick the longest" scored ~82% — both at or
above the 80% pass mark. The defect was therefore treated as launch-blocking.

**Exposure assessment.** At the time of detection the body had issued no live
credentials and held only test data. No issued credential was affected; no
candidate passed via these cues. The matter was a content-quality defect, not an
integrity breach, and was corrected before launch.

---

## 2. Remediation

Remediation proceeded in two tiers.

### Tier 1 — deterministic position de-bias (in place, no regeneration)

A re-runnable control reshuffled each item's option order and relabelled the
option ids so the correct answer lands in a uniformly random position. The
transform is structural and correctness-preserving (the correct *text* is tracked
through the permutation), and it is applied per item-group so all three languages
of a logical item stay aligned. Approximately **4,470 item rows** across both
certs and both pools were de-biased in place. Because option-letter references in
explanations would otherwise go stale, the same control remaps any such reference
through the permutation.

This collapsed the position cue from ~70–80% on "b" to ~25% across a/b/c/d.

### Tier 2 — full regeneration under a quality pipeline

The length and semantic cues cannot be corrected without rewriting item text, so
the single-choice items were regenerated through a new generation pipeline (§3)
and re-measured. Position de-bias and the explanation-reference fix are built into
that pipeline, so regenerated items are clean on all three cues by construction.

---

## 3. The preventive control (standing)

New items are produced by a version-controlled pipeline whose stages exist
specifically to remove the cues at their source rather than mask them:

1. **Misconception sourcing** — for each assessable task, the real misconceptions
   a candidate holds are enumerated first, so distractors are genuine wrong mental
   models rather than throwaway options. (Substantive distractors are the root
   cause cure: when distractors are as real as the key, length parity follows
   naturally.)
2. **Parallel-option drafting** — items are drafted with all four options matched
   in structure, specificity and length, each distractor anchored to a sourced
   misconception.
3. **Hostile critique-and-revise** — a separate adversarial review pass checks
   each item against an item-writing-flaw checklist (any answer cue; more than one
   defensible answer; weak or throwaway distractors; triviality or trickery;
   unclear stems; letter references in explanations) and repairs or rejects.
4. **Structural guards** — a final automated net: a length-parity gate, an
   absolute-word-clustering check, deterministic position shuffling, and
   explanation-reference remapping. Items that fail the parity gate are sent to a
   targeted normalization step that evens option lengths (repair, not discard),
   and are dropped only if repair fails.

The guard thresholds are configuration, recorded with the control: a maximum
option-length spread, and a small allowed margin by which the key may exceed its
longest distractor (set so the key may be marginally longest but never
dominantly — avoiding a "never the longest" reverse cue).

This pipeline is the body's standing item-development control and is the default
for all future schemes.

---

## 4. Outcome (post-remediation)

Length — share of items where the key is strictly the longest (single-choice, en;
the other languages inherit the en structure):

| Pool | SM-AI-I | SPO-AI-I |
|---|---|---|
| Secure | 36.7% | 38.5% |
| Practice | 34.0% | 38.2% |

Position — correct-option letter distribution is restored to ~25% per letter
(within normal sampling variation at these item counts), on both pools and both
certs.

Other checks: explanations contain **zero** option-letter references; every
regenerated practice item resolves to its concept links (no orphaned items, so
the learning engine can surface all of them); the secure/practice firewall is
intact (secure items carry no concept links and remain unreachable from study).

**Interpretation, stated honestly.** The length cue has been reduced from ~72–83%
to the mid-to-high 30s — from a dominant, trivially exploitable signal to a mild
residual near the practical floor of what automated length control can achieve.
The position cue is removed. The residual above 25% is largely the *semantic*
tendency for the correct answer to be the most defensible-sounding option, which
is partly inherent to the subject matter and is the province of SME review rather
than an automated control. The bank is now **mechanically cue-neutral** — the bar
an external party can directly test — and is not represented as more than that.

---

## 5. Mapping to ISO/IEC 17024

- **Flagged-item policy and corrective action.** This report is the documented
  detection-and-correction process the standard expects when an item or
  examination is found to be poorly performing: the defect, the measurement, the
  per-pool before/after, the remediation, and the preventive control.
- **Validity and fairness.** Removing cues that let a candidate succeed without
  competence directly serves examination validity and fairness.
- **AI in examination development (2026 revision).** Item drafting uses AI tooling;
  this is the corresponding bias-validation evidence — the body identified a
  systematic bias introduced in AI-assisted development, measured it, corrected
  it, and installed an adversarial-review-plus-structural-guard control with human
  oversight over the result.

## 6. Genuinely pending (named, not implied as done)

- SME-panel validation of the item bank and the job-task analysis.
- Psychometric validation (item difficulty and discrimination, form reliability)
  against live candidate response data, including the standard-setting study for
  the cut score.

These remain the real validators and are the reason the credential is positioned
as *built to the ISO/IEC 17024 framework / audit-ready by design*, not as
accredited.

---

*End of report — Item-Quality Control: Answer-Cue Remediation v1.0.*
