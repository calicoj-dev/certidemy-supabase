# BOK-AIMS-F.md — Body of Knowledge decision

**Stage:** 1 of `CERT-CREATION.md`
**Status:** **SIGNED OFF 2026-08-06.** Stage 2 open.
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

**At least one competitor already ships a full 42001 ladder in Spanish** —
four rungs including Foundation, Internal Auditor and Lead Auditor, en + es via
an ATP network. Verified 2026-08-06; provider detail removed. **Re-verify before
any comparative copy.**

Not a competitor to discover later.

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

1. **Integrated with 27001, because that is how 42001 is actually implemented —
   and the standard says so.** **Annex D.2 states that integration of the AIMS
   with generic or sector-specific management system standards is essential for
   responsible development and use of an AI system, names ISO/IEC 27001 first,
   and notes that because both use the harmonised structure their integrated use
   is facilitated and of great benefit — with information-security-related
   controls implementable through the organization's existing 27001.** This is no
   longer an inference from market behaviour; it is a citation. Certidemy is the
   only body that can teach the join from *both* sides, because ISMS-F exists and
   is live. **It now carries nearly all the weight, and it must shape the JTA
   rather than sit in marketing copy.**
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

- ~~**Trilingual, LATAM-first delivery.**~~ Partly matched: at least one competitor
  ships en + es through an ATP network. **pt-BR at full parity may still be a
  genuine gap — but it is UNVERIFIED and must not be claimed until checked.**
- ~~**Free courseware.**~~ "Free" alone is no longer a sentence: a competitor gives
  the *exam* away and charges for the badge. Certidemy gives the *courseware* away and
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
| **ISO/IEC 42001:2023** | First edition, 2023-12, 51 pp. JTC 1/SC 42. **Still the current edition** | The spine: clauses 4–10, Annex A (**38 controls in 9 categories, A.2–A.10, carrying 10 stated objectives** — A.6 splits into A.6.1 and A.6.2), Annexes B–D |
| **EN ISO/IEC 42001:2026** | Approved by CEN 13 Mar 2026, **endorsed without any modification**. 34 national bodies bound to implement | Citation designation only. Technically identical — see §5 |
| **ISO/IEC 42006:2025** | Published | Requirements for bodies auditing and certifying an AIMS. Owns the D5 certification-process content and explains what accredited certification means |

> **Verified against the standard itself 2026-08-06**, not against secondary sources.
> Two things every secondary source gets wrong: it is **nine control categories with
> ten objectives**, not nine objectives; and **Annex B is NORMATIVE**, not
> informative — implementation guidance carrying normative status, though B.1
> exempts the guidance itself from SoA justification. Annexes C and D are
> informative.

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

1. **Impact assessment sits alongside risk assessment and feeds it.** The naive
   framing — *risk is to the organization, impact is to people* — **does not hold
   and must not be taught.** Clause 6.1.2 already has risk analysis assess
   consequences to the organization, individuals and societies. The real
   differences are anchoring (objectives vs deployment, intended use and
   foreseeable misuse), output (risk levels for treatment vs documented
   consequences), context (risk criteria vs technical, societal and jurisdictional
   context) and audience (internal vs may be released to interested parties).
   **Clause 6.1.4 requires impact assessment results to be considered in the risk
   assessment** — they are not parallel processes.
2. **Role determination is a `shall`, and the taxonomy has six categories.**
   Clause 4.1 requires the organization to determine its roles with respect to its
   AI systems, and its note gives **AI providers, AI producers, AI customers, AI
   partners, AI subjects, and relevant authorities** — with developers a subtype of
   producer, not a peer. Roles determine which requirements and controls apply. No
   27001 analogue.
3. **The AI system life cycle** is a first-class object in a way the information
   asset is not, and continuous learning means behaviour changes during use.
4. **Data for AI systems** — acquisition, quality, provenance, preparation — is a
   control category in its own right.
5. **Transparency to interested parties and human oversight** are management-system
   concerns mapping onto EU AI Act Articles 50 and 14.
