# BOK-AIMS-F.md — Body of Knowledge decision

**Stage:** 1 of `CERT-CREATION.md`
**Status:** DRAFT — awaiting Juan's sign-off. No JTA work begins until this is signed.
**Date:** 2026-08-06
**Sources verified live:** 2026-08-06. Third-party facts age out at six months.

---

## 1. The decision

| | |
|---|---|
| Credential name | **ISO/IEC 42001 Foundation** |
| Code | `AIMS-F` |
| **UUID** | **`de046fa6-e627-48c1-85d8-9df226d144f4`** — generated, not patterned. The repeating-digit convention was retired at cert #8 (`CERT-SCHEMA-GUIDE` §7) |
| Tier | **Level I** — single-correct-answer, MCQ, Bloom ceiling `4_analyze` |
| Family | **`governance-service-management`** — verified live 2026-08-06 |
| **`sort_order`** | **3.** AIGRM-I holds 1, AISM-I holds 2. Leaves 4 and 5 for AIMS-IA and AIMS-LI so the ladder sits contiguous. **Do not renumber the live rows** |
| Ladder position | Rung 1 of the 42001 ladder. `AIMS-IA`, `AIMS-LI` follow at Level II; `AIMS-LA` is Level III and blocked on simulation assessment |

**Why this family and not a new one.** The existing tagline — *"Governing, running,
and assuring enterprise AI — responsibly, and by design"* — describes 42001 more
literally than it describes either current occupant. Founding a seventh family for
one cert would also have created a fourth broken `FamilyContent` entry before it
created anything else (HANDOFF v5.4 §8 item 7).

**No `- AI` suffix.** The naming rule locked in HANDOFF v5.2: AI enters a credential
name only when the base subject is not already AI. `ISO/IEC 27001 Foundation - AI`
takes it because 27001 is not an AI standard. `ISO/IEC 42001 Foundation` does not —
it is redundant, and it breaks the search string a buyer actually types.

---

## 2. Positioning, and the claim the JTA must serve

### 2.1 The accreditation picture — verified, and it is the ISMS-F picture again

PECB operates an ISO/IEC 42001 Lead Implementer scheme under its IAS (PCB-111) and
UKAS 17024 accreditation. Of the three bodies running a 42001 Lead Implementer
scheme at scale — PECB, BSI Training Academy, Exemplar Global — PECB is the only
one whose personnel scheme is 17024-accredited.

**The accredited schemes sit at the upper tiers. Foundation is the tier that is
not accredited anywhere.** This is the same asymmetry that made ISMS-F a clean
entry, and the argument transfers: *true, precise, and it says nothing about our
own accreditation.*

> **Correction on the record.** An earlier position in this thread held that 42001
> was open whitespace because the standard is young. That is wrong at LI and LA.
> It is right about accreditation at Foundation, but for the ordinary reason.

### 2.1a The Foundation tier is unaccredited but NOT empty

**CertiProf already ships the full 42001 ladder in Spanish** — verified 2026-08-06:

| Credential | Note |
|---|---|
| ISO 42001 Foundation (`I42001F`) | Market guides place it at $150–300 |
| ISO 42001 AI Governance Fundamentals (`I42001AIGF`) | **Exam is free**; you pay only for the certificate and badge |
| ISO 42001 Internal Auditor (`I42001IA`) | |
| ISO 42001 Lead Auditor (`I42001LA`) | Launched 18 June 2026, en + es, via their ATP network. 60 min / 40 items |

Not a competitor to discover later. The `22222222` stub UUID in `CERT-SCHEMA-GUIDE`
is labelled CertiProf-era.

**Consequence: the entry is unaccredited and CROWDED, not unaccredited and empty.**
Two differentiators previously claimed in §2.3 do not survive this and have been
struck. Read §2.3 as revised, not as first drafted.

**The counter-evidence that matters more.** A 2026 market guide describes the
common practitioner path as *ISO 27001 Lead Implementer → ISO 27001 Lead Auditor →
ISO 42001 Lead Implementer*. The market already treats 42001 as a step taken **from**
27001. That is §2.3.1's thesis, confirmed by parties selling against us.

### 2.2 What AIMS-F claims

