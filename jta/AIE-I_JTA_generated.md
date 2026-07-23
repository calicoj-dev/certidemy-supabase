# AIE-I - Job-Task Analysis

> **GENERATED FROM THE DATABASE on 2026-07-23. Do not hand-edit.**
>
> Every fact below is rendered from the live schema by
> `scripts/gen-jta-doc.mjs`. To change anything here, change the database
> through a migration and regenerate - the git diff on this file is then the
> change record.
>
> Design rationale, sourcing, review history and reconciliation records are
> NOT here. They carry human judgment that no query can reconstruct, and live
> in the companion narrative document.

**Certification:** Certidemy AI Essentials I - AI  
**Status:** available

---

## Exam facts

| Attribute | Value |
|-|-|
| Questions | 25 |
| Duration | 45 minutes |
| Passing score | 80% (20/25) |
| Format | Multiple choice (single answer), online |
| Bloom ceiling | 4 (Analyze) for MCQ; 5-6 reserved for simulation |
| Languages | English, es-419, pt-BR |

## Domain structure

| # | Domain | Weight | MCQ seats |
|-|-|-|-|
| D1 | AI Concepts & Landscape | 40% | 10 |
| D2 | Working with Generative AI | 36% | 9 |
| D3 | Responsible & Safe Use at Work | 24% | 6 |
| **Total** | | **100%** | **25** |

## Cognitive profile

Computed from `v_cognitive_profile`: task Bloom level weighted by domain
weight over exam-scope tasks. It is a **consequence** of the JTA, not a target
asserted over it - `certifications.exam_blueprint` must equal this, and
verify-cert invariant 17 fails if they diverge.

| Bloom level | Tasks | % of form |
|-|-|-|
| 1 (Remember) | 3 | 16.23% |
| 2 (Understand) | 9 | 51.37% |
| 3 (Apply) | 6 | 32.4% |

---

# Domain D1 - AI Concepts & Landscape (40%)

**Description.** What AI is, how it works at a high level, where it shows up at work, and what it cannot reliably do.

**Tasks:** 7  |  **MCQ seats:** 10

## Tasks

### Task 1.1 - Distinguish artificial intelligence from ordinary software and automation

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-vs-automation`, `ai-vs-software`, `what-is-ai` |

- **K:** Working definition of AI (systems that perform tasks associated with human intelligence); how AI differs from rule-based automation and conventional software
- **S:** Given an example, judge whether it is "AI" or plain automation
- **A:** Skepticism toward "AI-washing"; recognizing marketing hype vs. real capability

### Task 1.2 - Distinguish machine learning and generative AI from traditional AI

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `generative-ai`, `machine-learning`, `traditional-ai`, `training-vs-inference` |

- **K:** ML as learning patterns from data (vs. hand-coded rules); generative AI as producing new content (text, images, code); the idea of training vs. using (inference) at a plain-language level
- **S:** Sort examples into "traditional/rule-based", "machine learning", "generative"
- **A:** Comfort with not needing the math - understanding the *category*, not the model

### Task 1.3 - Explain what a foundation model / large language model is at a high level

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `foundation-model`, `large-language-model`, `model-as-prediction` |

- **K:** LLM as a model trained on large text corpora that predicts likely next words; "foundation model" as a general-purpose base adaptable to many tasks; not a database, not a search engine, not a person
- **S:** Explain in one sentence, to a colleague, what an LLM does
- **A:** Demystification - it's a prediction engine, not a mind

### Task 1.4 - Describe what an AI agent (agentic AI) is and how it differs from a chatbot

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | Medium |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `agent-vs-chatbot`, `agentic-ai`, `ai-agent` |

- **K:** An agent as an AI that can take multi-step actions toward a goal (use tools, call other systems) rather than only replying; contrast with a single-turn chatbot; still requires human oversight and goals set by a person
- **S:** Recognize whether a described tool is "just answering" or "taking actions"
- **A:** Appropriate caution - more autonomy means more need for oversight (bridges to D3)

### Task 1.5 - Recall common AI use cases across everyday workplace functions

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `ai-in-the-workplace`, `ai-use-cases` |

- **K:** Typical use cases - drafting/summarizing text, answering questions, analyzing data, generating images, coding assistance, customer support, screening/triage
- **S:** Match a business need to a plausible AI use case (and spot a poor fit)
- **A:** Opportunity-awareness balanced with realism about limits

### Task 1.6 - Identify what current AI cannot reliably do

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-limitations`, `no-real-understanding`, `not-a-source-of-truth` |

