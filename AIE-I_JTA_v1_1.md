# AIE-I — Job-Task Analysis (v1.1 LOCKED)

**Document version:** 1.1
**Status:** **Locked.** This is the basis for content production. (Grok Expert review:
9.4/10, no coverage gaps, no fluff — locked after two minor wording tweaks.)
**Certification:** Certidemy AI Essentials I (AIE-I) — proprietary, issued by Certidemy
**Family:** AI Essentials (new family; founding member, tier I "literacy / awareness")
**Authority:** Triangulated consensus BoK — see "Basis of the body of knowledge" below
**Last updated:** July 10, 2026 (v1.1 — locked; Task 1.4 KSA tightened to bridge D3;
human-in-the-loop/accountability bound to Task 3.3; Article 4 marketing language pinned)

## Change log
- **v1.1** — Grok review pass (9.4/10). Task 1.4 Knowledge line adds "still requires
  human oversight and goals set by a person" (D3 bridge). Concept-slug note binds
  `human-in-the-loop` + `accountability` to Task 3.3. Approved Article 4 marketing
  language pinned (see Positioning). All open questions resolved: keep all 16 tasks,
  keep 40/36/24 weights, keep agentic AI at Task 1.4, keep Bloom 44/40/16, 2-year
  validity for both tiers. No structural changes.
- **v1.0** — initial draft.

---

## Positioning

AIE-I is a **freemium, top-of-funnel AI-literacy credential** for **non-technical
professionals** — HR, marketing, sales, customer service, finance, operations,
training, education, and leadership. It proves a person can **understand, evaluate,
and use everyday AI tools safely, responsibly, and with sound judgment** in a
workplace context. It is deliberately **not** a technical, engineering, or governance
credential; it is the literacy floor beneath the rest of the catalog.

**Commercial role.** Cheap-or-free lead magnet → proves platform quality → converts to
paid certs (AIGRM-I, SM-AI-I, SPO-AI-I, SD-AI-I, and future families). It is also the
natural first recommendation from the AI path advisor for "I'm new to AI" goals.

**Ladder.** AIE-I (literacy / *"I am AI-aware"*) → **CAIP-I** planned Level II
(applied fluency / *"I can make sound professional judgments about AI at work"*) →
specialist families. "Professional / Practitioner" is reserved for Level II; AIE-I does
not overclaim.

**Approved Article 4 marketing language (non-overclaiming — use verbatim).**
> "AIE-I provides a structured, per-individual, verifiable record of AI literacy that
> organizations can use as evidence of measures taken under EU AI Act Article 4."

Do **not** claim AIE-I "guarantees compliance" or is "certified under Article 4." It is
*a* literacy measure and audit-supporting record, not a compliance guarantee.

---

## Basis of the body of knowledge (defensibility)

The BoK is triangulated from three independent sources that converge on the same spine:

1. **Market consensus (what peers certify).** AWS Certified AI Practitioner
   (AIF-C01) — Fundamentals of AI/ML, Fundamentals of Generative AI, Applications of
   Foundation Models, Guidelines for Responsible AI, Security/Compliance/Governance.
   CertiProf AIFPC — explicitly for non-technical professionals; "understand, evaluate,
   and use AI tools safely, ethically, and effectively," including detecting
   hallucinations, privacy basics, and responsible use. Our 3-domain shape is the
   non-technical distillation of this shared consensus.