> Competence in the ISO/IEC 42001 AI management system: its clause requirements,
> its Annex A controls, the AI impact assessment it requires, and the route to
> certification.

Never *equivalent to*, never *accredited*, never *prepares you for the PECB exam*.
`CERT-CREATION.md` §4 gate 6 governs: the standard's number is nameable because a
public standard is teachable by anyone; a competitor's branded programme is not.

### 2.3 The differentiator problem, which is genuinely new here

**Every prior Certidemy cert weaves AI into a non-AI subject.** That weave *is* the
differentiator, and the honesty firewall governs it: AI content appears only where
a practitioner genuinely does something differently.

**42001 inverts this. AI is already the subject.** There is no weave to add, and
inventing one would be the exact dishonesty the firewall exists to prevent. So the
differentiator has to come from somewhere else, and it must be named here rather
than discovered at lesson-authoring time.

Revised after the §2.1a competitive check. In descending order of durability:

1. **Integrated with 27001, because that is how 42001 is actually implemented.**
   The team standing up an AIMS is usually the team already running an ISMS, and
   42001 shares the Harmonised Structure with 27001 clause for clause. Certidemy
   is the only body that can teach the integration from *both* sides, because
   ISMS-F exists and is live. **This is the strongest and most defensible
   differentiator. It now carries nearly all the weight, and it must shape the
   JTA rather than sit in marketing copy.**
2. **Rigour, and specifically the published blueprint.** Against an accredited body
   this is a polite argument. Against a 40-item exam with no published blueprint,
   no coverage proof and no computed cognitive profile it is the entire pitch.
   *"The blueprint is public — check it yourself"* was written for exactly this
   comparison. Everything behind it is provable by query: `v_coverage_summary`,
   the firewall count, `v_cognitive_profile`, cue-neutrality.
3. **Currency — real, and expiring.** The EU AI Act compliance calendar changed on
   29 June 2026 (§4.2). Any 42001 courseware authored before that date now teaches
   a wrong timeline. Worth perhaps twelve months. **Do not build the positioning on
   it**, but let it drive launch timing.

### STRUCK — do not use these as differentiators

- ~~**Trilingual, LATAM-first delivery.**~~ Partly matched: CertiProf ships en + es
  through an ATP network. **pt-BR at full parity may still be a genuine gap — but it
  is UNVERIFIED and must not be claimed until checked.**
- ~~**Free courseware.**~~ "Free" alone is no longer a sentence: CertiProf gives the
  *exam* away and charges for the badge. Certidemy gives the *courseware* away and
  charges for the exam. **Ours is the better shape for a university channel** — a
  convenio can put the whole course in front of a cohort at no cost — but the
  argument must be made on that specific shape, never on the word *free*.

### 2.4 Out of scope, stated so the JTA does not drift into it

- Implementing an AIMS end to end — that is `AIMS-LI`
- Auditing an AIMS — `AIMS-IA` / `AIMS-LA`
- Model-level technical practice: fairness metrics, red-teaming, evaluation
  methodology, MLOps. 42001 is a management system; it does not specify these
- Legal advice on the EU AI Act. The Act is taught as **context and driver**, never
  as a compliance opinion
- Certification of an *organization*. AIMS-F certifies a person

---

## 3. Foundational sources

### 3.1 Primary — the standard

| Source | Status | Use |
|---|---|---|
| **ISO/IEC 42001:2023** | First edition, 2023-12, 51 pp. JTC 1/SC 42. **Still the current edition** | The spine: clauses 4–10, Annex A (38 controls in 9 objectives), Annexes B–D |
| **EN ISO/IEC 42001:2026** | Approved by CEN 13 Mar 2026, **endorsed without any modification**. 34 national bodies bound to implement | Citation designation only. Technically identical — see §5 |
| **ISO/IEC 42006:2025** | Published | Requirements for bodies auditing and certifying an AIMS. Owns the D5 certification-process content and explains what accredited certification means |

### 3.2 Supporting ISO standards — VERIFIED 2026-08-06, locked