6. **Climate change is an explicit `shall` in clause 4.1**, with a matching note on
   interested parties in 4.2. Surprising, real, and exactly the requirement a
   candidate skims past.
7. **Clause 8 re-states risk assessment, risk treatment and impact assessment as
   operational requirements** (8.2/8.3/8.4) — performed at planned intervals or on
   significant change, with results retained. Clause 6 defines the process; clause 8
   performs it. That split is its own competence.

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
- **The ISO/IEC 22989 citation rule — DECIDED, not owed.** ISMS-F ruled that no
  lesson cites ISO/IEC 27000 as a definitional source. The external review of this
  document recommended using 22989 as the *"terminology baseline"* — which, taken
  literally, is what that rule forbids. The ruling:

  1. **22989 informs our vocabulary. It is never cited as the authority for a
     definition.** No lesson says *"ISO/IEC 22989 defines X as…"*.
  2. **No definition is reproduced, in any language.** Style guide §1 governs.
  3. **Where 42001 Clause 3 carries a term, teach the concept and note that the
     standard defines it — without quoting it.** That a term is normatively defined
     and where to find it is a different fact from the definition, and it is the
     one that is ours to teach.
  4. **Naming 22989 as a cross-reference is permitted** per `CERT-CREATION.md` §4
     gate 6. The red line is claiming to *be* that document.
  5. **Amendment 1 (generative AI) is under development.** Do not build teaching
     content on terms it could move.

  **The addition 27001 did not need.** AI terminology is genuinely contested in a
  way information-security terminology is not — *agent*, *foundation model*, and
  above all **AI system**, whose definition is load-bearing outside the standard
  because the EU AI Act's scope turns on it. So **teach the boundary question as a
  competence, not the definition as a recital.** *"Is this thing in scope of our
  AIMS?"* is what an implementer actually gets wrong, it is assessable at
  `3_apply` and `4_analyze`, and a recited definition is `1_remember` and teaches
  nothing. Same shape as ISMS-F's shadow-AI scope point — the trap generalises.

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
| **A competitor's 42001 ladder** | **High — four rungs shipped, en + es, ATP network in LATAM.** Their pt-BR coverage is UNVERIFIED | **Before Stage 2, and before any comparative copy** |
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
3. **AIGRM-I discrimination copy — DRAFTED, review owed.** They will sit at
   positions 1 and 3 of the same family. HANDOFF v5.2 §3.2 ruled AIGRM-I is *not* a
   42001 Foundation — one task on 42001, no clause machinery, market analogue
   IAPP's AIGP.

   **AIGRM-I**
   - **en** — Framework-independent AI governance and risk practice: NIST AI RMF,
     the regulatory landscape, and how risk is run day to day.
   - **es-419** — Práctica de gobernanza y riesgo de IA independiente de marcos:
     NIST AI RMF, el panorama regulatorio y la gestión cotidiana del riesgo.
   - **pt-BR** — Prática de governança e risco de IA independente de estruturas:
     NIST AI RMF, o panorama regulatório e a gestão cotidiana do risco.

   **AIMS-F**
   - **en** — One standard, in depth: the ISO/IEC 42001 clauses, its Annex A
     controls, the AI system impact assessment, and the route to certification.
   - **es-419** — Una norma, en profundidad: los capítulos de ISO/IEC 42001, sus
     controles del Anexo A, la evaluación de impacto del sistema de IA y la ruta
     hacia la certificación.
   - **pt-BR** — Uma norma, em profundidade: as seções da ISO/IEC 42001, seus
     controles do Anexo A, a avaliação de impacto do sistema de IA e o caminho até
     a certificação.

   Rule 17 applied: `capítulos` in es-419 for whole top-level divisions, `Seções`
   in pt-BR, `clauses` in English only. NIST AI RMF untranslated as a proper noun.

   **Two flags.** These are assistant translations and **nothing tracks them** —
   `certification_i18n` has no `is_provisional` column (v5.3 §1), so `verify-cert`
   cannot see them. Same review packet as the ISMS-F rows. And **AIGRM-I's line
   changes a live published cert** — it ships in a migration, not the scaffold.
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
