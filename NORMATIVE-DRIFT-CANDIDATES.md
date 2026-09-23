# Normative drift: candidates

Generated 2026-09-23 by `scripts/check-normative-drift.mjs`. **Read-only. Nothing fixed.**

A repair written to avoid reproducing ISO can change what the clause requires. Nothing checked for it: the leak gate checks we do not reproduce, the claims verifier checks a citation resolves, neither asks whether the paraphrase still says what the clause says.

**471 repair spans examined.** Two classes are shown: a conjunction flip (and <-> or), and a self-contradiction narrowed to spans that ALSO flipped a conjunction or substituted a listed term.

| class | fires |
|---|---:|
| SELF-CONTRADICTION, narrowed | 12 |
| broad self-contradiction (not used) | 82 |
| CONJUNCTION-FLIP | 13 |
| MODAL-SHIFT | 4 |
| QUANTIFIER | 59 |
| TERM-SUBSTITUTION | 12 |

**Positive control:** both instances a human found fire — `isms-ia-04-02` (TERM-SUBSTITUTION + SELF-CONTRADICTION) and `isms-ia-04-06` (CONJUNCTION-FLIP + SELF-CONTRADICTION). The script refuses to print this list if either goes silent.

> **These are CANDIDATES.** The detector cannot read the clause. A repair that moved a modal and still reflects the standard is indistinguishable here from one that drifted.

---

**22 candidate spans.**

## AIMS-F · 01-03-the-ai-system-life-cycle

`42001 A.4 resources, clause 8` — **CONJUNCTION-FLIP**

Conjunctions: `and` 0 → 1, `or` 2 → 1

**before** · assessments at planned intervals, or when significant changes are proposed or occur

**after** · assessments at planned intervals, and again whenever a significant change is proposed or occurs

## AIMS-F · 01-03-the-ai-system-life-cycle

`42001 A.4 resources, clause 8` — **CONJUNCTION-FLIP**

Conjunctions: `and` 0 → 1, `or` 2 → 1

**before** · performed at planned intervals or when significant changes are proposed or occur.

**after** · performed at planned intervals, and again whenever a significant change is proposed or occurs.

## AIMS-F · 02-06-the-ai-system-impact-assessment

`42001 clause 6.1.4, clause 8.4, Annex B.5` — **CONJUNCTION-FLIP, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **or**

Conjunctions: `and` 0 → 1, `or` 1 → 0

**before** · assessments are performed at planned intervals, or when significant changes are proposed to occur

**after** · assessments are performed at planned intervals, and again whenever a significant change is proposed

## AIMS-F · 03-06-data-for-ai-systems

`42001 A.7 data controls` — **CONJUNCTION-FLIP**

Conjunctions: `and` 0 → 1, `or` 2 → 1

**before** · known or potential biases or other systematic errors**. Prior handling

**after** · biases known or suspected, and other systematic errors**. Prior handling

## AIMS-F · 04-01-annex-a-structure

`42001 Annex A intro, Annex B general clause` — **QUANTIFIER, TERM-SUBSTITUTION, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **required**

Modals: `must` 0 → 1, `may` 0 → 1, `can` 1 → 0

Dropped: required · Added: objective

**before** · **Not all the control objectives and controls listed are required to be used**, and the organization can design and implement its own controls.

**after** · **Not every listed control objective and control must be used**, and an organization may design and implement its own.

## AIMS-F · 05-01-aims-monitoring-and-measurement

`42001 clause 9.1, A.6.2.6` — **QUANTIFIER, TERM-SUBSTITUTION, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **ensure**

Dropped: ensure · Added: monitor

**before** · **What needs to be monitored and measured.** **The methods** for monitoring, measurement, analysis and evaluation, as applicable, to ensure valid results. **When** the monitoring and measuring is performed.

**after** · **What to monitor and measure.** **Which methods** to use for monitoring, measurement, analysis and evaluation, so far as each applies, so that the results are valid. **When** monitoring and measurement happens.

## AIMS-F · 05-02-aims-internal-audit

`42001 clauses 9.2.1 and 9.2.2` — **TERM-SUBSTITUTION, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **ensure**

Dropped: ensure · Added: objective, impartial

**before** · **Select auditors and conduct audits to ensure objectivity and the impartiality of the audit process.**

**after** · **Select auditors and run audits in a way that keeps the process objective and impartial.**

## AIMS-F · 05-02-aims-internal-audit

`42001 clauses 9.2.1 and 9.2.2` — **TERM-SUBSTITUTION, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **ensure**

Dropped: ensure · Added: objective, impartial

**before** · conducted so as to ensure objectivity and the impartiality of the audit process

**after** · conducted so that the process stays objective and impartial

## AIMS-IA · aims-ia-01-04-when-you-cannot-be-independent

`19011 clause 4.6, 42001 clause 9.2.2 b` — **TERM-SUBSTITUTION, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **ensure**

Dropped: ensure · Added: objective, impartial

**before** · **select auditors and conduct audits to ensure objectivity and the impartiality of the audit process**

**after** · **select auditors and run audits in a way that keeps the process objective and impartial**

## AIMS-IA · aims-ia-04-03-leadership-in-artifacts

`42001 clauses 5.1, 5.2, 5.3, controls A.2.2 to A.2.4` — **TERM-SUBSTITUTION, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **available**

Dropped: available · Added: open

**before** · - be **available to interested parties, as appropriate**.

**after** · - be **open to interested parties where appropriate**.

## AIMS-IA · aims-ia-04-03-leadership-in-artifacts

`42001 clauses 5.1, 5.2, 5.3, controls A.2.2 to A.2.4` — **CONJUNCTION-FLIP, TERM-SUBSTITUTION, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **ensure, review, or**