| Source | What it gives | Status |
|---|---|---|
| **ISO/IEC 22989:2022** | AI concepts and terminology | Published. **Amendment 1 (generative AI) under development** — volatility item |
| **ISO/IEC 23894:2023** | AI risk management guidance | Published |
| **ISO/IEC 5338:2023** | AI system life cycle processes | Published |
| **ISO/IEC 42005:2025** | AI system impact assessment | Published. First edition, 39 pp, JTC 1/SC 42 |

Two care notes for authors:

- **42005 is an International Standard, not a Technical Report.** At least one
  secondary source calls it a TR. It is guidance rather than requirements, but the
  ISO and IEC catalogue entries list it as an IS. Do not let the TR error into a
  lesson.
- **Cite the year, not the month.** Secondary sources report 42005's publication as
  April, May and June 2025. `ISO/IEC 42005:2025` is the citable form.

### 3.3 Non-ISO

- **NIST AI RMF 1.0** — already taught in AIGRM-I; use the same treatment for
  consistency across the catalogue
- **EU AI Act (Regulation (EU) 2024/1689)**, as amended by the Digital Omnibus on AI
- **ISO/IEC 27001:2022** — owned. Carries the whole §2.3.1 integration story
- **ISO/IEC 17024:2026** — our own framework, already pinned across 35 file
  occurrences and 8 database rows

---

## 4. Substance — what makes 42001 different from 27001

The JTA has to teach these as the departures they are. A candidate arriving from
ISMS-F will otherwise map 42001 onto the ISMS model and get it wrong.

### 4.1 The five real departures

1. **Impact assessment, not just risk assessment.** 27001 assesses risk *to the
   organization*. 42001 additionally requires assessment of impact *on individuals
   and on society*. This is the signature departure and the one most likely to be
   flattened by an author with 27001 reflexes.
2. **Role-based obligations.** One organization can simultaneously be a provider,
   a developer and a user of AI systems, and its obligations differ by role.
   No 27001 analogue.
3. **The AI system lifecycle** is a first-class object in a way the information
   asset is not.
4. **Data for AI systems** — provenance, quality, preparation — is a control theme
   in its own right.
5. **Transparency to interested parties and human oversight** are management-system
   requirements that map directly onto EU AI Act Articles 50 and 14. This is where
   the standard and the regulation actually touch.

### 4.2 The regulatory context, verified 2026-08-06

The Digital Omnibus on AI was endorsed by the European Parliament on 16 June 2026
and given final approval by the Council on 29 June 2026:

| Date | What applies |
|---|---|
| **2 August 2026** | Article 50 transparency obligations — **live now**, not deferred |
| **2 December 2026** | Art. 50(2) reaches systems already on the market; new Art. 5 prohibitions |
| **2 December 2027** | High-risk obligations, standalone Annex III (was 2 Aug 2026) |
| **2 August 2028** | High-risk obligations, Annex I embedded systems |

**Volatile. Named as a re-verification trigger in §6.** Teach the *shape* of the
obligations and the fact that the calendar has already moved once; treat specific
dates as content with an expiry.

### 4.3 Domain sketch — five domains, parallel to ISMS-F

Weights are **Stage 2**, not Stage 1. This fixes scope only.

| | Domain | Owns |
|---|---|---|
| D1 | AI management systems and the AI landscape | What an AIMS is and why; terminology; roles; the AI system lifecycle; the regulatory drivers |
| D2 | Context, leadership and planning (clauses 4–6) | Scope, interested parties, AI policy, objectives, risk assessment **and impact assessment** |
| D3 | Support and operation (clauses 7–8) | Resources, competence, documented information, operational planning, lifecycle management, third parties |
| D4 | Annex A controls | 38 controls, 9 objectives, the Statement of Applicability |
| D5 | Performance evaluation, improvement and certification (clauses 9–10) | Monitoring, internal audit, management review, nonconformity, the certification route, ISO/IEC 42006 |

The 27001 integration (§2.3.1) is **woven through D2–D5**, not a sixth domain. Same
architecture decision ISMS-F made for its AI weave, and made for the same reason: a
bolt-on module is a smaller product than a distributed one.

### 4.4 Two Stage-2 constraints, accepted from external review

**Impact assessment and risk assessment get a task PAIR in D2, not one task.** A
candidate arriving from ISMS-F will map 42001's impact assessment onto 27001's risk
model and flatten the difference. Forcing the separation across two tasks makes the
distinction assessable rather than merely stated. **This is the signature cognitive
trap of the credential** and the JTA must be built to catch it.