2. **Authoritative framework — EU AI Act Article 4 (AI literacy).** A live legal
   obligation (in force since 2 Feb 2025; national enforcement from 2 Aug 2026) that
   applies to **every** provider/deployer using any AI system, regardless of risk tier.
   The regulator's own literacy standard for a general workforce is: understand what AI
   tools can and cannot reliably do; recognize risks such as hallucinated output, bias,
   and confidentiality exposure; know when a human must stay in the loop; and understand
   the organization's own acceptable-use policies. **Domains 1-3 below map directly to
   this standard** — which makes an AIE-I credential usable as *Article 4 evidence*, a
   per-individual, verifiable, audit-ready record (exactly the "structured measure, not
   box-ticking" the Commission asks for).
3. **Job-task reality.** For a non-technical professional, the recurring on-the-job
   tasks are: recognizing what a tool is/does, writing a workable prompt, judging
   whether an output can be trusted, and handling AI safely (data, oversight, policy).
   The tasks below are written from these real behaviors, not from a topic list.

This triangulation is what makes AIE-I defensible in an ISO/IEC 17024-framed audit:
market-aligned, regulation-aligned, and job-anchored.

---

## Exam facts (proposed)

|Attribute|Value|
|-|-|
|Format|Multiple choice, online|
|Questions|**25**|
|Duration|30 minutes|
|Passing score|**80% (20 / 25 correct)**|
|Open/closed book|Closed book|
|Attempts|1 included; retake purchasable|
|Bloom ceiling|3 (Apply) — literacy tier; no Analyze+ in MCQs|
|Pricing model|**Free to study + sit the exam; small fee ($19-29) to mint the verifiable credential/badge**|
|Validity|2 years (proposed)|
|Languages offered|English, Español (es-419), Português (pt-BR)|

**On 25 questions / 80%.** 20 items would make each question worth 5% (fail on 4
misses) — statistically swingy for a credential carrying ISO/IEC 17024 framing. 25
items (4% each, fail on 6 misses) gives more reliable pass/fail without lengthening the
exam beyond a 30-minute "easy win." Pass rate held at 80% for consistency with the
catalog.

---

## Domain structure (proposed)

|#|Domain|Weight|MCQ count (of 25)|
|-|-|-|-|
|1|AI Concepts & Landscape|40%|10|
|2|Working with Generative AI|36%|9|
|3|Responsible & Safe Use at Work|24%|6|
|**Total**||**100%**|**25**|

### Rationale

* **Domain 1 (Concepts) is the largest slice (40%)** because literacy *is*
  vocabulary — a non-technical professional's first need is to correctly name and
  distinguish AI/ML/GenAI/agents and recognize real use cases. This is the densest
  Remember/Understand territory.
* **Domain 2 (Working with GenAI) at 36%** because prompts, capabilities/limitations,
  and output verification are the daily hands-on reality for the target audience —
  and where market peers (AWS "Fundamentals of GenAI", CertiProf prompt/hallucination
  content) put heavy weight.
* **Domain 3 (Responsible & Safe Use) at 24%** — smaller but non-negotiable. This is
  the Article 4 bridge and the on-ramp to AIGRM-I. Kept lean so AIE-I stays *literacy*,
  not *governance*, while still covering privacy, bias, oversight, and policy awareness.

Weights land clean on whole MCQ counts (10 / 9 / 6 = 25); no rounding needed.

---

## Bloom's Taxonomy distribution (MCQ target)

Across all 25 questions:

|Bloom level|Target %|Question count|Style|
|-|-|-|-|
|1 — Remember|44%|11|Direct recall ("Which of these is a large language model?")|
|2 — Understand|40%|10|Explanation/comparison ("Why can a chatbot state something false confidently?")|
|3 — Apply|16%|4|Short judgment scenarios ("A colleague pastes client data into a public chatbot — what's the risk?")|
|4+ — Analyze/Evaluate/Create|0%|0|Not tested at the literacy tier|

**Deliberately lighter than the specialist certs.** SM-I/AIGRM-I push 50%+ at
Apply/Analyze. AIE-I is a *literacy* credential: ~84% Remember/Understand with a light
16% Apply for real-world judgment. This keeps it an "easy win" that still requires
genuine understanding — not a participation trophy, but not a specialist gate either.

---

## Key terminology stance

AIE-I teaches plain, current, vendor-neutral vocabulary. Where the field uses loose or
drifting terms, teach the accurate one and note the common looseness:

|Accurate term|Loose/everyday usage|Our content position|
|-|-|-|
|AI system / model|"the AI", "the algorithm", "the robot"|Teach "AI system/model"; note casual usage|
|Generative AI / LLM|"ChatGPT" used as a generic verb|Teach the category; note brand-as-generic drift|
|Prompt|"question", "command", "search"|Teach "prompt" as the input; distinguish from web search|
|Hallucination|"the AI lied / made a mistake"|Teach "hallucination"; explain it's confident-but-wrong, not intent|
|Agent / agentic AI|"the AI does things by itself"|Teach the concept at a high level; distinguish from a plain chatbot|
|Machine learning|used interchangeably with "AI"|Teach ML as a subset/approach within AI|

These drift points become explicit exam-tip callouts in lessons.

---

# Domain 1 — AI Concepts & Landscape (40%)

**Description.** The vocabulary and mental model of modern AI for a non-technical
professional: what AI is (and isn't), how generative AI differs from traditional
software and from earlier AI, what a model / LLM / agent is at a high level, and where
AI actually shows up in everyday work. This domain is pure recognition and
understanding — the literacy floor.

**Estimated module mapping:** Module 1 (What AI Is), Module 2 (The GenAI Landscape)

## Tasks

### Task 1.1 — Define artificial intelligence and distinguish it from ordinary software and automation

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`what-is-ai`, `ai-vs-automation`, `ai-vs-software`|

**KSAs:**

* **K:** Working definition of AI (systems that perform tasks associated with human
  intelligence); how AI differs from rule-based automation and conventional software
* **S:** Given an example, judge whether it is "AI" or plain automation
* **A:** Skepticism toward "AI-washing"; recognizing marketing hype vs. real capability

---

### Task 1.2 — Distinguish machine learning and generative AI from traditional AI

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`machine-learning`, `generative-ai`, `traditional-ai`, `training-vs-inference`|

**KSAs:**

* **K:** ML as learning patterns from data (vs. hand-coded rules); generative AI as
  producing new content (text, images, code); the idea of training vs. using (inference)
  at a plain-language level
* **S:** Sort examples into "traditional/rule-based", "machine learning", "generative"
* **A:** Comfort with not needing the math — understanding the *category*, not the model

---

### Task 1.3 — Explain what a foundation model / large language model is at a high level

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`foundation-model`, `large-language-model`, `model-as-prediction`|

**KSAs:**

* **K:** LLM as a model trained on large text corpora that predicts likely next words;
  "foundation model" as a general-purpose base adaptable to many tasks; not a database,
  not a search engine, not a person
* **S:** Explain in one sentence, to a colleague, what an LLM does
* **A:** Demystification — it's a prediction engine, not a mind

---

### Task 1.4 — Describe what an AI agent (agentic AI) is and how it differs from a chatbot

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|Medium|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`ai-agent`, `agentic-ai`, `agent-vs-chatbot`|

**KSAs:**

* **K:** An agent as an AI that can take multi-step actions toward a goal (use tools,
  call other systems) rather than only replying; contrast with a single-turn chatbot;
  still requires human oversight and goals set by a person
* **S:** Recognize whether a described tool is "just answering" or "taking actions"
* **A:** Appropriate caution — more autonomy means more need for oversight (bridges to D3)

---

### Task 1.5 — Recognize common AI use cases across everyday workplace functions

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Daily|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`ai-use-cases`, `ai-in-the-workplace`|

**KSAs:**

* **K:** Typical use cases — drafting/summarizing text, answering questions, analyzing
  data, generating images, coding assistance, customer support, screening/triage
* **S:** Match a business need to a plausible AI use case (and spot a poor fit)
* **A:** Opportunity-awareness balanced with realism about limits

---

### Task 1.6 — Identify what current AI cannot reliably do

|Attribute|Value|
|-|-|
|Domain|1|
|Criticality|High|
|Frequency|Daily|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`ai-limitations`, `not-a-source-of-truth`, `no-real-understanding`|

**KSAs:**

* **K:** Current GenAI does not "know" facts, cannot guarantee correctness, has a
  knowledge cutoff, can't be assumed current, and does not truly reason like a person
* **S:** Flag a task where AI is the wrong or risky tool
* **A:** Healthy skepticism as a default posture (sets up D2 verification + D3 trust)

---

# Domain 2 — Working with Generative AI (36%)

**Description.** The practical literacy of actually using a generative AI tool well:
what a prompt is and how to structure a workable one, what these tools can and can't do,
why they produce confident-but-wrong output (hallucination), and how to verify results
before relying on them. This is the hands-on core for the target audience.

**Estimated module mapping:** Module 3 (Prompting Basics), Module 4 (Judging Outputs)

## Tasks

### Task 2.1 — Explain what a prompt is and how it differs from a search query

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Daily|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`prompt`, `prompt-vs-search`, `natural-language-instruction`|

**KSAs:**

* **K:** A prompt as a natural-language instruction to a model; unlike a search (which
  retrieves existing pages), a prompt asks the model to generate a response
* **S:** Rewrite a vague request as a clearer instruction
* **A:** Willingness to be explicit rather than terse

---

### Task 2.2 — Apply the basic elements of an effective prompt (role, context, task, constraints, format)

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|Yes (future CAIP-I applied prompt exercises)|
|Concept slugs|`prompt-structure`, `role-context-task`, `constraints-and-format`|

**KSAs:**

* **K:** The five common building blocks — who the AI should act as (role), background
  (context), what to do (task), limits (constraints), and desired output shape (format)
* **S:** Improve a weak prompt by adding the missing elements
* **A:** Iterative mindset — prompting is a conversation, not a one-shot

---

### Task 2.3 — Describe the capabilities and limitations of current generative AI tools

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Daily|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`genai-capabilities`, `genai-limitations`, `knowledge-cutoff`|

**KSAs:**

* **K:** Strong at drafting, summarizing, rephrasing, brainstorming, translating;
  weak/unreliable at exact facts, current events past a cutoff, arithmetic, citations,
  and anything requiring guaranteed accuracy
* **S:** Predict whether a given task will play to a strength or a weakness
* **A:** Matching the tool to the job rather than over-trusting it

---

### Task 2.4 — Explain what AI "hallucination" is and why it happens

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Daily|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`hallucination`, `confident-but-wrong`, `plausible-not-true`|

**KSAs:**

* **K:** Hallucination as fluent, confident output that is factually wrong or invented
  (fake citations, made-up details); it stems from prediction of plausible text, not
  intent to deceive or a "bug" to report
* **S:** Recognize a likely hallucination in a sample output
* **A:** Treating confidence as no guarantee of correctness

---

### Task 2.5 — Verify and evaluate AI output before relying on it

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|High|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|Yes (future CAIP-I evaluation exercises)|
|Concept slugs|`verify-outputs`, `check-sources`, `human-review`|

**KSAs:**

* **K:** Verification habits — check facts against a trusted source, confirm citations
  exist, sanity-check numbers, never publish/act on unreviewed output for anything that
  matters
* **S:** Given an output and a use context, decide what must be verified before use
* **A:** Ownership — the human, not the AI, is accountable for the result

---

### Task 2.6 — Choose when generative AI is and is not the right tool for a task

|Attribute|Value|
|-|-|
|Domain|2|
|Criticality|Medium|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`right-tool-for-task`, `when-not-to-use-ai`|

**KSAs:**

* **K:** Good fits (first drafts, brainstorming, summaries) vs. poor/risky fits
  (authoritative facts, legal/medical/financial decisions, anything with confidential
  data or requiring guaranteed accuracy without review)
* **S:** Given a scenario, decide "use AI", "use AI then verify", or "don't use AI"
* **A:** Judgment over reflex — reaching for AI only where it genuinely helps

---

# Domain 3 — Responsible & Safe Use at Work (24%)

**Description.** Using AI safely and responsibly in an organizational context — the
literacy-level version of governance. Data and privacy hygiene, awareness of bias and
fairness, the principle of human oversight, and the fact that organizations have (and
staff must follow) AI-use policies. This domain is the EU AI Act Article 4 bridge and
the on-ramp to AIGRM-I; it is what makes the credential meaningful to employers.

**Estimated module mapping:** Module 5 (Using AI Responsibly at Work)

## Tasks

### Task 3.1 — Protect privacy and confidential data when using AI tools

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`data-privacy`, `data-leakage`, `no-secrets-in-prompts`|

**KSAs:**

* **K:** Why pasting confidential, personal, or client data into public AI tools is
  risky (it may be stored, used for training, or exposed); the difference between
  approved enterprise tools and public consumer ones
* **S:** Given a scenario, decide what is safe vs. unsafe to enter into a tool
* **A:** Instinctive caution with sensitive information ("don't paste secrets")

---

### Task 3.2 — Recognize bias and fairness risks in AI outputs

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Occasional|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`ai-bias`, `fairness-awareness`, `bias-from-data`|

**KSAs:**

* **K:** AI can reflect and amplify bias present in its training data; outputs can be
  unfair or stereotyped, with real impact in hiring, lending, and similar high-stakes
  uses
* **S:** Spot a potentially biased or unfair output in an example
* **A:** Awareness that "the AI said so" is never a defense for an unfair outcome

---

### Task 3.3 — Apply the principle of human oversight (keeping a human in the loop)

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Daily|
|Bloom level|3 (Apply)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`human-oversight`, `human-in-the-loop`, `accountability`|

**KSAs:**

* **K:** A human must review and remain accountable for AI-assisted decisions,
  especially those affecting people; more autonomy/impact means more oversight
* **S:** Given a decision, judge whether a human must review it before it takes effect
* **A:** Owning the outcome; not outsourcing responsibility to the tool

---

### Task 3.4 — Follow organizational AI-use policies and basic ethical red lines

|Attribute|Value|
|-|-|
|Domain|3|
|Criticality|High|
|Frequency|Daily|
|Bloom level|2 (Understand)|
|Exam-scope|Yes|
|Simulation candidate|No|
|Concept slugs|`acceptable-use-policy`, `ethical-red-lines`, `disclosure-and-transparency`|

**KSAs:**

* **K:** Organizations commonly set rules on which tools are approved, what data may be
  used, and when AI use must be disclosed; basic red lines (don't deceive, don't
  plagiarize, don't use AI to harm or discriminate); relevance of the EU AI Act's
  Article 4 literacy expectation at a plain-language level
* **S:** Given a workplace situation, identify the responsible action per typical policy
* **A:** Professional integrity — treating AI use as something to do openly and by the rules

---

## Task inventory summary

|Domain|Tasks|Weight|MCQ (of 25)|
|-|-|-|-|
|1 — AI Concepts & Landscape|6 (1.1–1.6)|40%|10|
|2 — Working with Generative AI|6 (2.1–2.6)|36%|9|
|3 — Responsible & Safe Use at Work|4 (3.1–3.4)|24%|6|
|**Total**|**16 tasks**|**100%**|**25**|

**Concept slugs (unique, ~40):** what-is-ai, ai-vs-automation, ai-vs-software,
machine-learning, generative-ai, traditional-ai, training-vs-inference,
foundation-model, large-language-model, model-as-prediction, ai-agent, agentic-ai,
agent-vs-chatbot, ai-use-cases, ai-in-the-workplace, ai-limitations,
not-a-source-of-truth, no-real-understanding, prompt, prompt-vs-search,
natural-language-instruction, prompt-structure, role-context-task,
constraints-and-format, genai-capabilities, genai-limitations, knowledge-cutoff,
hallucination, confident-but-wrong, plausible-not-true, verify-outputs, check-sources,
human-review, right-tool-for-task, when-not-to-use-ai, data-privacy, data-leakage,
no-secrets-in-prompts, ai-bias, fairness-awareness, bias-from-data, human-oversight,
human-in-the-loop, accountability, acceptable-use-policy, ethical-red-lines,
disclosure-and-transparency.

(Slugs are the frozen structural keys for the pipeline; finalize the exact set at
scaffold time. ~47 concepts across 16 tasks — a light, literacy-appropriate load.
**Note:** `human-in-the-loop` and `accountability` stay tightly bound to Task 3.3 —
do not let them drift to other tasks at scaffold time.)

---

## Resolved decisions (Grok review, 9.4/10)

1. **Coverage gap check** — *No material gaps.* Covers everything CertiProf AIFPC, AWS
   AI Practitioner (non-technical slices), Google AI Essentials, and the EU literacy
   definition expect. Nothing is fluff. **Keep all 16 tasks.**
2. **Domain 1 vs 2 weight (40/36)** — **Keep.** At literacy level, vocabulary and mental
   model (D1) is the foundation; D2 is already strong.
3. **Agentic AI (Task 1.4)** — **Keep** at Criticality Medium. By mid-2026 agents are
   mainstream; "chatbot vs. agent that takes actions" at high level future-proofs the cert.
4. **Bloom mix (44/40/16)** — **Keep.** Correct for literacy; higher Apply belongs in
   CAIP-I, not here.
5. **Article 4 positioning** — Lean hard but carefully; approved verbatim language pinned
   in Positioning above. Never "guarantees compliance" or "certified under Article 4."
6. **Validity period** — **2 years** for both free and paid badge (lifetime free badges
   go stale and devalue the credential).

---

*Draft v1.0. Next step after Grok review: reconcile suggestions → lock JTA → scaffold
migrations (domains/tasks/concepts/task_concept links) → author lessons → gen secure +
practice banks → translate → scheme doc → flip to coming_soon. Per CERT-CREATION.md.*
