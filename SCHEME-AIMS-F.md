# SCHEME-AIMS-F.md — Certification Scheme

**Credential:** ISO/IEC 42001 Foundation
**Code:** `AIMS-F` · **UUID:** `de046fa6-e627-48c1-85d8-9df226d144f4`
**Certification body:** Certidemy, operated by RC Capital Partners LLC
**Framework:** built to **ISO/IEC 17024:2026**, *Conformity assessment — General
requirements for bodies operating certification of persons*
**JTA:** `AIMS-F_JTA_v1.3.md` · **BoK:** `BOK-AIMS-F.md`
**Version:** 1.0 · **Date:** 2026-08-06 · **Status:** scaffolded, not yet published

---

## 1. Accreditation status — stated plainly

**Certidemy is not accredited to ISO/IEC 17024.** This scheme is *built to* the
framework: the competence declared here is derived from a job-task analysis,
taught, assessed against that analysis, and published so that the claim can be
compared with the measurement. Accreditation is a separate assessment by a third
party, and Certidemy is working toward it.

No statement in this document, in the catalogue, or on any issued credential
asserts or implies accreditation, nor equivalence to any accredited programme.

---

## 2. Scope of certification

> Competence in the ISO/IEC 42001 AI management system: its clause requirements,
> its Annex A controls, the AI system impact assessment it requires, and the route
> to certification.

### What this credential does not certify

- Ability to **implement** an AI management system end to end — that is a Lead
  Implementer scope
- Ability to **audit** an AI management system — Internal Auditor or Lead Auditor
- Model-level technical practice: fairness metrics, evaluation methodology,
  red-teaming, MLOps. ISO/IEC 42001 is a management system standard and does not
  specify these
- Legal advice on the EU AI Act. The Act is taught as context and driver
- Certification of an **organization**. AIMS-F certifies a person

---

## 3. The competence claim, and what measures it

ISO/IEC 17024 requires that the certification scheme define competence, that the
examination assess that defined competence, and that what is published match what
was measured. The chain here is:

| | |
|---|---|
| Competence declared | `AIMS-F_JTA_v1.3.md` — 5 domains, 35 tasks, 154 concepts |
| Taught by | 35 lessons across 5 modules, in en, es-419 and pt-BR |
| Measured by | a 40-item examination, blueprinted from the JTA by domain weight |
| Proven by | `v_coverage_summary` reports `untaught_testing_violations = 0`: every concept tested is taught |

**The blueprint is public.** Anyone can compare the published claim against the
declared tasks and the exam allocation.

---

## 4. Examination specification

| | |
|---|---|
| Format | Multiple choice, single correct answer |
| Items | 40 |
| Duration | 60 minutes |
| Pass mark | 80% (32 of 40) |
| Delivery | Online, closed book |
| Eligibility | Open. No prerequisite, no experience requirement |
| Language | English, Latin American Spanish (es-419), Brazilian Portuguese (pt-BR) |
| Validity | 365 days from issue, based on the content re-review cadence |

### Blueprint

| Domain | Weight | Items |
|---|---|---|
| D1 AI management systems and the AI landscape | 15.0% | 6 |
| D2 Context, leadership and planning | 22.5% | 9 |
| D3 Support and operation | 20.0% | 8 |
| D4 Annex A controls: structure and selection | 25.0% | 10 |
| D5 Performance evaluation, improvement and certification | 17.5% | 7 |
| **Total** | **100.0%** | **40** |

**Design floor: no domain carries fewer than 6 items.** The constraint is stated
per domain rather than as an items-per-task ratio, because a domain is the unit a
sampling claim must actually hold for.

### Cognitive profile

Assessed at the level the task is performed, never at a difficulty curve. A
database trigger rejects any item whose Bloom level does not match its task.

| Level | Tasks | Share |
|---|---|---|
| `2_understand` | 17 | 48.6% |
| `3_apply` | 14 | 40.0% |
| `4_analyze` | 4 | 11.4% |

**No recall-only tasks.** This is structural rather than stylistic: ISO/IEC 42001
clause 2 makes ISO/IEC 22989:2022 a normative reference and clause 3 delegates
terminology to it, so there is no definition of *AI system* inside 42001 to
recite. The ceiling is `4_analyze`, which is the honest limit of a
single-correct-answer format.

---

## 5. Disclosures

**5.1 Domain subscores are directional, not diagnostic.** The thinnest domain
carries 6 items. Whole-form reliability governs the pass or fail decision; any
per-domain feedback on a score report is indicative and must not be read as a
finding of competence at domain level.

**5.2 The pass mark is expert judgment, not yet data-informed.** 80% was set by
criterion-referenced expert judgement before any candidate had taken the
examination. A standard-setting study using candidate performance data is owed
once volume permits, and this section will be revised when it exists.

**5.3 Item statistics do not yet exist.** No difficulty or discrimination indices,
no distractor analysis. These follow candidate volume.

**5.4 Subject-matter expert review is by an external AI reviewer, not an
independent SME panel.** The job-task analysis was reviewed against the text of
ISO/IEC 42001:2023 at Stage 3, which improved its factual accuracy. **It is not
the independent panel validation that ISO/IEC 17024 contemplates**, and it is not
described as such. An SME panel is owed.

**5.5 Third-party standards are named as subject matter, never as endorsement.**
ISO/IEC 42001, 42005, 42006, 22989, 23894, 5338, 27001 and 17021-1 are public
standards, nameable by anyone teaching them. **No relationship with ISO, IEC or
any accreditation body is claimed or implied**, and no normative text is
reproduced.

---

## 6. Position relative to other credentials

**This is a Foundation credential and does not substitute for a Lead Implementer or
Lead Auditor certification.** Bodies holding ISO/IEC 17024 accreditation operate
schemes at those tiers. Where this credential differs is subject matter, not tier
substitution: it teaches ISO/IEC 42001 **alongside ISO/IEC 27001**, because
Annex D.2 of the standard states that integration with other management system
standards is essential and names ISO/IEC 27001 first — and because the team
standing up an AI management system is usually the team already running an
information security management system.

Three of the four analyze-level tasks concern that integration.

---

## 7. Maintenance

| Trigger | Action |
|---|---|
| ISO/IEC 42001 amended or revised | Full content re-review; JTA version bump |
| ISO/IEC 22989 Amendment 1 published | Review terminology; 22989 is a normative reference |
| EU AI Act timetable changes | Review D1 and D4 content. **Already amended once**, in June 2026 |
| ISO/IEC 42006 revised | Review task 5.5 |
| Annual, regardless | Content re-review; this is the basis of the 365-day validity |

---

## 8. Complaints and appeals

Candidates may appeal an examination result or complain about the conduct of an
examination by contacting Certidemy. Appeals are reviewed by a person not involved
in the original decision. **No appeal has yet been filed; the process is untested
in practice.**

---

*Certidemy is a certification body operated by RC Capital Partners LLC, part of
CertiGlobal. Built to ISO/IEC 17024:2026. Not accredited.*