**D4 teaches Annex A as structure and selection reasoning, not as a survey of 38
controls.** Same decision ISMS-F made for its 93 — four themes, not 93 tasks. A
control-per-task JTA inflates the task count, wrecks the items-per-task ratio (below)
and teaches recall where the standard wants judgment.

### 4.5 Exam form and sampling — RULED, from live evidence

**The items-per-task ratio does not govern anything and is not the constraint.**
ISMS-F's 0.82 is the lowest in the catalogue and prompted an external
recommendation of a ≥0.9 floor. Checking the live blueprint showed the alarm was
misplaced — ISMS-F allocates **6 / 7 / 9 / 11 / 7 items across its five domains on
a 40-item form.** No domain below six. The blueprint is well-formed where
blueprints are actually judged.

| ISMS-F domain | weight | tasks | items on form |
|---|---|---|---|
| D1 Fundamentals and threat landscape | 15.0% | 7 | 6 |
| D2 Context, leadership, scope, policy | 17.5% | 9 | 7 |
| D3 Risk assessment and treatment | 22.5% | 11 | 9 |
| D4 Annex A controls | 27.5% | 13 | 11 |
| D5 Evaluation, improvement, certification | 17.5% | 9 | 7 |

**The ruling:**

1. **Form length: 40 items.** Same as ISMS-F, and matched to a Foundation whose
   surface is genuinely smaller than 27001's — 51 pages, 38 Annex A controls
   against 93.
2. **Floor: no domain below 6 items on the form**, i.e. **no domain weighted
   below 15%.** This is the real constraint. It is a blueprint rule, not a
   ratio, and it is the one a scheme auditor can evaluate.
3. **Task count falls out of teaching need, not arithmetic.** With D4 taught as
   structure rather than a 38-control survey (§4.4), ~32–38 tasks is the natural
   landing. Do not pad the JTA to move a ratio, and do not thin it either.

**Disclosure owed in `SCHEME-AIMS-F.md`.** A six-item domain **cannot carry a
diagnostic subscore.** 17024 requires the examination to sample the JTA and the
*pass decision* to be reliable — whole-form reliability governs that. But if the
score report shows per-domain feedback, six items is noisy and must be presented
as directional, never as a competence finding at domain level. **ISMS-F has the
same exposure today and the same sentence is owed there.**

---

## 5. Rules inherited from ISMS-F

Every one of these exists because something went wrong first. All apply here.

- **§1 explain, never define.** ISMS-F shipped its first module with five
  near-verbatim ISO definitions, and the external review asked for *tighter*
  alignment with ISO's wording. A definition is normative text and is *more*
  exposed than a paraphrased clause because it is recognisable on sight.
- **`Clause` in English only.** Rule 17: es-419 splits `capítulo` / `apartado`;
  pt-BR uses `Seção`. The renderings must never leak back into English.
- **American spelling**, per the 348-to-14 count across the shipped catalogue.
  `item-pipeline.mjs` has no dialect instruction and defaults to American, so any
  cert authored in British English collides silently at first item generation.
- **Read the first generated batch before scaling it.** `MAX_TASKS=1`, read eight
  items. This rule paid for itself twice on the day it was written.
- **Glossary markup frozen in both directions** in `translate-lessons.mjs`.
- **A citation rule is owed, as it was for 27000, and the pressure is already
  visible.** ISMS-F ruled that no lesson cites ISO/IEC 27000 as a definitional
  source. The external review of this document recommended using ISO/IEC 22989 as
  the *"terminology baseline"* — which, taken literally, is the thing that rule
  forbids. **Decide the 22989 analogue before D1 is authored.** The likely ruling:
  22989 informs our vocabulary, is never cited as the authority for a definition,
  and no definition is reproduced. Same posture, same reason — a definition is
  normative text and is recognisable on sight.

---

## 6. Volatility register