- **K:** Current GenAI does not "know" facts, cannot guarantee correctness, has a knowledge cutoff, can't be assumed current, and does not truly reason like a person
- **S:** Flag a task where AI is the wrong or risky tool
- **A:** Healthy skepticism as a default posture (sets up D2 verification + D3 trust)

### Task 1.7 - Recall the core AI vocabulary: artificial intelligence, machine learning, generative AI, large language model, foundation model, and AI agent

| Attribute | Value |
|-|-|
| Domain | D1 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `ai-agent`, `foundation-model`, `generative-ai`, `large-language-model`, `machine-learning`, `what-is-ai` |

- **K:** The definitions of the core terms, and which term names which thing. That "AI" is the umbrella, machine learning a way of building it, generative AI a kind of machine learning, an LLM a kind of generative model, a foundation model a general-purpose base, and an agent a system that acts.
- **S:** Name the right term for a described system; recognize the term when a vendor or colleague uses it.
- **A:** Comfort with the vocabulary - enough to read a proposal, sit in a procurement meeting, and not be sold something by its label.

---

# Domain D2 - Working with Generative AI (36%)

**Description.** Prompting, capabilities and limits, hallucination, verification, and choosing when generative AI is the right tool.

**Tasks:** 6  |  **MCQ seats:** 9

## Tasks

### Task 2.1 - Explain what a prompt is and how it differs from a search query

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `natural-language-instruction`, `prompt`, `prompt-vs-search` |

- **K:** A prompt as a natural-language instruction to a model; unlike a search (which retrieves existing pages), a prompt asks the model to generate a response
- **S:** Rewrite a vague request as a clearer instruction
- **A:** Willingness to be explicit rather than terse

### Task 2.2 - Apply the basic elements of an effective prompt (role, context, task, constraints, format)

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `constraints-and-format`, `prompt-structure`, `role-context-task` |

- **K:** The five common building blocks - who the AI should act as (role), background (context), what to do (task), limits (constraints), and desired output shape (format)
- **S:** Improve a weak prompt by adding the missing elements
- **A:** Iterative mindset - prompting is a conversation, not a one-shot

### Task 2.3 - Describe the capabilities and limitations of current generative AI tools

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `genai-capabilities`, `genai-limitations`, `knowledge-cutoff` |

- **K:** Strong at drafting, summarizing, rephrasing, brainstorming, translating; weak/unreliable at exact facts, current events past a cutoff, arithmetic, citations, and anything requiring guaranteed accuracy
- **S:** Predict whether a given task will play to a strength or a weakness
- **A:** Matching the tool to the job rather than over-trusting it

### Task 2.4 - Explain what AI "hallucination" is and why it happens

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `confident-but-wrong`, `hallucination`, `plausible-not-true` |

- **K:** Hallucination as fluent, confident output that is factually wrong or invented (fake citations, made-up details); it stems from prediction of plausible text, not intent to deceive or a "bug" to report
- **S:** Recognize a likely hallucination in a sample output
- **A:** Treating confidence as no guarantee of correctness

### Task 2.5 - Verify and evaluate AI output before relying on it

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `check-sources`, `human-review`, `verify-outputs` |

- **K:** Verification habits - check facts against a trusted source, confirm citations exist, sanity-check numbers, never publish/act on unreviewed output for anything that matters
- **S:** Given an output and a use context, decide what must be verified before use
- **A:** Ownership - the human, not the AI, is accountable for the result