Conjunctions: `and` 1 → 2, `or` 1 → 0

Dropped: ensure, review · Added: adequate

**before** · **A.2.4, review of the AI policy** - the AI policy shall be reviewed at planned intervals or additionally as needed to ensure its continuing suitability, adequacy and effectiveness

**after** · **A.2.4, reviewing the AI policy** - it shall be reviewed at planned intervals, and at other times as needed, so that it stays suitable, adequate and effective

## AIMS-IA · aims-ia-04-04-criteria-before-assessment

`42001 clauses 6.1.2, 6.1.4, 8.2` — **CONJUNCTION-FLIP**

Conjunctions: `and` 0 → 1, `or` 2 → 1

**before** · the organization shall perform AI risk assessments at planned intervals or when significant changes are proposed or occur

**after** · the organization shall perform AI risk assessments at planned intervals, and whenever significant change is proposed or happens

## AIMS-IA · aims-ia-04-08-defined-versus-running

`42001 clauses 8.1, 8.2, 8.4` — **CONJUNCTION-FLIP**

Conjunctions: `and` 0 → 1, `or` 2 → 1

**before** · **8.2** - at planned intervals or when significant changes are proposed or occur; retain documented information of the results

**after** · **8.2** - at planned intervals, and whenever significant change is proposed or happens; retain documented information of the results

## AIMS-IA · aims-ia-04-08-defined-versus-running

`42001 clauses 8.1, 8.2, 8.4` — **CONJUNCTION-FLIP**

Conjunctions: `and` 0 → 1, `or` 2 → 1

**before** · Clause 8.2 says at planned intervals or when significant changes are proposed or occur; clause 8.4 says

**after** · Clause 8.2 says at planned intervals, and whenever significant change is proposed or happens; clause 8.4 says

## AIMS-IA · aims-ia-04-09-normative-and-should

`42001 Annex A.1, Table A.1, Annex B.1, clause 6.1.3 e), 3.26` — **QUANTIFIER, TERM-SUBSTITUTION, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **required**

Dropped: required · Added: objective

**before** · Annex A.1 records that not all control objectives and controls listed in Table A.1 are required to be used.

**after** · Annex A.1 records that not every control objective and control in Table A.1 has to be used.

## AIMS-IA · aims-ia-04-10-justifying-both-directions

`42001 clause 6.1.3 f), Annex A.1, 19011 clause 6.5.1` — **QUANTIFIER, TERM-SUBSTITUTION, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **required**

Dropped: required · Added: objective

**before** · > The controls detailed in Table A.1 provide the organization with a reference for meeting organizational objectives and addressing risks related to the design and operation of AI systems. **Not all the control objectives and controls listed in Table A.1 are required to be used, and the organization can design and implement their own controls (see 6.1.3).**

**after** · > The controls set out in Table A.1 give the organization a reference for meeting its objectives and handling risks that arise from designing and operating AI systems. **Not every control objective and control in Table A.1 has to be used, and an organization can design and implement controls of its own (see 6.1.3).**

## ISMS-IA · isms-ia-01-01-audit-parties

`27001:2022 Annex A control 5.35` — **CONJUNCTION-FLIP, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **or**

Conjunctions: `and` 0 → 1, `or` 1 → 0

**before** · to be reviewed independently at planned intervals, or when significant changes occur

**after** · to be reviewed independently at planned intervals, and whenever significant change occurs

## ISMS-IA · isms-ia-04-02-demonstrated-not-stated

`27001:2022 clauses 5.1 and 5.2` — **TERM-SUBSTITUTION, SELF-CONTRADICTION**

Still used elsewhere in the same lesson: **available**

Dropped: available · Added: open

**before** · - g) be **available to interested parties, as appropriate**

**after** · - g) be **open to interested parties where appropriate**

## ISMS-IA · isms-ia-04-06-defined-versus-running

`27001:2022 clauses 8.1, 8.2, 9.1` — **CONJUNCTION-FLIP**

Conjunctions: `and` 1 → 2, `or` 2 → 1

**before** · | 6.1.2 - define and apply a risk assessment process | **8.2** - perform assessments at planned intervals or when significant changes are proposed or occur |

**after** · | 6.1.2 - define and apply a risk assessment process | **8.2** - perform assessments at planned intervals, and whenever significant change is proposed or happens |

## ISMS-IA · isms-ia-04-06-defined-versus-running

`27001:2022 clauses 8.1, 8.2, 9.1` — **CONJUNCTION-FLIP**

Conjunctions: `and` 0 → 1, `or` 2 → 1

**before** · at planned intervals **or when significant changes are proposed or occur**. Two triggers.

**after** · at planned intervals **and whenever significant change is proposed or happens**. Two triggers.

## ISMS-IA · isms-ia-04-06-defined-versus-running

`27001:2022 clauses 8.1, 8.2, 9.1` — **CONJUNCTION-FLIP**

Conjunctions: `and` 0 → 1, `or` 2 → 1

**before** · Clause 8.2 requires risk assessments at planned intervals OR when significant changes are proposed or occur.

**after** · Clause 8.2 requires risk assessments at planned intervals, AND whenever significant change is proposed or happens.

## ISMS-IA · isms-ia-04-06-defined-versus-running

`27001:2022 clauses 8.1, 8.2, 9.1` — **CONJUNCTION-FLIP**

Conjunctions: `and` 0 → 1, `or` 2 → 1

**before** · Assessments at planned intervals or when significant changes are proposed or occur; the migration

**after** · Assessments at planned intervals, and whenever significant change is proposed or happens; the migration