| Item | Risk | Re-verify when |
|---|---|---|
| EU AI Act calendar | **High.** Already moved once by sixteen months | Before lock; before publish; every 6 months |
| ISO/IEC 42001 edition | Low. First edition, no amendment | Before lock |
| EN ISO/IEC 42001:2026 designation | Low, but new since May 2026 | Before lock |
| ISO/IEC 42005 / 5338 / 23894 / 22989 | **Verified and locked 2026-08-06** | Before publish |
| **ISO/IEC 22989 Amendment 1 (generative AI)** | Medium. Under development. Would change the terminology baseline | Before lock; every 6 months |
| Accredited 42001 personnel schemes | Medium. PECB accredited at LI; Foundation tier unaccredited | Before any claim copy ships |
| **CertiProf's 42001 ladder** | **High — four rungs shipped, en + es, ATP network in LATAM.** Their pt-BR coverage is UNVERIFIED | **Before Stage 2, and before any comparative copy** |
| Brazil PL 2338 | Medium. Already a named trigger for AIHR-I Domain 2 | Same cadence |
| Accredited 42001 certification bodies | Medium — the list is growing | Only if named in content; prefer not naming |

---

## 7. Open before Stage 2

1. ~~Query `cert_categories`.~~ **Resolved 2026-08-06.**
   `governance-service-management`, `sort_order` 3. Live roster is six families:
   `scrum` (1), `ai` (2), `agile-frameworks` (3),
   `governance-service-management` (4), `ai-workplace` (5), `ai-security` (6).
   **`CERT-SCHEMA-GUIDE` §1 line 83 named four and the wrong slug for the fourth
   — patched in the same session.**
2. ~~`sort_order` within the family.~~ **Resolved: 3**, leaving 4 and 5 for the
   Level II rungs.
3. **AIGRM-I discrimination copy, three languages, reciprocal.** HANDOFF v5.2 §3.2
   ruled AIGRM-I is *not* a 42001 Foundation — one task on 42001, no clause
   machinery, market analogue IAPP's AIGP. They will now sit at positions 1 and 3
   of the same family, which is exactly where a buyer must tell them apart in one
   line:
   > **AIGRM-I** certifies the AI governance and risk practitioner's body of
   > knowledge — framework-independent.
   > **AIMS-F** certifies one standard: ISO/IEC 42001.
4. ~~UUID convention.~~ **Resolved.** `CERT-SCHEMA-GUIDE` §7 line 271 already
   records the repeating-digit convention as retired at cert #8; lines 301–302 are
   a historical table, not an instruction. **A cached copy of an older revision was
   read as current and the guide was wrongly called stale on this point.** AIMS-F
   takes a generated UUID because the guide says to, not despite it.
5. ~~Verify the four supporting ISO standards.~~ **Done 2026-08-06, locked.**
6. **Citation rule for ISO/IEC 22989**, per §5. Now more urgent — the review
   recommended the forbidden posture.
7. **Verify CertiProf's pt-BR coverage** before pt-BR parity is claimed anywhere.
8. **Decide task count against form length** (§4.5) at the start of Stage 2, not
   after the blueprint computes.

---

## 8. Sign-off

**Stage 1 gates on Juan.** An external reviewer recommended signing; that is a
verdict, not the gate. `CERT-CREATION.md` Stage 1 names one signatory.

- [ ] **§2.1a competitive reality accepted** — the entry is unaccredited and
      crowded. This is the material change from the first draft
- [ ] Revised differentiator ruling (§2.3) accepted: **27001 integration primary,
      rigour second, currency third; trilingual and free-courseware STRUCK**
- [ ] Scope and out-of-scope (§2.4, §4.3) accepted
- [x] Source list (§3) — verified and locked 2026-08-06
- [ ] §4.4 constraints accepted: the D2 task pair, D4 as structure not survey
- [x] §4.5 ruled: 40 items, **≥6 items per domain (≥15% weight)**, task count from
      teaching need. Subscore disclosure owed in the scheme doc
- [x] Family `governance-service-management`, `sort_order` 3, UUID
      `de046fa6-e627-48c1-85d8-9df226d144f4`
- [ ] §7.6 — the ISO/IEC 22989 citation rule, written down before D1

---

*Stage 1 of `CERT-CREATION.md`. Next: Stage 2 — author `AIMS-F_JTA_v1.md`,
domains with weights summing to 100, tasks with stable codes, concepts per task.
Then Stage 3, external review, which is a gate.*