### Task 2.6 - Choose when generative AI is and is not the right tool for a task

| Attribute | Value |
|-|-|
| Domain | D2 |
| Criticality | Medium |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `right-tool-for-task`, `when-not-to-use-ai` |

- **K:** Good fits (first drafts, brainstorming, summaries) vs. poor/risky fits (authoritative facts, legal/medical/financial decisions, anything with confidential data or requiring guaranteed accuracy without review)
- **S:** Given a scenario, decide "use AI", "use AI then verify", or "don't use AI"
- **A:** Judgment over reflex - reaching for AI only where it genuinely helps

---

# Domain D3 - Responsible & Safe Use at Work (24%)

**Description.** Privacy, bias, human oversight, acceptable-use policy, and the ethical red lines of workplace AI use.

**Tasks:** 5  |  **MCQ seats:** 6

## Tasks

### Task 3.1 - Protect privacy and confidential data when using AI tools

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `data-leakage`, `data-privacy`, `no-secrets-in-prompts` |

- **K:** Why pasting confidential, personal, or client data into public AI tools is risky (it may be stored, used for training, or exposed); the difference between approved enterprise tools and public consumer ones
- **S:** Given a scenario, decide what is safe vs. unsafe to enter into a tool
- **A:** Instinctive caution with sensitive information ("don't paste secrets")

### Task 3.2 - Recognize bias and fairness risks in AI outputs

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Occasional |
| Bloom level | 2 (Understand) |
| Exam scope | Yes |
| Concept slugs | `ai-bias`, `bias-from-data`, `fairness-awareness` |

- **K:** AI can reflect and amplify bias present in its training data; outputs can be unfair or stereotyped, with real impact in hiring, lending, and similar high-stakes uses
- **S:** Spot a potentially biased or unfair output in an example
- **A:** Awareness that "the AI said so" is never a defense for an unfair outcome

### Task 3.3 - Apply the principle of human oversight (keeping a human in the loop)

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `accountability`, `human-in-the-loop`, `human-oversight` |

- **K:** A human must review and remain accountable for AI-assisted decisions, especially those affecting people; more autonomy/impact means more oversight
- **S:** Given a decision, judge whether a human must review it before it takes effect
- **A:** Owning the outcome; not outsourcing responsibility to the tool

### Task 3.4 - Recall the ethical red lines for workplace AI use and when disclosure is expected

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Daily |
| Bloom level | 1 (Remember) |
| Exam scope | Yes |
| Concept slugs | `acceptable-use-policy`, `disclosure-and-transparency`, `ethical-red-lines` |

- **K:** Organizations commonly set rules on which tools are approved, what data may be used, and when AI use must be disclosed; basic red lines (don't deceive, don't plagiarize, don't use AI to harm or discriminate); relevance of the EU AI Act's Article 4 literacy expectation at a plain-language level
- **S:** Given a workplace situation, identify the responsible action per typical policy
- **A:** Professional integrity - treating AI use as something to do openly and by the rules

### Task 3.5 - Apply the organization's AI-use policy to decide whether a specific use is permitted

| Attribute | Value |
|-|-|
| Domain | D3 |
| Criticality | High |
| Frequency | Weekly |
| Bloom level | 3 (Apply) |
| Exam scope | Yes |
| Concept slugs | `acceptable-use-policy`, `disclosure-and-transparency` |

- **K:** What an acceptable-use policy covers: approved tools, permitted data, required disclosure, prohibited uses. That an absent policy does not mean permission.
- **S:** Read a described situation and decide whether the intended AI use is permitted, needs disclosure, or is barred.
- **A:** Willingness to stop and ask rather than assume permission.

---

*Generated 2026-07-23 by scripts/gen-jta-doc.mjs from certification AIE-I (22222222-2222-2222-2222-222222222222).*
