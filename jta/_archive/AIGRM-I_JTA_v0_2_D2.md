# AIGRM-I — JTA — D2 (draft to locked D1 template)

**Credential:** Certidemy AI Governance & Risk Management I — AI  ·  **Code:** AIGRM-I
**Document:** D2 draft, authored to the **D1 template locked after Grok review**.
**Status:** DRAFT — for Grok consistency review alongside D1.

> **Template conventions locked from D1 review (apply to D2–D5):**
> (a) every task statement opens with a clear action verb;
> (b) the four NIST risk functions are always capitalized — **Govern, Map,
> Measure, Manage**; framework proper nouns kept consistent (NIST AI RMF, EU AI
> Act, ISO/IEC 42001, OECD);
> (c) regulatory/standards tasks say *understand / explain the structure and
> obligations of* — never "comply with";
> (d) one concept = one teachable/testable idea (kebab-case slug); a concept may
> be shared across tasks (many-to-many `task_concepts`) and is marked *(reused
> from D#)* rather than redefined;
> (e) Bloom rises with the domain — D1 skewed `2_understand`; the applied domains
> carry more `3_apply` / `4_analyze`.

---

# D2 — AI Risk Management in Practice  *(22.5%)*

**Domain intent.** The applied core of the credential: how AI risk is actually
managed. The candidate works the risk-management cycle (**Govern, Map, Measure,
Manage**), runs the identify→analyze→evaluate→treat process, characterizes and
prioritizes risk by likelihood and severity, chooses treatments, and recognizes
the concrete risk types that define the AI era — the generative-AI taxonomy, the
distinctive risks of agentic systems, the security-oriented risks (prompt
injection, leakage), model drift, and human oversight as a control. This is the
domain where governance stops being vocabulary and becomes practice, so it carries
the heaviest `3_apply` / `4_analyze` load.

## D2 tasks

| Code | Task — *the candidate can…* | Bloom | Freq | Crit | Concepts |
|---|---|---|---|---|---|
| **2.1** | Explain the purpose and structure of an AI risk-management framework, including the four functions **Govern, Map, Measure, and Manage**. | 2_understand | H | H | `ai-rmf-purpose`, `govern-function`, `map-function`, `measure-function`, `manage-function` |
| **2.2** | Apply the risk-management process — **identify, analyze, evaluate, treat** — to a described AI use case. | 3_apply | H | H | `risk-identification`, `risk-analysis`, `risk-evaluation`, `risk-treatment`, `iterative-risk-process` |
| **2.3** | Characterize an AI risk by its **likelihood and severity** and prioritize among competing risks. | 3_apply | H | H | `likelihood-and-severity` *(reused from D1)*, `risk-prioritization`, `residual-risk` |
| **2.4** | Explain **risk tolerance** and how it determines which AI risks an organization accepts. | 2_understand | M | H | `risk-tolerance`, `acceptable-vs-unacceptable-risk` |
| **2.5** | Select an appropriate **risk-treatment option** — avoid, mitigate, transfer, accept — for a given AI risk. | 3_apply | H | H | `risk-treatment-options`, `avoid-mitigate-transfer-accept`, `control-selection` |
| **2.6** | Identify the **categories of generative-AI risk** and recognize them in a described scenario. | 3_apply | H | H | `generative-ai-risk-taxonomy`, `confabulation-hallucination`, `harmful-bias`, `information-integrity`, `data-privacy-risk`, `ip-and-provenance-risk`, `harmful-content-risk` |
| **2.7** | Analyze the **distinctive risks of agentic AI** — autonomy, tool misuse, compounding actions — and why human oversight is required. | 4_analyze | M | H | `agentic-risk`, `tool-misuse`, `compounding-actions`, `human-oversight-necessity` |
| **2.8** | Explain the **security-oriented risks** of AI systems — prompt injection, jailbreaks, and training-data leakage — and that mitigations exist. | 3_apply | M | H | `prompt-injection`, `jailbreak`, `data-leakage-memorization`, `adversarial-input`, `mitigation-concept` |
| **2.9** | Explain **model drift** and the need for ongoing monitoring of deployed AI. | 2_understand | M | M | `model-drift`, `ongoing-monitoring` |
| **2.10** | Explain **human oversight** — human-in-the-loop and human-on-the-loop — as a primary control for consequential AI. | 2_understand | H | H | `human-in-the-loop`, `human-on-the-loop`, `oversight-as-control` |
| **2.11** | Explain how AI risk **integrates with enterprise risk** — privacy, security, safety — rather than standing alone. | 2_understand | M | M | `enterprise-risk-integration`, `ai-privacy-security-safety-overlap` |

**D2 assessment note.** 2.1, 2.2, 2.3, 2.5 (the framework + process spine, all
H/H) carry the domain's item weight. 2.6 (generative taxonomy) and 2.7 (agentic)
are the AI-era differentiators — 2.7 is the domain's single `4_analyze` task and,
like D1's 1.6, is where the credential earns its "AI-native" claim. 2.6 and 2.10
map naturally to grouped-layout lessons (taxonomy; oversight modes) with recall/
apply widgets.

## D2 concept glossary

*(slug — name — one-line definition; each becomes a `concepts` row.)*

**Risk framework & the four functions (2.1)**
- `ai-rmf-purpose` — **AI risk-framework purpose** — why organizations use a structured, repeatable framework to manage AI risk rather than ad-hoc judgment.
- `govern-function` — **Govern** — the cross-cutting function: culture, roles, accountability, and policy for AI risk across the whole lifecycle.
- `map-function` — **Map** — establish the context of an AI system and identify the risks it presents.
- `measure-function` — **Measure** — assess, analyze, and track the identified risks using appropriate methods and metrics.
- `manage-function` — **Manage** — prioritize, respond to, and monitor risks, allocating resources to the most significant.

**The risk process (2.2)**
- `risk-identification` — **Risk identification** — determining what could go wrong with an AI system and to whom.
- `risk-analysis` — **Risk analysis** — understanding an identified risk's nature, likelihood, and potential severity.
- `risk-evaluation` — **Risk evaluation** — judging whether an analyzed risk is acceptable against the organization's tolerance.
- `risk-treatment` — **Risk treatment** — taking action to modify a risk to an acceptable level.
- `iterative-risk-process` — **Iterative process** — the risk process repeats across the AI lifecycle as the system and its context change.

**Characterizing & prioritizing (2.3)**
- `likelihood-and-severity` — *(reused from D1)* the two axes by which AI risk is characterized.
- `risk-prioritization` — **Risk prioritization** — ranking risks so effort and controls target the most significant first.
- `residual-risk` — **Residual risk** — the risk that remains after treatment has been applied.

**Risk tolerance (2.4)**
- `risk-tolerance` — **Risk tolerance** — the level of risk an organization is willing to accept in pursuit of its objectives.
- `acceptable-vs-unacceptable-risk` — **Acceptable vs unacceptable** — the threshold decision that separates risks the organization will bear from those it will not.

**Treatment options (2.5)**
- `risk-treatment-options` — **Treatment options** — the set of possible responses to an identified risk.
- `avoid-mitigate-transfer-accept` — **Avoid / mitigate / transfer / accept** — the four canonical risk-treatment choices.
- `control-selection` — **Control selection** — choosing controls proportionate to the risk's likelihood and severity.

**Generative-AI risk taxonomy (2.6)**
- `generative-ai-risk-taxonomy` — **Generative-AI risk taxonomy** — the recognized set of risk categories specific to or heightened by generative AI.
- `confabulation-hallucination` — **Confabulation (hallucination)** — the model producing confident, fluent output that is factually false.
- `harmful-bias` — **Harmful bias** — outputs that systematically and unfairly disadvantage individuals or groups.
- `information-integrity` — **Information integrity** — generative AI's effect on the reliability of the information ecosystem (misinformation, deepfakes, synthetic content).
- `data-privacy-risk` — **Data-privacy risk** — exposure or misuse of personal data through training data or model outputs.
- `ip-and-provenance-risk` — **IP & provenance risk** — infringement, attribution, and origin-tracking issues in generated content.
- `harmful-content-risk` — **Harmful-content risk** — generation of dangerous, violent, abusive, or otherwise harmful material.

**Agentic-AI risk (2.7)**
- `agentic-risk` — **Agentic risk** — risk arising specifically from systems that plan and act autonomously across steps and tools.
- `tool-misuse` — **Tool misuse** — an agent invoking a tool or action incorrectly, harmfully, or beyond its intended scope.
- `compounding-actions` — **Compounding actions** — errors that cascade and amplify across an agent's multi-step chain of actions.
- `human-oversight-necessity` — **Why oversight is required** — consequential autonomy demands a human check because the system can act faster and wider than a person can correct.

**Security-oriented risk (2.8)**
- `prompt-injection` — **Prompt injection** — malicious input crafted to override or hijack an AI system's intended instructions.
- `jailbreak` — **Jailbreak** — input designed to bypass a model's safety constraints and elicit prohibited behavior.
- `data-leakage-memorization` — **Data leakage / memorization** — the model exposing sensitive data it memorized during training.
- `adversarial-input` — **Adversarial input** — input deliberately shaped to manipulate a model into incorrect or unsafe behavior.
- `mitigation-concept` — **Mitigations exist** — these risks are reduced (not eliminated) by controls such as input handling, guardrails, and monitoring.

**Drift & monitoring (2.9)**
- `model-drift` — **Model drift** — degradation of a deployed model's performance as data and real-world conditions shift over time.
- `ongoing-monitoring` — **Ongoing monitoring** — continuous observation of a deployed AI system to detect drift, failures, and emerging risks.

**Human oversight (2.10)**
- `human-in-the-loop` — **Human-in-the-loop** — a human reviews and approves within the AI decision loop before action is taken.
- `human-on-the-loop` — **Human-on-the-loop** — a human supervises the system and can intervene, without approving each action.
- `oversight-as-control` — **Oversight as a control** — human oversight treated as a primary, designed risk control for consequential AI, not an afterthought.

**Enterprise-risk integration (2.11)**
- `enterprise-risk-integration` — **Enterprise-risk integration** — managing AI risk within the organization's broader risk practices rather than in isolation.
- `ai-privacy-security-safety-overlap` — **Privacy / security / safety overlap** — AI risk intersects and must be coordinated with existing privacy, security, and safety risk domains.

---

## D2 summary (template metrics)

- **Tasks:** 11  ·  **Concepts:** 41 (40 new + 1 reused from D1).
- **Bloom mix:** 5× `2_understand`, 5× `3_apply`, 1× `4_analyze` — the applied
  gradient rising off D1's foundations, as designed.
- **Concept density:** ~3.7 concepts/task (2.6's seven-category taxonomy is the
  intentional grouped-lesson outlier, mirroring D1's 1.5).
- **Downstream targets** (CERT-CREATION.md §4): all 40 new concepts taught by ≥1
  lesson per language and tested to the item floors (≥8 secure / ≥10 practice per
  task per language), `untaught_testing_violations = 0`.

---

*D2 authored to the locked template. On Grok consistency sign-off, D3–D5 follow
the same shape, then all five assemble into `AIGRM-I_JTA_v1.md`.*
