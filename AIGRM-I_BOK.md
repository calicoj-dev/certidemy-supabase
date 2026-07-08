# AIGP-AI-I — Body of Knowledge decision (Stage 1)

**Cert (working):** Certidemy AI Governance Professional I — AI
**Code (ours):** AIGP-AI-I  ·  **Content folder:** `content/aigp-ai-i/`
**Tier:** I (single-correct-answer)  ·  **Family:** AI Governance (family #2)
**Status:** DRAFT — awaiting Juan sign-off + Grok review before JTA authoring.
**Source currency:** frameworks below verified against their current state as of
**July 2026** (see §3). This document is the front-matter the JTA and scheme
inherit.

---

## 1. What this credential certifies

That the holder understands **how to govern AI responsibly in an organization** —
what AI risk is, how the major frameworks structure its management, what the
regulatory landscape requires, how governance applies across the AI lifecycle,
and how to operate the human/ethical/organizational practices that keep AI
trustworthy — **with generative and agentic AI treated as first-class, not an
afterthought.**

**The Certidemy edge:** this is not a re-skin of a compliance checklist. It is an
*AI-era-native* governance credential — the risk taxonomy, lifecycle, and
oversight practices are taught for the systems people actually deploy now (LLMs,
copilots, RAG, agentic workflows), where confabulation, prompt injection, and
autonomous action are the live risks.

**Tier rationale:** foundational governance knowledge (what a framework requires,
what a high-risk system is, what the four risk functions are) is a clean
single-correct-answer fit and churns end-to-end on the current machine. The
judgment-heavy "what is the BEST governance response to this scenario" material is
a natural **future AIGP-AI-II** (Level II, single-best-answer) — which waits on
the L2 item generator, per CERT-CREATION.md §5.

**Out of scope:** building AI/ML systems; deep technical model security
engineering; legal advice / jurisdiction-specific counsel; and any claim that the
credential confers ISO/EU-Act *compliance* or accreditation on the holder.

---

## 2. Foundational public sources (facts only — authored in our words)

We build on the *facts and structure* of these public frameworks exactly as we
built on the 2020 Scrum Guide. We never present as / imply we *are* any of them
(marketing-identity line, CERT-CREATION.md §4.6). All are genuinely public/citable
— the cleanest possible BoK.

| Source | What we draw | Nature |
|---|---|---|
| **NIST AI RMF 1.0** (AI 100-1) + **GenAI Profile** (AI 600-1) | The four risk functions (Govern/Map/Measure/Manage), 7 trustworthy-AI characteristics, the 12 GenAI risk categories | US voluntary framework, public |
| **EU AI Act** (Reg. 2024/1689) + Digital Omnibus amendments | Risk-tier model, actor roles, obligation structure, transparency duties | Binding EU law, public |
| **ISO/IEC 42001:2023** (AIMS) + family (22989, 23894, 38507, 42005, 42006) | AI management-system thinking, AI risk process, impact assessment, governance-vs-management split | International standards (we teach the concepts; the texts are paywalled — use public summaries, never reproduce clauses) |
| **OECD AI Principles** | High-level values (human-centred, transparency, accountability, robustness) | Public intergovernmental |

> **IP note:** NIST, EU-Act, and OECD texts are public and freely usable as
> facts. ISO standards are *copyrighted and paywalled* — we teach the concepts
> (AIMS, dual risk/impact assessment, the family structure) from public summaries
> and never reproduce standard clauses verbatim. This is the same
> facts-not-expression discipline that governed the Scrum work, applied a notch
> more carefully for ISO.

---

## 3. Verified currency (July 2026) — the moving parts we must teach correctly

Captured so the JTA cites the *current* state, and flagged for the scheme's
"review when underlying frameworks are revised" cadence:

- **EU AI Act is phased and was just amended.** In force Aug 2024. Prohibited
  practices + AI-literacy applied Feb 2025; GPAI-model + governance obligations
  Aug 2025; most remaining rules + Article 50 transparency **2 Aug 2026**. The
  **Digital Omnibus on AI** (provisional agreement May 2026, adoption ~July 2026)
  **defers high-risk Annex III obligations to Dec 2027**, Annex I to Aug 2028, and
  adds two new prohibited practices (non-consensual intimate imagery + CSAM
  generation) from Dec 2026. → Teach the **risk-tier structure and obligation
  *types*** as stable; treat specific dates as "current as of 2026, phased," not
  as fixed facts.
- **NIST AI RMF 1.0 is being revised (1.1 in progress).** The four functions and
  GenAI Profile are stable; NIST has also added adversarial-ML (AI 100-2) and
  **agentic-AI (AI 100-5)** work and an April 2026 Critical-Infrastructure Profile
  concept note. → Teach the four functions + 12 GenAI risks as the spine; note
  1.1 is forthcoming.
- **ISO/IEC 42001 family grew.** Core AIMS (2023) now sits with **42005:2025 (AI
  system impact assessment)** and **42006:2025 (requirements for bodies that
  certify AI management systems)**, plus 22989 (terminology), 23894 (risk), 38507
  (governance). → Teach 42001's dual mandatory assessments (risk *and* impact) and
  the governance-to-management continuum.
- **US state law is live and shifting** (Colorado SB 26-189, Texas TRAIGA in force
  Jan 2026). → Teach the *pattern* (state-level AI/automated-decision law is
  emerging and varies) rather than any single statute's details.

**Design consequence:** the JTA anchors on **stable structures** (risk tiers,
the four functions, AIMS dual-assessment, actor roles, the trustworthy-AI
characteristics) and treats **specific dates/statutes as illustrative current
state**, so the cert doesn't rot on the next amendment. The scheme's maintenance
clause names framework revision as a review trigger.

---

## 4. Proposed domain structure (weights sum to 100)

| Domain | Title | Weight | Focus |
|---|---|---|---|
| **D1** | Foundations of AI Governance & Trustworthy AI | 15.0% | What AI governance/risk is; harm vs risk; actor landscape (provider/deployer/developer); the trustworthy-AI characteristics; AI terminology; why governance matters more as AI gets autonomous |
| **D2** | AI Risk Management in Practice | 22.5% | The Govern/Map/Measure/Manage cycle applied; ISO-style risk identification→analysis→evaluation→treatment; the GenAI/agentic risk taxonomy (confabulation, prompt injection, data leakage, autonomy risks) |
| **D3** | Regulatory & Standards Landscape | 20.0% | EU AI Act risk tiers + obligation types + transparency duties; the ISO/IEC 42001 AIMS model and its family; the emerging US state-law pattern; OECD principles — **taught as concepts, never as "we are them"** |
| **D4** | The AI Lifecycle & Accountable Deployment | 25.0% | *Signature applied domain.* Governance across data→model→deploy→monitor; technical documentation & provenance; **AI system impact assessment**; human oversight; incident response; post-market monitoring; agentic-workflow accountability |
| **D5** | Responsible AI, Ethics & the Governance Function | 17.5% | Fairness/bias, transparency/explainability, privacy & security of AI; building the governance function (roles, policy, AI literacy/training); third-party & supply-chain oversight; documentation culture |

**AI-era through-line (the differentiator):** generative and agentic AI risk is
woven across all five domains, heaviest in D2 (taxonomy) and D4 (deployment) —
the parallel to how the Scrum-AI certs wove AI through every domain rather than
isolating it.

**Exam (I-tier convention):** 80 items, 80% pass, single-best-answer, per-language
(en / es-419 / pt-BR). Confirm duration against the live `certifications` row at
publish.

---

## 5. Stage-1 gate

Per CERT-CREATION.md, JTA authoring does not begin until:
- [ ] Juan signs off on this BoK (topic, sources, tier, domains, weights).
- [ ] Grok reviews and returns suggestions; accepted/declined with reasoning.

On sign-off → **Stage 2:** author the full JTA — the assessable tasks under each
domain (target ~8–12 per domain → ~44–50 total) and the concept list each task
draws on, mirroring the SCHEME-*/JTA structure.
