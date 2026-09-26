# Audit sample — 40 English secure items per certification

**Read-only. Nothing here is a finding.** This is the sample for the decision in
`OPEN-ITEMS.md`: *should the secure pools get a source-conformance audit before
more exams run?*

English only, key marked, task code and statement, and **the source the
certification cites** in each section header — because the audit question is
whether an item is right against *its own* source.

**Seed `20260926`**, mulberry32, Fisher–Yates over ids sorted ascending.
Stratified by **domain** in proportion to `weight_pct`, largest remainder, so each
40 mirrors the blueprint the exam is actually assembled from.

**No overlap with the 342 already read.** Exclusion is by `question_group_id`, not
by id: the 342 are es-419 rows, and excluding by id would have let every one back
in through its English sibling. 337 English rows removed, 3829 eligible.

| cert | eligible | sampled | domain shortfalls |
|---|---|---|---|
| AIE-I | 72 | **40** | none |
| AIGRM-I | 459 | **40** | none |
| AIHR-I | 224 | **40** | none |
| AIMS-F | 280 | **40** | none |
| AIMS-IA | 320 | **40** | none |
| AISM-I | 408 | **40** | none |
| ISMS-F | 392 | **40** | none |
| ISMS-IA | 304 | **40** | none |
| SD-AI-I | 360 | **40** | none |
| SM-AI-I | 268 | **40** | none |
| SM-AI-II | 352 | **40** | none |
| SPO-AI-I | 389 | **40** | none |
| **total** | 3828 | **480** | |

---

# AIE-I — AI Essentials I

**Source this certification cites:** No single normative standard. Certidemy's own AI-essentials blueprint; claims about AI behaviour are checked against the cited vendor or research source in the item.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 1. AIE-I · D1 · task 1.1 · `6e696561`

> Distinguish artificial intelligence from ordinary software and automation

**A chatbot gives nuanced replies to supplier queries without being programmed for every question. A colleague calls it 'very complex conventional software.' Which reasoning best refutes that claim?**

- a) The colleague is correct: software handling enough edge cases becomes AI by definition.
- b) The colleague is wrong: the chatbot must be AI because it improves automatically with every query it handles.
- c) The colleague is wrong: any software producing impressive outputs qualifies as AI regardless of its design.
- **`KEY` d) The colleague is wrong: handling novel questions without explicit rules signals a learned model, not programmed logic.**

*explanation:* Responding sensibly to questions never explicitly programmed indicates the system learned patterns from data — the defining feature of AI. Complexity alone does not convert conventional software into AI, and AI does not automatically improve just by being used; retraining is required.

### 2. AIE-I · D1 · task 1.1 · `103eb564`

> Distinguish artificial intelligence from ordinary software and automation

**A company's invoice system rejects invoices missing a vendor ID, following rules a programmer wrote. A rival's system flags unusual amounts by learning from thousands of past invoices. What best explains the difference?**

- a) The rival's system is AI because it executes a far greater number of nested if-then rules than the first system, making its logic more complex.
- **`KEY` b) The rival's system is AI because its decision logic is derived from patterns learned in data, not from explicit rules a programmer wrote.**
- c) The rival's system is AI because it processes invoices faster and is engineered to handle a broader range of edge cases than the first system.
- d) Both systems are equally AI because both ultimately execute coded instructions on the same underlying hardware, making the source of logic irrelevant.

*explanation:* The defining distinction is how the logic was produced: rule-based automation follows explicit instructions a programmer wrote, while AI derives its outputs from patterns learned in data. Claiming the difference is about more complex if-then rules confuses scale with kind. Claiming both are the same because they run on hardware ignores that the source of decision logic is fundamentally different. Framing the difference as speed or edge-case volume mistakes execution characteristics for the underlying mechanism.

### 3. AIE-I · D1 · task 1.1 · `fdcd8167`

> Distinguish artificial intelligence from ordinary software and automation

**A payroll system applies a tax rate whenever salary exceeds a fixed threshold. Why is this NOT considered AI?**

- a) It handles only one task, and real AI must perform any intellectual task a human can.
- **`KEY` b) It executes explicit if-then rules a programmer wrote, rather than learning from data.**
- c) It runs too slowly to qualify as intelligent behavior in a business context.
- d) It runs on standard hardware rather than specialized AI infrastructure.

*explanation:* The defining distinction is how the logic was produced. Rule-based automation executes conditions a programmer wrote explicitly, whereas AI derives responses from patterns learned in data. Speed and hardware are irrelevant to this classification, and narrow task-specific systems can still qualify as AI.

### 4. AIE-I · D1 · task 1.2 · `5de3d76d`

> Distinguish machine learning and generative AI from traditional AI

**A fraud-detection system scores transactions against patterns learned from millions of past cases. No rules were hand-coded. Which category best describes this system?**

- a) Generative AI, because it produces a risk score as new output rather than retrieving a stored answer.
- b) Rule-based AI, because learned patterns ultimately function as sophisticated if-then logic.
- c) Generative AI, because scoring unlabeled transactions requires generating novel data representations.
- **`KEY` d) Machine learning, because it derives patterns from data rather than following hand-coded rules.**

*explanation:* A system that learns patterns from historical data without hand-coded rules is the textbook definition of machine learning. Generative AI is a subset of machine learning focused on producing new content such as text or images; a risk score is a classification prediction, not generated content, so both generative AI options are incorrect. The claim that learned patterns are just sophisticated if-then logic confuses rule-based systems with machine learning — rule-based systems require developers to explicitly write the logic, whereas machine learning derives it from data.

### 5. AIE-I · D1 · task 1.2 · `494911a3`

> Distinguish machine learning and generative AI from traditional AI

**A bank's system flags loan applications as 'approve' or 'decline' using rules written by analysts. Which category of AI does this represent?**

- a) Generative AI, because it produces a new output — an approve/decline decision — for each application it receives.
- b) Machine learning, because processing large volumes of application data constitutes automated learning.
- c) Machine learning, because the system refines its rules automatically as more applications are reviewed over time.
- **`KEY` d) Traditional AI, because it applies hand-coded rules to classify inputs rather than learning patterns from data.**

*explanation:* A system that applies analyst-written rules to classify inputs is traditional rule-based AI — no learning from data occurs. Processing high volumes of data does not make a system machine learning; what matters is whether patterns are learned from data rather than explicitly coded. Producing an output label does not make a system generative; generative AI creates new content such as text or images.

### 6. AIE-I · D1 · task 1.2 · `168199a8`

> Distinguish machine learning and generative AI from traditional AI

**An HR coordinator types a brief role description and an AI tool writes a full job posting draft. Which category best describes this tool?**

- a) Traditional AI, because it follows a structured template to fill in job-posting fields automatically.
- **`KEY` b) Generative AI, because it produces original text from a short prompt using patterns learned from data.**
- c) Generative AI, because it retrieves and reassembles stored job postings from its training database to form the draft.
- d) Machine learning classifier, because it predicts which job-posting format will attract the most applicants.

*explanation:* A tool that creates new text from a brief prompt is generative AI — it produces novel content using statistical patterns learned during training, not by retrieving stored documents. The option describing retrieval and reassembly reflects the misconception that generative AI works like a search engine. Following a fixed template describes rule-based traditional AI, not generative AI.

### 7. AIE-I · D1 · task 1.3 · `becaedee`

> Explain what a foundation model / large language model is at a high level

**An HR coordinator reads that a company is releasing a 'foundation model.' Which characteristic correctly distinguishes it from a ready-to-use specialist tool?**

- a) It gains real-time retrieval capability once adapted for a specific use case.
- b) It is designed exclusively for one industry and cannot be repurposed.
- c) It contains more verified facts because it was trained on a larger dataset.
- **`KEY` d) It is a general base adaptable to many tasks, not a single-task product.**

*explanation:* A foundation model is a general-purpose base meant to be adapted, not a finished single-task product. Larger training data does not mean verified facts, adaptation does not add real-time retrieval, and the model is not locked to one domain.

### 8. AIE-I · D1 · task 1.4 · `52df64e5`

> Describe what an AI agent (agentic AI) is and how it differs from a chatbot

**A finance analyst uses a chatbot to answer budget questions and an AI agent to reconcile monthly expense reports. What is the clearest difference between these two tools?**

- a) The agent connects to live internet sources to retrieve current financial data, while the chatbot draws exclusively on its pre-trained knowledge base.
- b) The agent maintains a larger context window, allowing it to retain and reference more of the prior conversation history than the chatbot can.
- **`KEY` c) The agent pursues a goal by executing multiple steps autonomously; the chatbot responds only to each individual prompt as it is received.**
- d) The agent generates longer, more detailed responses to each query, while the chatbot is designed to return brief, simplified answers.

*explanation:* The defining difference is autonomy and goal-directed action across steps: the agent works toward completing the reconciliation task without requiring a prompt at each step, while the chatbot waits for each new question before responding. Context window size, response length or complexity, and internet access are secondary features that do not capture this core architectural distinction.

### 9. AIE-I · D1 · task 1.4 · `5deaec2e`

> Describe what an AI agent (agentic AI) is and how it differs from a chatbot

**Which statement best explains why an AI agent requires more human oversight than a typical chatbot?**

- a) Agents require human approval before every step, making oversight identical to chatbot use.
- b) Agents are more accurate than chatbots, so oversight is needed only to confirm correct results.
- c) Agents generate longer responses, so reviewers need more time to verify each reply.
- **`KEY` d) Agents take autonomous multi-step actions, so early errors can compound before a human notices.**

*explanation:* Because an agent acts across multiple steps without waiting for a prompt each time, a mistake early in the sequence can affect every subsequent step before a person intervenes. This compounding risk is what makes oversight more critical for agents than for chatbots. Agents are not inherently more accurate, and response length is not the relevant factor.

### 10. AIE-I · D1 · task 1.5 · `31c5b7c2`

> Recall common AI use cases across everyday workplace functions

**Which task is a well-established AI use case in an HR department?**

- **`KEY` a) Drafting job postings and summarizing applicant materials for recruiter review.**
- b) Replacing HR coordinators entirely for onboarding, since AI manages all scheduling and data.
- c) Autonomously selecting and hiring candidates, because AI removes subjectivity from decisions.
- d) Setting compensation strategy and approving offer letters without recruiter involvement.

*explanation:* AI tools are widely used in HR to draft job postings and summarize applicant materials, keeping humans in the review loop. Autonomous hiring decisions, setting compensation strategy, and fully replacing HR staff are not established AI use cases and exceed what current tools reliably do.

### 11. AIE-I · D1 · task 1.5 · `d84abf8b`

> Recall common AI use cases across everyday workplace functions

**A finance analyst uses an AI tool to flag unusual figures in an expense report. What must the analyst still provide?**

- **`KEY` a) Human judgment to assess context, confirm genuine issues, and decide on next steps.**
- b) Script edits, because AI finance tools require programming updates before each new report is processed.
- c) A manual recount of all figures, because AI anomaly detection is too unreliable to use as a starting point.
- d) Nothing further, because AI flags items objectively and its output can be approved without additional review.

*explanation:* AI can surface anomalies efficiently, but a human must apply contextual judgment to confirm whether flagged items are real problems and decide on action. The claim that AI processes data without bias or error — and that its output needs no further review — is a common and risky misconception. Requiring a full manual recount misunderstands AI's role as a useful, if imperfect, starting point.

### 12. AIE-I · D1 · task 1.6 · `9ab28dc8`

> Identify what current AI cannot reliably do

**A marketing associate asks an AI tool to list the top five industry reports published last month and receives a fluent, detailed response with specific titles and authors. Why should she treat this output with skepticism?**

- a) AI retrieves real sources but sometimes misquotes author names under processing constraints.
- b) AI refines its factual accuracy during a conversation, so only the first answer is unreliable.
- **`KEY` c) AI has a training cutoff and no live access, so recent titles and authors may be fabricated.**
- d) AI signals uncertainty about recent events, so a confident answer here indicates a system error.

*explanation:* AI models have a training cutoff and no live access to new publications, so they can generate plausible-sounding but entirely invented titles and authors — a phenomenon called hallucination. The claim that AI retrieves real sources is false. Confident phrasing does not signal a system error. AI does not learn or self-correct within a single conversation session.

### 13. AIE-I · D1 · task 1.6 · `cc75e0dd`

> Identify what current AI cannot reliably do

**An office manager relies on an AI tool as an authoritative reference because it explains a complex tax concept clearly and in plain language. What does fluent output actually indicate about AI?**

- a) Fluent output signals the AI is asserting a belief it stands behind, similar to a human expert.
- **`KEY` b) Fluent output indicates the AI generated statistically coherent text, not that the content is correct.**
- c) Fluent output confirms the AI cross-checked the explanation against verified tax authority sources.
- d) Fluent output reflects genuine comprehension, comparable to understanding shown by a qualified expert.

*explanation:* Fluency is a property of the text generation process, not a measure of accuracy or understanding. AI produces well-formed language by predicting likely word sequences, which can sound expert-level while being factually wrong. AI does not comprehend concepts as humans do, does not verify against authoritative sources, and does not hold or assert beliefs.

### 14. AIE-I · D1 · task 1.6 · `06a72d49`

> Identify what current AI cannot reliably do

**An HR coordinator copies an AI-generated summary of labor regulations into a policy document without checking it. Which characteristic of current AI makes this approach risky?**

- a) AI only summarizes sources it has fully read, so errors arise only from poorly written source documents.
- b) AI intentionally omits details it is uncertain about, so summaries are always incomplete by design.
- c) AI applies genuine legal reasoning but may conflict with local jurisdiction rules.
- **`KEY` d) AI cannot guarantee factual correctness, so plausible regulatory text may still be inaccurate.**

*explanation:* Current AI produces statistically likely text, not verified facts, so regulatory summaries can sound authoritative while containing errors — making independent verification essential. AI does not reliably omit uncertain details, does not read actual source documents, and does not apply genuine legal reasoning.

### 15. AIE-I · D1 · task 1.7 · `b890ec48`

> Recall the core AI vocabulary: artificial intelligence, machine learning, generative AI, large language model, foundation model, and AI agent

**A procurement document refers to 'a large general-purpose model trained broadly and later adapted for many different uses.' Which term matches?**

- a) AI agent, because only a system that acts across many tasks qualifies as general-purpose in deployment.
- b) Large language model, because broad text training makes any model general-purpose and reusable across tasks.
- c) Generative AI, because producing diverse outputs is what makes a model broadly applicable across use cases.
- **`KEY` d) Foundation model, because it is trained broadly and serves as a base adapted to many downstream uses.**

*explanation:* Foundation model is the term for a large, broadly trained base model adapted to many uses. A large language model is a specific type of foundation model focused on text, so it is narrower than the definition given. Generative AI describes an output type, not a model architecture, and an AI agent is defined by autonomous action.

### 16. AIE-I · D1 · task 1.7 · `461c2428`

> Recall the core AI vocabulary: artificial intelligence, machine learning, generative AI, large language model, foundation model, and AI agent

**A vendor describes a tool that 'generates new text, images, and audio rather than just classifying inputs.' Which term best fits?**

- a) Machine learning, because classification and generation are both standard outputs of the same technique.
- b) Large language model, because only text-based systems can produce genuinely new content across modalities.
- **`KEY` c) Generative AI, because it is the branch of machine learning that produces new content across multiple modalities.**
- d) AI agent, because creating content across modalities requires autonomous multi-step planning and tool use.

*explanation:* Generative AI names the subset of machine learning whose output is new content — text, images, audio, or code. A large language model handles only text, and an AI agent is defined by autonomous goal-directed action, not by multi-modal content generation.

### 17. AIE-I · D2 · task 2.1 · `9d6d54d0`

> Explain what a prompt is and how it differs from a search query

**Manager A prompts an AI: 'Summarize.' Manager B prompts: 'Summarize key payment terms and deadlines in three bullet points.' Their outputs differ significantly. What best explains this?**

- a) Manager A's short prompt triggers retrieval mode, while Manager B's longer text activates generation mode.
- b) Any phrasing clear to a human reader produces equally good results, so the difference is random variation.
- **`KEY` c) Manager B's prompt is more specific, giving the model clearer guidance on content and format.**
- d) Manager B's prompt is translated into formal query syntax internally, retrieving a more precise document.

*explanation:* Prompt specificity directly shapes what the model generates. A vague instruction like 'Summarize' leaves the model to guess scope and format, while specifying content focus and structure guides it toward a more useful output. Human readability does not equal model clarity — instruction detail matters. No internal syntax translation or mode-switching occurs.

### 18. AIE-I · D2 · task 2.1 · `360d6996`

> Explain what a prompt is and how it differs from a search query

**An HR coordinator tells a generative AI tool: 'Write a polite rejection email for a candidate who lacks the required certification.' What is this instruction best described as?**

- a) A database query, because the tool looks up stored email templates to fulfill the request.
- b) A search query, because the coordinator is asking the system to find an existing rejection email.
- c) A command script, because writing tasks require structured syntax for the model to process correctly.
- **`KEY` d) A prompt, because it is a natural-language instruction directing the model to generate new content.**

*explanation:* A prompt is a natural-language instruction given to a generative AI model to produce new output. The coordinator's instruction is plain language directing the model to write something — that is the definition of a prompt. It is not a search query (no retrieval of existing documents), not a database lookup, and no special syntax is required.

### 19. AIE-I · D2 · task 2.1 · `cd87548f`

> Explain what a prompt is and how it differs from a search query

**A marketing associate types 'best email subject lines' into a search engine, then types 'Write three catchy email subject lines for a summer sale on outdoor furniture' into a generative AI tool. How do these two actions fundamentally differ?**

- a) The search query returns live content; the prompt retrieves a pre-written response stored during model training.
- b) The search query returns basic results; the prompt searches a smarter, more current database of web content.
- **`KEY` c) The search query retrieves indexed web pages; the prompt instructs the model to generate a new, original response.**
- d) The search query uses plain language; the prompt requires special command syntax for the model to understand it.

*explanation:* Search engines retrieve existing, indexed documents from the web. Generative AI tools receive a prompt and produce a brand-new response rather than fetching stored content. The 'smarter database' distractor wrongly frames the AI as a superior search engine. The 'pre-written response' distractor confuses generation with retrieval from training data. The 'special command syntax' distractor incorrectly implies prompts require formal programming-style commands.

### 20. AIE-I · D2 · task 2.2 · `01b67fc6`

> Apply the basic elements of an effective prompt (role, context, task, constraints, format)

**A finance analyst's prompt reads: 'Summarize this budget report.' A colleague suggests adding 'for a department head who is not a finance specialist.' What does this audience specification primarily change?**

- a) Nothing substantive, because audience details are stylistic preferences that do not affect content.
- **`KEY` b) The depth of explanation, examples chosen, and structure—not just individual word choices.**
- c) The model's knowledge base, enabling it to access simpler financial concepts it would not otherwise use.
- d) Only the vocabulary, substituting plain words for technical terms while keeping depth and structure the same.

*explanation:* Specifying the audience shapes how deeply concepts are explained, which analogies the model selects, and how the response is structured—not merely which words are chosen. Claiming audience specification only swaps vocabulary is a common misconception; it actually changes the entire framing of the output. The model's underlying knowledge base is not altered by prompt context, and audience details are not merely stylistic—they directly affect content decisions.

### 21. AIE-I · D2 · task 2.2 · `e0c92dbc`

> Apply the basic elements of an effective prompt (role, context, task, constraints, format)

**A team leader writes: 'Write a formal email declining Vendor X's proposal. Keep it under 150 words. Do not mention pricing. Use three short paragraphs.' Why is the 'under 150 words' constraint appropriate here?**

- a) It is appropriate only because 'formal' is present; without a tone instruction, a word limit produces a poor result.
- b) It is redundant because the three-paragraph format already controls length, making the word count unnecessary.
- **`KEY` c) It matches the context: a brief decline email needs no elaboration, and the limit prevents unnecessary padding.**
- d) It is not appropriate, because word limits tend to force the model to omit important information and reduce output quality.

*explanation:* A word limit is a constraint that bounds output length; when the task is a short professional email, the limit aligns with the real-world need and prevents over-elaboration. Word limits do not inherently degrade quality—they focus the output. The tone instruction and word limit serve different purposes and neither depends on the other. Paragraph structure organizes content, while a word ceiling caps total length; the two constraints coexist without being redundant.

### 22. AIE-I · D2 · task 2.3 · `f81a7392`

> Describe the capabilities and limitations of current generative AI tools

**A sales rep asks a generative AI tool about market share figures from an industry report released two months ago. The tool's knowledge cutoff is eight months ago. Why may the tool lack this information?**

- a) The tool has the data but withholds it, because industry figures are treated as confidential by default.
- b) The tool can retrieve the report in real time if the representative explicitly requests an internet search.
- c) The cutoff applies only to news events, so published research reports remain accessible regardless of date.
- **`KEY` d) The report postdates the training cutoff, so the tool has no knowledge of it unless connected to a live data source.**

*explanation:* A knowledge cutoff means the model's training data ends at that point; content published after the cutoff is absent from what the model learned. The tool does not withhold information deliberately, cannot retrieve live data by default, and the cutoff applies to all content types, not only news.

### 23. AIE-I · D2 · task 2.3 · `b2164ad0`

> Describe the capabilities and limitations of current generative AI tools

**A teacher shares an article with a generative AI tool, then asks a detailed factual question about a topic not mentioned anywhere in the article. What is the most accurate description of the tool's likely behavior?**

- a) The tool will refuse, correctly recognizing the topic is outside the document's scope.
- b) The tool will answer reliably because questions outside the document automatically trigger a higher-accuracy response mode.
- **`KEY` c) The tool may draw on training data to answer but could produce inaccurate information not constrained by the document.**
- d) The tool will answer accurately by combining the article's content with verified facts from its training data.

*explanation:* When a question goes beyond the provided document, the tool draws on its training data, which may contain inaccuracies or outdated information. The tool does not reliably distinguish between what the document says and what it learned elsewhere, does not refuse out-of-scope questions automatically, and has no higher-accuracy mode triggered by out-of-document queries.

### 24. AIE-I · D2 · task 2.4 · `8523c745`

> Explain what AI "hallucination" is and why it happens

**Which statement correctly distinguishes a hallucination from a typical software error?**

- **`KEY` a) A hallucination is fabricated output produced fluently and confidently; a software error causes crashes or garbled output.**
- b) A hallucination is an intentional deception by the model; a software error is an unintentional mistake introduced during development.
- c) Hallucinations only occur in older AI systems; modern models produce software errors instead when they lack sufficient information.
- d) A hallucination is a bug in the model's code that developers can fix; a software error is a hardware-level failure.

*explanation:* Hallucinations are fluent, confident, fabricated outputs that arise from how the model predicts plausible text — they are not crashes, garbled output, or intentional deceptions, and they are not patchable bugs. Modern, well-designed AI systems hallucinate; this is not a defect limited to older or poorly built tools.

### 25. AIE-I · D2 · task 2.5 · `ec8aede0`

> Verify and evaluate AI output before relying on it

**An HR coordinator asks an AI tool to summarize a candidate's CV and uses the summary to shortlist applicants. Which action correctly fulfills the coordinator's verification responsibility?**

- a) Find the summary plausible and well-written, then forward it to the hiring manager without further review.
- **`KEY` b) Compare the AI summary against the original CV to confirm all key details are accurate before acting on it.**
- c) Check only for grammar errors, since factual accuracy is guaranteed when the source document was supplied.
- d) Accept the summary without checking because providing the CV in the prompt ensures the output mirrors it accurately.

*explanation:* Even when an AI is given an accurate source document, it can misread, omit, or distort details in its summary. The coordinator must compare the summary to the original CV before making hiring decisions. Finding an output plausible is not active verification, and checking only for grammar misses the factual accuracy that matters in a shortlisting context.

### 26. AIE-I · D2 · task 2.5 · `f04c9a90`

> Verify and evaluate AI output before relying on it

**A sales rep asks an AI tool to draft a follow-up email containing a competitor pricing claim. The rep reads the email and finds the claim believable. What is the correct next step?**

- a) Accept the claim as accurate because AI training data includes current competitor pricing information.
- b) Send the email because reading it and finding it believable constitutes adequate review.
- **`KEY` c) Confirm the pricing claim against a reliable, independent source before sending the email.**
- d) Send the email after running the same prompt in another AI tool to see whether both state the same price.

*explanation:* Finding a claim believable after reading is not the same as verifying it; the representative must check the pricing against an independent, reliable source before sending it to a customer. Two AI tools drawing on similar training data can reproduce the same error, so agreement between them is not independent verification.

### 27. AIE-I · D2 · task 2.5 · `a08a20b3`

> Verify and evaluate AI output before relying on it

**A marketing associate uses an AI tool to draft a product fact sheet with three cited studies—author names, publication years, and page numbers. Before sending it to customers, what should the associate do?**

- a) Run the prompt in a second AI tool; matching citations from both outputs confirm the references are correct.
- b) Accept the citations as genuine because specific page numbers and authors indicate real retrieval, not fabrication.
- c) Search each title online; if it appears in results, the citation is accurate and no further checking is needed.
- **`KEY` d) Retrieve each study and confirm it exists and supports the specific claims in the fact sheet.**

*explanation:* AI tools can generate plausible-looking but fabricated citations complete with authors, dates, and page numbers. The associate must retrieve each source and verify it both exists and actually supports the stated claim. A title appearing in search results does not confirm the AI represented the content accurately, and agreement between two AI outputs does not constitute independent verification.

### 28. AIE-I · D2 · task 2.6 · `4a9fd209`

> Choose when generative AI is and is not the right tool for a task

**A sales rep is about to paste a client's confidential contract into a public AI chatbot for a plain-language summary. What should the rep do instead?**

- **`KEY` a) Summarize manually or use an approved internal tool that keeps data private.**
- b) Proceed, because being able to perform the task confirms AI is the right tool here.
- c) Proceed, because AI handles sensitive documents more reliably than a human reader.
- d) Proceed, because reviewing the AI summary afterward removes any data-handling risk.

*explanation:* Pasting confidential client data into a public AI tool creates a data-exposure risk regardless of how the output is used. Reviewing the AI summary does not undo the fact that sensitive information was already shared externally. The correct action is to use a safe, approved alternative.

### 29. AIE-I · D2 · task 2.6 · `cbbbca49`

> Choose when generative AI is and is not the right tool for a task

**An office manager needs to total 15 expense receipts before submitting a reimbursement form. What is the most appropriate tool?**

- a) An AI tool, because it is faster and reduces the chance of human arithmetic error.
- b) An AI tool, because numerical tasks are where AI is most accurate and reliable.
- c) An AI tool, because it can total the figures and flag any unusual amounts simultaneously.
- **`KEY` d) A calculator or spreadsheet, because simple arithmetic on known figures needs no generative AI.**

*explanation:* Adding 15 numbers is a trivial task that a calculator or spreadsheet performs with guaranteed accuracy. Generative AI is not designed for precise arithmetic and can produce wrong totals. Speed, anomaly detection, and perceived numerical reliability are not valid reasons to use a less reliable tool when a simpler one handles the task perfectly.

### 30. AIE-I · D2 · task 2.6 · `4d2a1e34`

> Choose when generative AI is and is not the right tool for a task

**An operations lead needs to look up one supplier's delivery lead time stored in the team's existing spreadsheet. What is the most appropriate action?**

- a) Use AI, because adopting the most advanced tool available for routine tasks keeps the team's skills current and competitive.
- b) Use AI, because it retrieves a single structured value from a known spreadsheet faster than opening the file directly.
- **`KEY` c) Look up the value directly in the spreadsheet, since a simple structured lookup in an existing file needs no AI involvement.**
- d) Use AI, because it can simultaneously validate the lead time value and flag any data-entry errors elsewhere in the spreadsheet.

*explanation:* A single-cell lookup in an existing spreadsheet is faster, more accurate, and simpler than involving a generative AI tool. AI adds no value here and introduces unnecessary steps. Claims about retrieval speed, keeping skills current, or simultaneous error-checking do not justify using a more complex tool for a trivial retrieval task.

### 31. AIE-I · D3 · task 3.1 · `605ca292`

> Protect privacy and confidential data when using AI tools

**A team leader must polish a draft containing merger deal terms and counterparty names. Her organization has an approved internal AI tool available. What should she do?**

- a) Use the public tool after replacing company names with generic labels; pseudonyms prevent the data from being traced back.
- **`KEY` b) Use the approved internal AI tool, which is governed by organizational data-handling policies suited for confidential content.**
- c) Use the public tool; hosting in the same country as her organization ensures automatic compliance with local privacy laws.
- d) Use the public tool; AI processes text in real time only and confidential content is not retained after the session.

*explanation:* When an organization-approved AI tool exists, employees should use it for sensitive work because its data-handling terms are vetted and aligned with organizational policy. Public tools may retain inputs regardless of session length, and geographic hosting does not guarantee regulatory compliance or confidentiality.

### 32. AIE-I · D3 · task 3.1 · `20d2f10e`

> Protect privacy and confidential data when using AI tools

**An operations lead replaces two employees' names with 'Employee A' and 'Employee B' before pasting a full dispute narrative into a public AI tool. What is the most accurate assessment?**

- a) Sufficient — pseudonyms replace identifying information, so the data no longer qualifies as personal under privacy rules.
- b) Insufficient only if the AI provider is located in a different country from where the employees work.
- **`KEY` c) Insufficient — job titles, dates, and incident details can still identify individuals even without their names.**
- d) Sufficient — free-text case descriptions are not structured data and fall outside data privacy requirements.

*explanation:* Replacing names with pseudonyms does not fully anonymize a narrative. Specific roles, dates, and incident details can still identify individuals. True anonymization requires removing or generalizing all re-identifying details, and free-text descriptions of real people are subject to the same privacy rules as structured records.

### 33. AIE-I · D3 · task 3.3 · `e12203e1`

> Apply the principle of human oversight (keeping a human in the loop)

**A sales rep uses an AI tool to draft personalized discount offers. The tool sends all offers automatically without the rep reviewing each one. What is the key problem with this workflow?**

- **`KEY` a) No accountable person reviews each offer before it reaches clients, removing human oversight from the process.**
- b) The rep is available to intervene if needed, so human oversight is already satisfied by their presence.
- c) The offers are low-stakes, so the main risk is reputational rather than a meaningful accountability gap.
- d) The rep approved the workflow setup, so each automatically sent offer counts as having been reviewed.

*explanation:* Human-in-the-loop requires active review before a decision takes effect, not merely the availability of a person who could intervene. When offers are sent automatically, no accountable human has approved each one, which is the core oversight failure. Approving a workflow once does not constitute reviewing the individual decisions that workflow produces.

### 34. AIE-I · D3 · task 3.3 · `4eec16bf`

> Apply the principle of human oversight (keeping a human in the loop)

**A teacher uses an AI tool to generate individualized feedback for 30 student assignments. To save time, the teacher publishes all comments without reading them. What should the teacher do instead?**

- a) Publish the comments but keep an audit log so errors can be corrected after students read them.
- b) Publish the comments, since configuring the AI tool already counts as exercising professional judgment.
- **`KEY` c) Read and approve each comment before publishing, because the teacher is accountable for student feedback.**
- d) Publish only high-confidence comments and manually write the rest, since AI confidence scores indicate reliability.

*explanation:* The teacher is accountable for feedback delivered to students and must review each comment before it reaches them. Publishing first and auditing later does not satisfy prior human oversight. Configuring a tool is not the same as reviewing its individual outputs. Filtering by AI confidence still skips human review of the published comments and treats a confidence score as a substitute for judgment.

### 35. AIE-I · D3 · task 3.3 · `5dee04c3`

> Apply the principle of human oversight (keeping a human in the loop)

**An HR coordinator uses an AI tool to screen job applications. The tool ranks candidates and flags its top choices. What should the coordinator do before any candidate is rejected?**

- a) Log every rejection decision in the HR system for a post-hire audit, because documenting outcomes after the fact satisfies the organization's human-oversight requirement.
- b) Accept the AI rankings without modification, because overriding data-driven scores without documented cause introduces subjective bias into the process.
- **`KEY` c) Personally review each ranking and approve or override rejections, because hiring accountability stays with the coordinator.**
- d) Verify that the AI produced no uncertainty or confidence warnings, then allow the flagged rejections to proceed automatically without further review.

*explanation:* Accountability for employment decisions stays with the coordinator, who must review and approve each rejection before it takes effect. Accepting rankings without review wrongly defers responsibility to the tool. Waiting for an uncertainty flag treats AI silence as approval, which it is not. Post-hoc auditing does not substitute for prior review when decisions affect real candidates.

### 36. AIE-I · D3 · task 3.3 · `174edb6e`

> Apply the principle of human oversight (keeping a human in the loop)

**A finance analyst uses an AI tool to generate a supplier risk report. The tool recommends dropping a supplier. The analyst agrees and forwards the recommendation unchanged. Who is accountable for that decision?**

- **`KEY` a) The analyst, because responsibility stays with the person who reviewed and forwarded the recommendation.**
- b) The AI vendor, because the recommendation originated from the vendor's model and data processing.
- c) Both the analyst and the AI model, split in proportion to each one's contribution to the recommendation.
- d) The procurement team, because accountability transfers to whoever acts on the forwarded recommendation.

*explanation:* Accountability cannot be transferred to a tool or its vendor; it stays with the human who reviewed and acted on the output. AI systems hold no legal or moral accountability, so a shared-responsibility split is not valid. The procurement team executes the decision, but the analyst, as the reviewing professional, owns the recommendation they chose to forward.

### 37. AIE-I · D3 · task 3.5 · `eb2175f4`

> Apply the organization's AI-use policy to decide whether a specific use is permitted

**A sales representative used an approved AI tool to generate 80% of a client report and wrote the remaining 20% manually. The policy requires disclosure when AI materially contributes to client-facing work. What must the representative do?**

- a) Skip disclosure, because tool approval implicitly covers all transparency obligations for that report.
- b) Skip disclosure, because a generic footer disclaimer on all company documents already satisfies the requirement.
- **`KEY` c) Disclose AI use, because the policy requires it when AI materially contributed to the report.**
- d) Skip disclosure, because the representative authored 20% of the content, so AI did not produce the full document.

*explanation:* The policy triggers disclosure when AI materially contributes, not only when it produces 100% of the content. A boilerplate footer does not satisfy a specific disclosure requirement, and tool approval addresses permitted use, not transparency obligations.

### 38. AIE-I · D3 · task 3.5 · `1d93b7ea`

> Apply the organization's AI-use policy to decide whether a specific use is permitted

**An office manager regularly uses an AI tool to draft internal memos. A colleague claims acceptable-use policies apply only to IT staff. What should the office manager do?**

- a) Continue without checking, because memo drafting is routine work that acceptable-use policies do not address.
- b) Continue without checking, because non-IT staff are not bound by IT compliance policies.
- c) Continue without checking, because the tool is publicly available and therefore within acceptable use.
- **`KEY` d) Review the acceptable-use policy, because it applies to all employees who use AI tools for work tasks.**

*explanation:* Acceptable-use policies govern any employee using AI tools for organizational work, not only IT staff. Public availability does not grant organizational approval, and routine tasks like memo drafting are not exempt from policy requirements.

### 39. AIE-I · D3 · task 3.5 · `3479ebab`

> Apply the organization's AI-use policy to decide whether a specific use is permitted

**A team leader's manager verbally approves using an AI tool not listed in the acceptable-use policy to prepare a board-meeting presentation. What should the team leader do?**

- **`KEY` a) Seek written approval through the proper channel before using the unlisted tool, despite the verbal endorsement.**
- b) Use the tool, because presentation drafting is low-risk and not covered by acceptable-use policies.
- c) Use the tool, because a direct manager's verbal approval overrides the written policy for this project.
- d) Use the tool, because policy silence on a tool implies permission when a manager endorses its use.

*explanation:* A verbal managerial endorsement does not override or amend a written acceptable-use policy; formal written approval through the proper channel is required. The policy applies to all work tasks including presentation drafting, and silence on a tool does not grant permission.

### 40. AIE-I · D3 · task 3.5 · `5ac02fec`

> Apply the organization's AI-use policy to decide whether a specific use is permitted

**An operations lead wants to paste aggregated, non-personal supply-chain data into a public AI chatbot to generate a supplier comparison. The policy prohibits entering internal business data into unapproved external tools. What should the lead do?**

- a) Proceed, because supply-chain data carries no confidential label and is outside the policy's scope.
- b) Proceed, because aggregated data contains no personal information, removing any policy barrier.
- c) Proceed, because the chatbot is publicly available, satisfying the policy's requirements for external tools.
- **`KEY` d) Refrain and request approval, because internal business data is covered by the policy even when aggregated.**

*explanation:* The policy covers internal business data, not only personally identifiable or labeled-confidential data. Aggregation removes personal identifiers but does not reclassify internal data as freely shareable, and public availability of a tool does not make it an approved tool.

---

# AIGRM-I — AI Governance & Risk Management I

**Source this certification cites:** ISO/IEC 42001:2023, the EU AI Act, and the NIST AI Risk Management Framework.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 41. AIGRM-I · D1 · task 1.10 · `dcca8c4b`

> Recall the actors in the AI value chain: provider, deployer, distributor, importer, affected person

**A provider sells an AI recruitment tool to a hiring company, which uses the tool to rank job applicants. Which value-chain role does the hiring company hold?**

- **`KEY` a) Deployer, because it uses the system under its own authority to make consequential operational decisions.**
- b) Affected person, because its hiring outcomes are directly shaped by the AI system's recommendations.
- c) Provider, because it profits commercially from the tool and shares responsibility for how candidates are ranked.
- d) Distributor, because it is the final organizational link before applicants experience the system's output.

*explanation:* The hiring company is a deployer: it uses the AI system under its own authority to make decisions in its own operational context. Job applicants ranked by the tool are the affected persons, not the hiring company. The hiring company does not become a provider merely by profiting from the tool's use, nor a distributor simply because applicants are downstream of its decisions.

### 42. AIGRM-I · D1 · task 1.4 · `c1241613`

> Identify the actors in the AI value chain and how their responsibilities differ.

**A bank's credit-scoring AI denies a loan to an applicant who never interacted with the system and was unaware it was used. Under AI governance frameworks, how should this applicant be classified?**

- **`KEY` a) An affected person, because the system's output directly impacts them regardless of any prior interaction.**
- b) Not an affected person, because governance frameworks require direct interaction with the AI system.
- c) An end-user, because anyone subject to an AI decision is treated as a user under standard governance definitions.
- d) A deployer, because the bank processed their data on their behalf when submitting it to the system.

*explanation:* An affected person is any individual whose interests are materially impacted by an AI system's output, with no requirement for prior interaction or consent. The view that affected status requires direct interaction would exclude the very third parties governance frameworks are designed to protect. Classifying the applicant as an end-user conflates subject-of-decision with system operator, and treating the bank as acting on the applicant's behalf misapplies the deployer concept.

### 43. AIGRM-I · D1 · task 1.5 · `d25eb49c`

> Describe the characteristics of trustworthy AI and what each means in practice.

**A company withholds model weights and training data, citing trade secrets. A compliance officer concludes the system cannot satisfy accountability and transparency. Which description best characterizes this conclusion?**

- a) Incorrect; accountability is satisfied by regulatory compliance alone, making transparency disclosures optional.
- b) Correct; transparency requires full public disclosure of weights and training data for independent verification.
- **`KEY` c) Incorrect; accountability and transparency require assigned responsibility and appropriate disclosure, not full public release.**
- d) Correct for high-risk systems only; trade-secret protection overrides transparency obligations for low-risk systems.

*explanation:* Accountability and transparency mean responsibility is assigned and traceable and appropriate information is disclosed to relevant stakeholders—not that all technical artifacts must be publicly released. Proprietary systems can satisfy these properties through governance documentation, audit trails, and targeted disclosures. Equating the property with full public release, or reducing it to regulatory compliance alone, both misstate its requirements.

### 44. AIGRM-I · D1 · task 1.5 · `e00d736c`

> Describe the characteristics of trustworthy AI and what each means in practice.

**An AI team delegates all adversarial-robustness testing to the cybersecurity group and makes no model-level design changes. Which trustworthy AI property is most directly misunderstood?**

- a) Fairness, because adversarial inputs disproportionately affect protected groups and must be addressed in model design.
- **`KEY` b) Security and resilience, because model-level design choices—not only infrastructure controls—determine adversarial robustness.**
- c) Validity and reliability, because robustness testing is part of ensuring consistent performance across conditions.
- d) Accountability and transparency, because responsibility for traceability has been incorrectly transferred to another team.

*explanation:* Security and resilience require that the AI model itself be designed to withstand adversarial attacks; delegating this entirely to IT infrastructure ignores model-level vulnerabilities such as prompt injection or adversarial examples that infrastructure controls cannot address. Accountability and validity are real properties but are not the primary gap created by this delegation decision.

### 45. AIGRM-I · D1 · task 1.7 · `4ade89a3`

> Distinguish the types of governance instrument and what each is for.

**A legislature enacts an AI law with fines for violations. An international body publishes a voluntary AI risk framework. Which statement best distinguishes these two instruments?**

- a) The framework gains legal force equal to the law once an organization publicly commits to adopting it.
- b) Both are enforceable, but the framework applies only to large organizations while the law covers all sizes equally.
- c) The law prescribes exact technical controls; the framework sets only high-level goals, making them opposites in specificity.
- **`KEY` d) The law carries state-backed penalties for non-compliance; the framework guides practice but has no inherent legal force.**

*explanation:* Binding regulation derives its force from the state and carries penalties for non-compliance, whereas a voluntary framework is adopted by choice and has no inherent legal enforceability. The claim that laws always prescribe exact technical controls is false—many set outcome-based obligations rather than specific implementation steps. A public commitment to a voluntary framework does not transform it into law; it remains guidance. The claim that both instruments are enforceable conflates legal mandate with voluntary adoption.

### 46. AIGRM-I · D1 · task 1.7 · `941b4528`

> Distinguish the types of governance instrument and what each is for.

**A governance professional describes ISO 42001 as 'a certifiable standard defining an auditable management system for AI.' Which instrument type does this match?**

- a) Binding regulation, because ISO is an official international body whose publications carry legal force in member states.
- b) Voluntary framework, because ISO 42001 is non-binding and therefore equivalent to any voluntary framework.
- c) Binding regulation, because a regulator mandating certification to it transforms the standard itself into a regulation.
- **`KEY` d) Management-system standard, because it defines auditable organizational processes that enable third-party certification.**

*explanation:* A management-system standard defines an auditable organizational system and enables third-party certification — the hallmark of ISO 42001. ISO publications are not binding law; official authorship does not equal legal enforceability. When a regulator references a standard, compliance becomes a regulatory requirement, but the standard itself does not become a regulation. Management-system standards and voluntary frameworks are also distinct: the former is certifiable, the latter is not.

### 47. AIGRM-I · D2 · task 2.1 · `82c92444`

> Explain the purpose and structure of an AI risk-management framework, including Govern, Map, Measure, and Manage.

**A governance team runs a comprehensive bias evaluation before launch, then considers risk assessment complete. Which misconception does this reflect?**

- a) That Map outputs expire only when the model is retrained, so no further context review is needed post-deployment.
- b) That Govern is complete once policies are published, removing the need for ongoing accountability checks.
- **`KEY` c) That Measure is a one-time pre-deployment audit rather than continuous tracking as the system and environment evolve.**
- d) That Manage is only triggered after an incident, so proactive monitoring falls outside the framework's scope.

*explanation:* Measure requires ongoing tracking of risk metrics because the system, user base, and operating environment change after deployment. Treating a single pre-launch evaluation as sufficient conflates a point-in-time audit with the continuous monitoring Measure demands. The other options describe real misconceptions about Map, Govern, and Manage respectively, but none matches the scenario described.

### 48. AIGRM-I · D2 · task 2.10 · `07407a8f`

> Explain human oversight as a primary control for consequential AI.

**Automation bias is cited as a risk to human-in-the-loop controls. Which explanation correctly describes why it undermines those controls?**

- a) Automation bias increases review speed, strengthening throughput while reducing depth of engagement per decision.
- **`KEY` b) Humans routinely defer to AI recommendations, making formal approval authority an ineffective substantive check.**
- c) Automation bias is irrelevant because the human retains formal authority to reject any AI recommendation.
- d) Automation bias affects only human-on-the-loop systems, where humans are less engaged per decision cycle.

*explanation:* Formal authority to reject does not guarantee substantive scrutiny. Automation bias—the tendency to over-rely on automated outputs—means humans may approve AI recommendations without genuine independent evaluation, hollowing out the control even when the structural loop is intact. Retaining formal veto power does not neutralize the psychological tendency to defer, which is why meaningful oversight must be designed to counteract bias, not just grant authority.

### 49. AIGRM-I · D2 · task 2.10 · `885ef8e7`

> Explain human oversight as a primary control for consequential AI.

**A program director proposes removing mandatory human review from a validated parole-recommendation AI to improve throughput, arguing validation makes oversight redundant. This reasoning is flawed because:**

- a) Validation must be repeated annually before oversight requirements can be reconsidered.
- b) Human oversight is a regulatory checkbox; its removal is a governance decision, not a risk-control decision.
- **`KEY` c) Validation confirms past performance but does not eliminate drift, novel inputs, or the need for human judgment.**
- d) Removal is acceptable only if the error rate falls below a threshold set during validation testing.

*explanation:* Human oversight is an ongoing operational risk control, not a pre-deployment gate that validation replaces. AI systems can drift, encounter out-of-distribution inputs, and produce consequential errors after deployment. Treating oversight as redundant once validated conflates model evaluation with operational risk management. Error-rate thresholds and annual revalidation schedules are procedural details that do not address this fundamental distinction.

### 50. AIGRM-I · D2 · task 2.2 · `e884eb27`

> Apply the risk process to a described AI use case.

**A loan-approval AI is deployed. Six months later, regulatory guidance on fairness expands. What does the iterative risk process require at this point?**

- **`KEY` a) Update the existing risk register to reflect the changed regulatory context, re-analyzing and re-evaluating affected risks incrementally.**
- b) Keep the register unchanged, since new regulatory guidance applies only to new deployments, not previously treated systems.
- c) Defer re-assessment to the next scheduled project milestone, since iterative reviews are tied to development phases, not external events.
- d) Discard the existing risk register and restart identification from zero, since any context change invalidates prior assessments.

*explanation:* The iterative risk process updates prior assessments incrementally when context changes—it does not discard them and restart from scratch. Regulatory changes are a valid trigger for re-evaluation because they can alter what constitutes acceptable risk. Deferring to a scheduled milestone ignores that real-world context shifts, such as new guidance, are valid re-entry points into the process.

### 51. AIGRM-I · D2 · task 2.2 · `c64661af`

> Apply the risk process to a described AI use case.

**During risk analysis of an AI hiring tool, the team finds a bias scenario with very low historical frequency but potentially severe legal and reputational impact. What is the correct next action?**

- a) Skip formal analysis, since low historical frequency makes expected impact negligible regardless of severity.
- b) Decide acceptability immediately, then commission detailed analysis only if stakeholders judge it unacceptable.
- **`KEY` c) Complete severity and likelihood analysis, then evaluate the resulting risk level against the organization's tolerance threshold.**
- d) Rate likelihood as negligible due to no prior incidents, and document the scenario as low risk without further evaluation.

*explanation:* Risk analysis must assess both likelihood and severity before evaluation can occur; evaluation then judges the analyzed level against organizational tolerance. Skipping analysis because frequency is low confuses low likelihood with low overall risk, ignoring high-severity consequences. Deciding acceptability before analysis reverses the correct process sequence. Rating likelihood as negligible solely because no prior incidents exist misapplies historical frequency as the only valid likelihood input.

### 52. AIGRM-I · D2 · task 2.3 · `3b9c1356`

> Characterize an AI risk by its likelihood and severity and prioritize among competing risks.

**An AI risk matrix scores a model's data-poisoning risk as 4 × 4 = 16 (high). The risk owner treats this as an objective measurement and skips expert review. What should the team require instead?**

- a) Accept the score as final, because multiplying standardized scales produces an objective, review-ready result.
- b) Automatically escalate all scores above 12 to critical, since the matrix threshold is definitive.
- **`KEY` c) Validate the underlying likelihood and severity ratings through structured expert judgment before acting on the score.**
- d) Replace the matrix with a Monte Carlo simulation to eliminate subjectivity from the score entirely.

*explanation:* A risk matrix score is a structured approximation whose validity depends entirely on the quality of the underlying likelihood and severity ratings, which are expert judgments. Treating the arithmetic product as objective bypasses the validation step that makes the score meaningful. Expert review must confirm the input ratings before the team acts on the composite result.

### 53. AIGRM-I · D2 · task 2.6 · `f8c7b98c`

> Identify the categories of generative-AI risk and recognize them in a scenario.

**Strict input filters are applied to a generative AI writing assistant. Post-deployment review finds the model still occasionally produces instructions for synthesizing dangerous substances. Which action does this require?**

- **`KEY` a) Extend controls to output filtering, because input screening alone does not eliminate harmful-content risk.**
- b) Reclassify as IP and provenance risk, since dangerous instructions likely originate from copyrighted technical documents.
- c) Log incidents as confabulation events, since factually dangerous outputs are a form of hallucination.
- d) Escalate to a data-privacy review, since the outputs may indicate the model memorized sensitive training data.

*explanation:* Dangerous output despite clean input demonstrates that harmful-content risk requires output-layer controls, not input filtering alone. The misconception that approved prompts guarantee safe outputs is directly falsified here. Confabulation concerns false facts, not dangerous-but-accurate instructions. IP and provenance risk addresses attribution and copyright, not safety of generated content.

### 54. AIGRM-I · D2 · task 2.8 · `011fcc90`

> Explain the security-oriented risks of AI systems and that mitigations exist.

**A risk analyst claims adversarial inputs are irrelevant to LLMs because adversarial attacks are a computer-vision problem involving pixel perturbations. What is the flaw in this reasoning?**

- a) LLMs are immune to adversarial inputs because their discrete token space cannot be perturbed continuously the way image pixel values can be.
- **`KEY` b) Adversarial inputs apply to LLMs through token perturbations, paraphrasing, or character substitutions that shift outputs in attacker-intended directions.**
- c) Adversarial inputs affect LLMs only when attackers can modify the embedding layer directly, requiring privileged access to model internals.
- d) Pixel perturbations are vision-specific, but LLMs face prompt injection instead, which is an entirely unrelated and non-adversarial threat class.

*explanation:* Adversarial inputs are not limited to computer vision; in LLMs they manifest as carefully crafted text—character swaps, synonyms, or unusual phrasing—that exploits statistical patterns to manipulate model behavior. The discrete token space changes the form of perturbation but not the underlying adversarial principle. Prompt injection is related to, not separate from, adversarial input concerns, and embedding-layer access is not required.

### 55. AIGRM-I · D2 · task 2.9 · `711712e2`

> Explain model drift and the need for ongoing monitoring of deployed AI.

**After shadow testing, a new NLP classifier goes to full production. The team concludes no further monitoring is needed because shadow testing caught all issues. What is the key flaw in this reasoning?**

- a) Shadow testing is only valid for image-recognition models; NLP classifiers require a different pre-deployment validation technique.
- b) Retraining on the most recent data after promotion eliminates future drift, making ongoing monitoring redundant for this model.
- **`KEY` c) Shadow testing covers a fixed window; language use and context keep evolving post-launch, so drift risks emerge after that period ends.**
- d) Shadow testing measures latency and throughput, not predictive accuracy, so it provides no evidence about classification quality.

*explanation:* Shadow testing validates a model against conditions present during that specific trial window. Because language use, user intent, and domain context continue to shift after launch, drift can emerge well beyond the shadow period. Assuming retraining on recent data eliminates future drift is also incorrect — retraining can introduce new biases or instability and does not remove the need for continuous monitoring.

### 56. AIGRM-I · D3 · task 3.1 · `875f45e1`

> Explain the EU AI Act's risk-based structure and its four risk tiers.

**A hospital repurposes an AI scheduling tool to support clinical triage decisions. How does this affect the tool's EU AI Act classification?**

- a) Classification stays minimal risk; the original deployment determination is permanent.
- **`KEY` b) Classification must be reassessed; clinical triage is a high-risk annex category, so high-risk obligations now apply.**
- c) Classification is set solely by the original AI provider; the hospital has no role in determining the new risk tier.
- d) Classification becomes unacceptable risk automatically, because medical AI is prohibited without prior regulatory approval.

*explanation:* Risk classification follows the use case, not the original deployment decision. When a tool is repurposed into a high-risk annex category—such as safety-critical health applications—the high-risk obligations attach. The notion that an initial classification is permanent contradicts the Act's use-based logic. Medical AI is not automatically prohibited; it is subject to high-risk requirements.

### 57. AIGRM-I · D3 · task 3.10 · `1b5d96b0`

> Explain how the frameworks reinforce one another.

**Which description best illustrates the defense-in-depth principle as applied to AI governance?**

- **`KEY` a) Applying a binding regulation, a voluntary risk framework, and a management standard together so each layer addresses gaps the others leave open.**
- b) Selecting the strictest single instrument and disregarding others so that obligations remain unambiguous and enforcement is straightforward.
- c) Mapping practices to multiple frameworks to demonstrate compliance effort, even though each framework addresses entirely separate risk domains.
- d) Consolidating all governance obligations into one master policy document so that each requirement appears only once and overlap is eliminated.

*explanation:* Defense-in-depth governance means using multiple, complementary instruments so that a weakness in one layer is compensated by another. Applying only the strictest single instrument leaves gaps that other frameworks would cover. The frameworks overlap intentionally, and that overlap is a feature, not redundancy.

### 58. AIGRM-I · D3 · task 3.10 · `54384027`

> Explain how the frameworks reinforce one another.

**ISO/IEC 42001 is best classified as which type of instrument, and why does that classification matter alongside the EU AI Act?**

- **`KEY` a) A management system standard; it certifies organizational governance processes, complementing but not replacing the EU AI Act's system-level conformity obligations.**
- b) A legally binding harmonized standard; once referenced in the EU Official Journal, it becomes mandatory for all AI providers in the EU market.
- c) A product safety standard; it certifies individual AI systems as safe, directly satisfying EU AI Act technical requirements for high-risk systems.
- d) A regional regulatory framework; it applies only within jurisdictions that formally adopt it, making it inapplicable alongside EU-specific legislation.

*explanation:* ISO/IEC 42001 certifies that an organization's AI management system meets defined process requirements; it is not a product standard and does not certify individual systems as safe. This distinction explains why it supports but does not replace EU AI Act conformity assessments, which evaluate specific high-risk systems.

### 59. AIGRM-I · D3 · task 3.2 · `c82a6f3b`

> Given a described AI system, determine whether it is high-risk under the EU AI Act and identify the obligations that attach.

**A developer argues that human oversight of a high-risk social-benefits AI system is purely an operational matter for deployers, not a design concern. What should the governance team do?**

- a) Defer oversight design to the post-deployment phase when the deployer can specify needed operational controls.
- **`KEY` b) Build oversight-enabling features—such as interpretability tools and override controls—into the system design.**
- c) Accept the argument and document that oversight responsibilities transfer to the deployer at handover.
- d) Limit oversight features to logging and audit trails, as real-time intervention capability is a deployer responsibility.

*explanation:* The AI Act places a design-level obligation on providers to build features that enable effective human oversight into the system itself. Oversight is not solely an operational matter for deployers; providers must ensure the system is technically capable of supporting oversight before handover. Deferring this to the post-deployment phase or limiting features to logging does not satisfy the provider's obligations.

### 60. AIGRM-I · D3 · task 3.3 · `a099477a`

> Explain the transparency obligations for limited-risk AI.

**A political campaign releases an AI-synthesized audio recording of a candidate's voice and argues deepfake rules cover only video. Is the campaign correct?**

- **`KEY` a) No; deepfake disclosure rules cover manipulated audio as well as video content.**
- b) No obligation applies; political speech is categorically exempt from synthetic-content disclosure rules.
- c) Yes; deepfake disclosure obligations are limited to video and do not cover audio-only recordings.
- d) No visible disclosure is needed if a technical watermark is embedded in the audio file.

*explanation:* Deepfake disclosure frameworks explicitly cover manipulated audio, images, and video — not video alone. The misconception that audio is excluded is a common misreading; the campaign must disclose the synthetic nature of the recording.

### 61. AIGRM-I · D3 · task 3.3 · `05e3cd2e`

> Explain the transparency obligations for limited-risk AI.

**A news platform republishes an unlabeled AI-generated image from a third-party site. What labeling obligation applies to the platform?**

- a) None; an embedded metadata watermark in the original file satisfies the labeling requirement.
- b) None; labeling duties bind only the original publisher, not redistributors.
- c) None; the platform did not generate the image, only distribute it.
- **`KEY` d) The platform must label the image as AI-generated, because labeling duties extend to redistribution.**

*explanation:* Synthetic-content labeling obligations follow the content through distribution; republishing on a new platform triggers a fresh labeling duty. Neither originator-only rules nor embedded metadata alone satisfy the requirement for a visible, user-facing label.

### 62. AIGRM-I · D3 · task 3.5 · `1331b1f7`

> Explain the EU AI Act's treatment of general-purpose AI (GPAI) models.

**A GPAI model provider releases model weights under an open-source licence. Which statement accurately describes its EU AI Act obligations?**

- a) It is exempt unless the model is integrated into an Annex III high-risk system, triggering retroactive full obligations.
- b) Its obligations transfer entirely to whoever downloads the weights, since the provider no longer controls the model.
- **`KEY` c) It retains core documentation and transparency obligations; open-source release provides only limited, specific relief.**
- d) It is fully exempt from all GPAI obligations because open-source releases fall outside the Act's scope.

*explanation:* The EU AI Act grants open-source GPAI providers limited relief from some obligations — such as certain copyright-related transparency duties — but does not exempt them from core documentation and transparency requirements. Full exemption for open-source models is a misconception explicitly addressed in the Act's GPAI provisions. Obligations do not transfer wholesale to downloaders, nor are they contingent on downstream high-risk integration.

### 63. AIGRM-I · D3 · task 3.8 · `ad29c63e`

> Explain how the NIST AI RMF complements binding law and standards.

**The NIST AI RMF was developed through broad multi-stakeholder input. Why is this relevant to its governance role?**

- **`KEY` a) It supports the framework's sector-neutral legitimacy, as input from industry, academia, and civil society enables broad applicability across diverse industries and contexts.**
- b) It makes the framework a de facto government mandate, because industry participation in the drafting process implies formal regulatory endorsement of its requirements.
- c) It is irrelevant, because only instruments developed exclusively by government bodies carry legitimate governance authority over regulated industries.
- d) It limits the framework's practical authority, because consensus-based voluntary documents cannot be cited or referenced in regulatory enforcement proceedings.

*explanation:* The NIST AI RMF was developed through an open, multi-stakeholder process involving industry, academia, and civil society—precisely to ensure it is broadly applicable and sector-neutral rather than government-imposed or domain-restricted. This process underpins its complementary governance role. The claim that consensus-based documents cannot inform enforcement misunderstands how regulators use voluntary standards, and equating industry participation with a government mandate conflates influence with legal compulsion.

### 64. AIGRM-I · D4 · task 4.1 · `6c361874`

> Explain the stages of the AI system lifecycle and why governance applies at each.

**A compliance officer argues governance reviews are unnecessary until deployment because only then does the system affect real users. Which statement best explains why this view is incorrect?**

- a) Governance applies from development onward because code and algorithms, not design documents, create the actual system risk.
- b) Governance applies from validation onward because that is the first stage where model behavior can be formally measured.
- **`KEY` c) Governance applies from design onward because early decisions about scope, data, and objectives shape fairness and safety outcomes.**
- d) Governance applies from monitoring onward because risks only materialize once the system operates in a live environment.

*explanation:* AI governance must begin at the design stage because choices about intended use, data sources, and success criteria directly determine whether downstream stages can achieve fairness, safety, and compliance. Waiting until validation, development, or monitoring means critical risk-shaping decisions have already been locked in without oversight.

### 65. AIGRM-I · D4 · task 4.11 · `7d28e906`

> Analyze accountability in agentic workflows.

**An organization removes human review checkpoints from its refund workflow, citing the agent's superior speed and accuracy. Managers argue that strong performance metrics show accountability is intact. Which diagnosis is most accurate?**

- a) The reasoning is sound: once guardrails and predefined rules are in place, those rules constitute delegated accountability and checkpoints add no governance value.
- b) The reasoning is sound: consistently met metrics confirm safe operation, making human checkpoints redundant and accountability undiminished.
- c) The reasoning is sound: automated audit trails generated by the agent preserve accountability as effectively as human checkpoints do.
- **`KEY` d) The reasoning is flawed: removing checkpoints reduces meaningful human control, undermining accountability regardless of performance outcomes.**

*explanation:* Accountability requires that a human can genuinely oversee and be responsible for consequential actions. Performance metrics measure outcomes but do not substitute for human control. Removing checkpoints for efficiency reasons erodes the organization's ability to catch edge-case failures. Neither automated audit trails nor predefined guardrails constitute accountability; they are controls that support it, not replacements for an accountable human in the workflow.

### 66. AIGRM-I · D4 · task 4.12 · `ef82608e`

> Explain responsible decommissioning and change management for AI systems.

**A governance team retires an internal AI recruitment screener by taking it offline and closing the project. Why is this insufficient responsible decommissioning?**

- a) End-user notification is required, but downstream systems and third-party integrators have no standing in decommissioning.
- **`KEY` b) It omits managing model weights, training data retention, and assessing harms the system may have already caused.**
- c) Formal decommissioning obligations apply only to high-risk or externally regulated AI systems, not internal tools.
- d) Decommissioning is complete once a successor system absorbs governance responsibility for all residual risk.

*explanation:* Responsible decommissioning extends beyond taking a model offline: it requires managing residual artifacts such as weights, training data, and logs, honoring retention and audit obligations, and assessing harms already caused that may surface later. Restricting obligations to high-risk systems, limiting notification to end users, or assuming a successor system absorbs all risk are each distinct governance failures that leave continuing obligations unmet.

### 67. AIGRM-I · D4 · task 4.2 · `929581d5`

> Identify the accountability and decisions that belong at each lifecycle stage.

**A deployed AI system shows unexpected drift in a high-risk use case. The original development team considers the deployment gate closed. Who owns the go/no-go decision on continued operation?**

- a) No formal decision-maker, because lifecycle decision points apply only during initial development and deployment.
- b) The original development team, because accountability reverts to them whenever a new post-deployment risk emerges.
- **`KEY` c) The current stage owner, supported by risk, compliance, and legal stakeholders as required.**
- d) The engineering team alone, because assessing model drift is a purely technical determination.

*explanation:* Accountability shifts to the owner responsible for the current lifecycle stage; during operation that is the designated system or operations owner. Lifecycle decision points extend through operation and decommissioning, not just development. Go/no-go decisions on continued operation require multi-stakeholder input—including risk, compliance, and legal—not engineering judgment alone.

### 68. AIGRM-I · D4 · task 4.2 · `a58d54de`

> Identify the accountability and decisions that belong at each lifecycle stage.

**During a high-risk AI system's deployment gate review, the legal team flags an unresolved regulatory compliance gap. The engineering team confirms all technical benchmarks are met. What should the gate decision be?**

- a) Full pass, because gate reviews assess technical readiness and all engineering benchmarks are met.
- b) Conditional pass, documenting the compliance gap as a remediation item with the same weight as full approval.
- c) Full pass, because the legal gap can be tracked as a post-deployment action item without blocking the gate.
- **`KEY` d) No-go, because unresolved regulatory compliance is a required gate criterion, not only a technical one.**

*explanation:* Gate reviews must assess AI-specific governance criteria—including regulatory compliance—not only technical benchmarks. An unresolved regulatory gap warrants a no-go until resolved. A conditional pass does not carry the same governance weight as full approval; treating it as equivalent understates residual risk. Deferring the gap to post-deployment bypasses the protective purpose of the gate.

### 69. AIGRM-I · D4 · task 4.3 · `39d91b5b`

> Explain the purpose of an AI system impact assessment and when it is performed.

**Which statement best describes how an AI impact assessment differs from a risk assessment?**

- a) Impact assessment is a subset of risk assessment, covering only financial and reputational exposure to the deploying organization.
- **`KEY` b) Impact assessment evaluates effects on individuals and society; risk assessment focuses on threats to organizational objectives.**
- c) Both processes address the same concerns but use different terminology depending on the regulatory framework applied.
- d) Risk assessment subsumes impact assessment because harms to individuals are captured as threats to organizational objectives.

*explanation:* An impact assessment focuses on real-world effects on people—individuals, groups, and society—whereas a risk assessment targets threats to an organization's own objectives. The two processes address different questions and are not interchangeable. Risk assessment does not automatically capture harms to people, because a harm can be severe for affected individuals yet pose little measurable threat to organizational goals. Treating them as identical terminology for the same process, or assuming one fully contains the other, are common but incorrect positions.

### 70. AIGRM-I · D4 · task 4.4 · `42da6479`

> Apply an impact-assessment mindset to a described AI system.

**An output-filtering module prevents a generative AI from producing harmful text. The engineering team concludes no further safeguards are needed. What should the impact-assessment lead do?**

- **`KEY` a) Evaluate whether procedural, organizational, or policy-level safeguards are also needed, since no single control layer is assumed sufficient.**
- b) Agree; output filtering addresses harm at the source, making organizational and policy controls redundant for this risk.
- c) Escalate to legal to confirm output filtering satisfies liability obligations, then close the safeguard analysis without further review.
- d) Require documented justification for why technical controls supersede policy controls, then archive it as evidence of proportionate selection.

*explanation:* Sound safeguard identification treats technical, procedural, organizational, and policy controls as equally valid and often complementary layers; a model-level filter alone is rarely sufficient. Assuming technical controls make organizational safeguards redundant is a recognized misconception. Escalating closure authority to legal conflates liability review with the broader governance task the assessment lead must perform.

### 71. AIGRM-I · D4 · task 4.7 · `8ef8e1da`

> Explain content provenance and authenticity for generated content.

**C2PA-style standards are best described as which of the following?**

- **`KEY` a) Voluntary technical specifications that require separate regulatory or platform adoption to become enforceable.**
- b) Binding international legal mandates that automatically apply to all platforms processing digital media worldwide.
- c) Platform-specific proprietary formats that are incompatible with cross-industry interoperability goals.
- d) Cryptographic tools that prevent AI-generated content from being altered once a credential is attached.

*explanation:* C2PA is an open, voluntary technical specification; it becomes enforceable only when regulators mandate it or platforms contractually require it. It does not prevent alteration—it attests to the content's state at signing time. Treating it as an automatic global legal mandate or as a tamper-prevention tool are common misconceptions.

### 72. AIGRM-I · D4 · task 4.7 · `ccf23938`

> Explain content provenance and authenticity for generated content.

**A video journalist asks why C2PA-style provenance standards are used for AI-generated media. Which statement best describes what these standards establish?**

- **`KEY` a) They record origin, creation tools, and editing history, letting recipients assess authenticity without confirming factual truth.**
- b) They verify that depicted content is factually accurate and has not been staged or manipulated in meaning.
- c) They duplicate watermarking functions, making separate provenance frameworks redundant when a watermark already identifies the source.
- d) They primarily protect intellectual property rights, with authenticity verification as a secondary, incidental benefit.

*explanation:* C2PA-style standards attach a cryptographically signed manifest recording who created content, which tools were used, and what edits occurred — establishing origin and chain of custody, not factual truth. Conflating provenance with factual accuracy mistakes authenticity of source for accuracy of depicted events. Treating watermarking as a substitute ignores that watermarks carry no structured, verifiable chain-of-custody record. Framing these standards as primarily copyright tools misidentifies their core purpose, which is misinformation resistance and authenticity verification.

### 73. AIGRM-I · D4 · task 4.9 · `17299f8a`

> Explain post-market monitoring and incident response for deployed AI.

**A diagnostic AI tool performed flawlessly in pre-deployment testing. The team concludes ongoing monitoring is unnecessary because real-world conditions will mirror the test environment. This conclusion is best described as:**

- a) Sound, because test environments for medical AI are required to replicate real-world conditions precisely.
- b) Sound, because a passing pre-deployment validation confirms performance will remain stable in production.
- **`KEY` c) Flawed, because data distributions, user behaviors, and clinical practices shift in ways test environments cannot anticipate.**
- d) Flawed, but only because regulators mandate monitoring as an audit requirement, not because conditions actually diverge.

*explanation:* Test environments are static snapshots; real-world conditions evolve through data drift, changing user populations, updated clinical guidelines, and unforeseen edge cases. Post-market monitoring is required precisely because no pre-deployment validation can guarantee sustained performance as the environment changes. Claiming validation results confirm stable production performance, or that monitoring is purely an audit formality, both misrepresent why ongoing surveillance is necessary.

### 74. AIGRM-I · D5 · task 5.1 · `80040e63`

> Explain the core principles of responsible AI.

**A product team claims a medical diagnostic AI and a music recommender require identical ethical review because responsible AI principles are technology-neutral. This claim is best classified as:**

- a) Incorrect, because responsible AI principles are scoped specifically to systems that process personal health data, which means recommendation engines fall entirely outside their governance requirements.
- **`KEY` b) Incorrect, because while principles are technology-neutral in wording, their application is risk-proportionate, requiring deeper scrutiny for higher-stakes systems such as medical diagnostics.**
- c) Correct, because technology-neutral principles carry identical obligations regardless of context, so review depth must be uniform across all AI systems.
- d) Correct, because non-maleficence requires that both systems demonstrate zero residual risk of harm before deployment, making equal review depth mandatory.

*explanation:* Responsible AI principles are broadly applicable, but their application is proportionate to risk: a medical diagnostic system carries far greater potential for harm than a music recommender and therefore warrants deeper scrutiny. The claim confuses technology-neutrality of principles with uniformity of rigor. Non-maleficence does not require zero risk, and the principles are not limited to health-data systems.

### 75. AIGRM-I · D5 · task 5.1 · `6ebc2e8b`

> Explain the core principles of responsible AI.

**A governance team argues their responsible AI policy is purely aspirational because no regulation references it. Why is this reasoning flawed?**

- a) Responsible AI principles are finalized frameworks unaffected by emerging capabilities or new regulations.
- **`KEY` b) Responsible AI principles actively shape emerging regulations, creating real compliance obligations.**
- c) Responsible AI principles are already codified as binding law in all major jurisdictions.
- d) Responsible AI principles apply only to high-risk systems, exempting low-risk products from scrutiny.

*explanation:* Responsible AI principles are not merely aspirational; they actively inform emerging regulations such as the EU AI Act and national AI strategies, creating real compliance obligations. The claim that principles are purely advisory ignores this regulatory linkage. Treating them as already binding law overstates their current legal status, while the remaining options introduce unrelated misconceptions about scope and stability.

### 76. AIGRM-I · D5 · task 5.2 · `143df4b8`

> Trace where bias entered an AI system and determine how to mitigate it

**A hiring tool showed equal precision across genders at launch, with sensitive attributes removed and reweighting applied. Six months post-deployment, female candidates are again ranked lower. What most directly explains this re-emergence?**

- a) Proxy variables correlated with gender allowed the model to reconstruct gender distinctions despite attribute removal.
- **`KEY` b) A feedback loop incorporated live hiring decisions into training data, gradually reintroducing gender-correlated patterns.**
- c) Reweighting is an in-processing technique; only post-processing threshold adjustment produces durable fairness over time.
- d) Equal precision measures only one fairness dimension; unmeasured dimensions degraded silently during the validation phase.

*explanation:* The post-deployment shift points to a feedback loop: decisions made by the deployed model became new training signal, gradually re-encoding the bias that the mitigation technique had corrected. This is a deployment-context source of bias that no pre-release validation can prevent on its own. Proxy variables and metric-selection gaps are real concerns but do not explain bias that was absent at launch and re-emerged only after live operation. The claim that reweighting cannot produce durable fairness is not supported; technique choice alone does not explain the temporal pattern observed.

### 77. AIGRM-I · D5 · task 5.3 · `e498297f`

> Explain transparency and explainability as duties to affected people.

**A bank's AI denial notice states only: 'Your application was assessed using an automated process.' Why does this fail the meaningful-information duty?**

- a) It omits published model documentation that regulators require before any automated system is deployed.
- **`KEY` b) It gives applicants no basis to understand the denial grounds or to effectively challenge the decision.**
- c) It withholds training data and feature weights that affected applicants are entitled to receive on request.
- d) It was issued after the decision rather than before, when transparency obligations must be fulfilled.

*explanation:* Meaningful information must be substantive enough for affected people to understand what drove a decision and, where relevant, to challenge it. A generic 'AI was used' statement provides no such basis. Omitting model documentation concerns regulatory filing requirements, not individual notice sufficiency. Sharing training data and feature weights is neither required nor sufficient to satisfy this duty. Timing of the notice is not the core deficiency; content is.

### 78. AIGRM-I · D5 · task 5.3 · `437c6857`

> Explain transparency and explainability as duties to affected people.

**A bank posts full model architecture and SHAP scores on its developer portal after denying a loan application. Is the transparency duty to the applicant satisfied?**

- a) No, because transparency requires releasing source code and training data to every affected individual on request.
- **`KEY` b) No, because the duty requires affected individuals receive usable information, not documentation aimed at developers.**
- c) Yes, because using SHAP satisfies explainability, which equals transparency for all stakeholders.
- d) Yes, because publishing technical documentation fulfills openness regardless of applicant access or comprehension.

*explanation:* Transparency to affected people requires information that is accessible and usable by those people, not merely published in a form only developers can interpret. A developer portal does not reach or serve the loan applicant. Requiring source-code release mischaracterizes the obligation; the duty is meaningful disclosure, not open-sourcing.

### 79. AIGRM-I · D5 · task 5.4 · `333d71b6`

> Explain privacy as a responsible-AI concern beyond legal compliance.

**A team finishes building a recommendation engine, then commissions a privacy impact assessment and drafts a privacy policy before launch. How should this approach be characterized?**

- **`KEY` a) It partially fulfills Privacy by Design; documentation is necessary but insufficient when privacy was not embedded during architecture.**
- b) It satisfies Privacy by Design because formal documentation and an impact assessment are its core requirements regardless of timing.
- c) It is a strong posture because post-build assessments identify residual risks as effectively as early-stage design choices.
- d) It exceeds Privacy by Design because adding encryption and access controls at deployment fully compensates for earlier design gaps.

*explanation:* Privacy by Design requires that protections be built into a system from the outset, not retrofitted after architecture decisions are made. Post-build documentation is a necessary governance artifact but cannot substitute for structural choices—data flows, storage architecture, and model inputs—that are difficult or impossible to reverse late in development. Treating documentation alone as sufficient conflates a governance artifact with substantive design practice, and claiming that deployment-stage controls fully compensate for earlier gaps overstates what can be corrected after core architecture is set.

### 80. AIGRM-I · D5 · task 5.8 · `5b1898df`

> Explain how ethics, policy, and the governance function combine to sustain trustworthy AI over time.

**A product team treats stakeholder feedback on their AI system as useful only for marketing, not governance. Which concept does this misunderstand?**

- a) Deployment review, which consolidates all stakeholder signals into a single post-launch assessment rather than ongoing collection.
- b) Ethics committee authority, which is the only body empowered to convert stakeholder input into formal policy changes.
- c) Accuracy monitoring, which is the primary channel for formally capturing stakeholder concerns in governance cycles.
- **`KEY` d) Feedback loops as a governance input, which surface real-world harms and gaps that internal metrics alone cannot detect.**

*explanation:* Stakeholder feedback is a substantive governance input that reveals harms, unintended uses, and trust erosion that technical metrics miss. Treating it as a public-relations tool severs a critical signal from the improvement cycle, weakening the organization's ability to sustain trustworthy AI.

---

# AIHR-I — AI for Human Resources & Talent I

**Source this certification cites:** Certidemy blueprint plus the employment-law and fairness sources each item cites.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 81. AIHR-I · D1 · task 1.2 · `9bcd2f15`

> Distinguish an automated employment decision tool from ordinary recruiting software

**A scheduling tool automatically sends interview invitations to candidates who pass a keyword filter on their résumé. Hiring managers make all final decisions. How should this tool be classified?**

- a) Out-of-scope, because deterministic keyword rules are exempt from AEDT definitions, unlike learned scoring models.
- b) Out-of-scope, because subsequent human interviews break any material influence the keyword screen could have.
- **`KEY` c) In-scope AEDT, because the filter controls which candidates ever reach a hiring manager, materially influencing the pipeline.**
- d) Out-of-scope, because the tool handles scheduling logistics and does not directly evaluate candidate qualifications.

*explanation:* A filter that controls access to the interview stage materially influences the employment decision by defining the entire pool hiring managers can evaluate. The fact that humans decide later, that only one stage is automated, or that the logic is deterministic does not remove the tool from scope.

### 82. AIHR-I · D1 · task 1.2 · `9a5393a5`

> Distinguish an automated employment decision tool from ordinary recruiting software

**An employer classified a résumé-ranking tool as out-of-scope two years ago. The tool is now integrated so that only candidates ranked in the top quartile are forwarded to hiring managers. What action is required?**

- **`KEY` a) Reclassify the tool as in-scope, because its output now gates which candidates hiring managers can consider.**
- b) Conduct a bias audit only if more than half of hiring managers follow the ranking; lower adoption keeps it out of scope.
- c) Request reclassification from the vendor, since vendor-built tools require vendor-initiated scope determinations.
- d) No action; classification is a one-time determination at purchase and does not change with workflow integration.

*explanation:* Classification must reflect how a tool functions within the actual workflow, not just its technical design at purchase. When integration changes so that the tool's output controls candidate access to hiring managers, it materially influences the decision and must be reclassified as in-scope. Classification is the employer's ongoing obligation, not the vendor's, and there is no adoption-rate threshold that governs scope.

### 83. AIHR-I · D1 · task 1.2 · `ef0212f7`

> Distinguish an automated employment decision tool from ordinary recruiting software

**A neural network ranks 200 candidates. A recruiter reviews all of them independently and treats the ranking as one of five inputs. The ranking aligns with final selections 30% of the time. Should the tool be classified as an AEDT?**

- **`KEY` a) Yes, because materiality turns on whether the ranking shapes the evaluation process, not on adoption rate or input count.**
- b) No, because the ranking is one of five inputs, so its influence is too diluted to be considered material.
- c) No, because the recruiter independently reviews all candidates, so the tool does not restrict who can be considered.
- d) No, because the tool's output aligns with final decisions less than 50% of the time, placing it below the materiality threshold.

*explanation:* Materiality is assessed by whether the tool's output shapes the decision process, not by a percentage-adoption threshold or by counting competing inputs. A tool that consistently informs how a recruiter evaluates candidates can materially influence outcomes even when other factors are also considered and even when the recruiter reviews every applicant independently.

### 84. AIHR-I · D1 · task 1.3 · `a48fc07d`

> Explain how a resume-screening or candidate-ranking model produces a score

**A hiring manager says a score of 91 proves a candidate is objectively more qualified than one who scored 78. Why is this interpretation inaccurate?**

- a) The score removes subjectivity by applying uniform criteria, so both candidates should be re-screened manually.
- b) The score predicts performance accurately, but only when validated on the company's own historical data.
- **`KEY` c) The score estimates similarity to past hires, not a direct measure of the candidate's merit or potential.**
- d) The score is objective, but a 13-point gap is too small to indicate a meaningful difference in qualifications.

*explanation:* A ranking model produces a similarity estimate comparing applicants to patterns learned from past hires, not an independent assessment of merit. Treating the score as objective confuses reproducibility with objectivity; the subjectivity of prior human decisions is embedded in the training data the model learned from.

### 85. AIHR-I · D1 · task 1.3 · `a9da0e2a`

> Explain how a resume-screening or candidate-ranking model produces a score

**A model ranks Candidate A third and Candidate B tenth in a pool of 200. A recruiter treats this as definitive proof that A is a meaningfully better hire. Which concept most directly challenges that conclusion?**

- a) Rank differences are meaningful when the model was validated on held-out data confirming accuracy on unseen applicants.
- b) The rank order accurately reflects merit, but legal defensibility requires interviewing all candidates in the top 15 percent.
- **`KEY` c) The score is a similarity estimate with inherent imprecision; small rank differences may reflect noise, not real suitability gaps.**
- d) Rank order is reliable for top and bottom deciles but loses precision only in the middle of large applicant pools.

*explanation:* A ranking score is a similarity estimate, not a precise merit measurement. Granular rank differences—such as third versus tenth—may fall within the model's margin of imprecision and reflect noise rather than genuine differences in candidate quality.

### 86. AIHR-I · D1 · task 1.4 · `0ce2ae5a`

> Identify what AI cannot reliably assess about a candidate

**An AI video platform claims to detect 'culture fit' using Ekman's universal emotion categories. The practitioner should reject this claim primarily because:**

- **`KEY` a) Subsequent research has not supported inferring discrete internal emotions from facial movements, undermining the model's foundation.**
- b) Emotion detection is a valid intermediate step, but a separate validated model is needed to link detected emotions to culture fit.
- c) Ekman's categories were validated on Western samples, so the model will systematically misclassify emotions in non-Western candidates.
- d) Culture fit is too poorly defined for any assessment tool to predict, making this claim uniquely problematic regardless of method.

*explanation:* The scientific basis for inferring discrete internal emotions from facial action units has been substantially challenged; expressions are context-dependent and culturally variable in ways Ekman's original framework does not capture. This undermines both the emotion-detection layer and any culture-fit inference built on top of it.

### 87. AIHR-I · D1 · task 1.4 · `212394a0`

> Identify what AI cannot reliably assess about a candidate

**A vendor claims its text-analysis tool infers 'conscientiousness' from interview responses because language directly reflects cognition. An HR practitioner should treat this claim as insufficient because:**

- a) Open-ended responses favor strong communicators, introducing construct-irrelevant variance that inflates conscientiousness scores.
- b) Conscientiousness is better measured by structured personality inventories, making text-based inference redundant and legally risky.
- c) Text analysis is less reliable than voice analysis, which captures physiological features that are harder to consciously manipulate.
- **`KEY` d) Language reflects many things besides conscientiousness, so parsing text does not establish the tool measures that specific construct.**

*explanation:* The claim that language 'directly reflects cognition' does not establish that a specific model extracts conscientiousness rather than writing style, vocabulary, or topic familiarity. Construct validity requires convergent and discriminant evidence, not just a plausible mechanism for why language might correlate with a trait.

### 88. AIHR-I · D1 · task 1.5 · `92fd6ee6`

> Recognize AI-washing in HR technology marketing

**A peer-reviewed study shows a vendor's attrition model achieved 89% accuracy with 800 employees at one financial services firm. What should an HR analyst conclude about this evidence?**

- a) Peer-reviewed publication confirms sufficient validation; no further questions about sample or baseline are needed.
- b) A real-world financial-services deployment is more rigorous than a synthetic dataset, so results transfer to other industries.
- c) The 89% figure is strong because high accuracy indicates robust performance regardless of the population studied.
- **`KEY` d) The single-firm, single-industry sample limits generalizability; the buyer must assess whether their workforce resembles that population.**

*explanation:* Peer review validates methodology, not universal applicability: a model trained on one firm's financial-services workforce may not generalize to a different industry, size, or demographic mix. The 89% figure also requires a baseline — if 85% of employees stay regardless, the model adds little. Publication status does not eliminate the need to assess sample-to-context fit.

### 89. AIHR-I · D2 · task 2.2 · `25724ce4`

> Distinguish disclosure duties, audit duties, explanation duties, human-review duties, record duties, and non-discrimination liability

**An employer's HR analytics team, housed in a separate department from the recruiting unit, conducts a bias review of its AI resume screener. Does this satisfy an independent bias audit requirement?**

- a) Yes, because auditors in a different department provide sufficient organizational separation.
- b) No, because the audit is invalid unless it is repeated every six months regardless of model changes.
- **`KEY` c) No, because independence requires an external party unaffiliated with the employer.**
- d) Yes, provided the team documents its methodology and reports results to senior leadership.

*explanation:* Independent bias audit requirements specify an external, unaffiliated third party—internal departmental separation does not satisfy the independence standard. The misconception that different-department auditors qualify as independent is exactly what this item targets. Requiring documentation and leadership reporting conflates procedural rigor with the independence requirement itself. Mandating a fixed six-month cycle misreads audit triggers, which are typically tied to material model changes, not a calendar schedule.

### 90. AIHR-I · D2 · task 2.2 · `a9f2a4e0`

> Distinguish disclosure duties, audit duties, explanation duties, human-review duties, record duties, and non-discrimination liability

**A city ordinance requiring AI hiring-tool audits is delayed indefinitely. An employer used a resume-screening AI during the delay and received a disparate-impact complaint. The employer should:**

- a) Claim full compliance on the basis that satisfying the forthcoming AI-specific ordinance, once enacted, will retroactively fulfill all anti-discrimination obligations.
- b) Treat the complaint as resolved once the AI vendor provides certification that the tool passed the vendor's own internal bias-testing protocols.
- **`KEY` c) Conduct a disparate-impact analysis under general anti-discrimination law, which attaches to employment outcomes and applies regardless of the ordinance's delay.**
- d) Argue that anti-discrimination law targets only human decision-making, so algorithmic screening tools fall outside its scope and the complaint has no legal basis.

*explanation:* General anti-discrimination law attaches to employment outcomes, not to the existence of an AI-specific statute, so liability is unaffected by the ordinance's delay. The argument that anti-discrimination law covers only human decisions is a recognized misconception; courts apply disparate-impact analysis to algorithmic screening tools. Vendor self-certification of bias testing does not substitute for the employer's own legal compliance analysis. Satisfying a future AI-specific statute would not automatically fulfill the separate disparate-impact obligations under existing anti-discrimination law.

### 91. AIHR-I · D2 · task 2.3 · `a5deda07`

> Explain how disparate impact arises from AI-assisted selection

**An HR analyst uses the employer's applicant flow data to compare selection rates across demographic groups. A colleague argues national census figures should be used instead. Which position is correct?**

- a) The colleague is correct: census data is the legally mandated benchmark for disparity analyses because it provides a standardized, government-verified demographic baseline.
- **`KEY` b) The analyst is correct: disparity analysis compares selection rates within the qualified applicant pool or the employer's own applicant flow data, not general population figures.**
- c) Neither is correct: proper disparity analysis requires comparing each demographic group's selection rate against the overall average rate calculated across all applicants combined.
- d) The colleague is correct: national figures control for regional labor-market variation and occupational distribution in ways that internal applicant flow data cannot reliably capture.

*explanation:* The four-fifths rule and related disparity analyses compare selection rates within the qualified applicant pool or the employer's own applicant flow data. General census figures do not reflect who actually applied or was qualified, making them an inappropriate baseline for this type of analysis.

### 92. AIHR-I · D2 · task 2.3 · `62a18bbe`

> Explain how disparate impact arises from AI-assisted selection

**The four-fifths rule flags a potential disparity when the lowest-passing group's selection rate falls below 80% of the highest-passing group's rate. What is the correct legal status of this threshold?**

- a) A statutory bright line: ratios above 0.80 are legally safe; ratios below 0.80 automatically establish liability.
- b) A threshold calculated against national census population data rather than the actual applicant pool.
- c) An internal HR benchmark with no standing in enforcement proceedings or legal analysis.
- **`KEY` d) An enforcement guideline used to decide whether to investigate further, not a definitive finding of liability.**

*explanation:* The four-fifths rule is an enforcement heuristic, not a statutory bright line. Falling below 0.80 triggers investigative scrutiny but does not automatically establish liability; exceeding 0.80 does not guarantee legal safety. The comparison is made against the applicant pool, not census data.

### 93. AIHR-I · D2 · task 2.4 · `ab1030f1`

> Identify proxy variables that encode protected characteristics

**A resume screener penalizes candidates with employment gaps longer than six months. What should an HR auditor do first?**

- a) Flag it only if adverse impact data confirm that a protected group is statistically overrepresented among penalized candidates before any proxy concern is raised.
- **`KEY` b) Flag it; employment gaps correlate with disability, caregiving, and pregnancy—all protected characteristics—creating proxy discrimination risk regardless of intent.**
- c) Approve it; uniform application of a single threshold to every candidate eliminates disparate impact exposure because no group is singled out by the rule's text.
- d) Approve it; uninterrupted work history is a facially neutral productivity signal, and neutral criteria applied consistently cannot generate protected-class liability.

*explanation:* Employment gap penalties function as proxies for disability, pregnancy, and caregiving status regardless of intent or uniform application. A facially neutral criterion that correlates with a protected characteristic still generates disparate impact liability. Intent to target a protected group is not required to establish proxy discrimination, so the auditor must flag the criterion at the outset rather than waiting for statistical confirmation or evidence of deliberate targeting.

### 94. AIHR-I · D2 · task 2.4 · `3276a236`

> Identify proxy variables that encode protected characteristics

**A screener requires 'native-level English proficiency' for a data-entry role, and applicants with non-English-background names are disproportionately screened out. What should an HR auditor recommend?**

- a) Approve it; language fluency is a job skill, not a protected characteristic, regardless of screening outcomes.
- b) Approve it if the employer documents that native-level proficiency is genuinely required for core duties.
- c) Flag it only if applicant names are visible to reviewers, since name visibility converts fluency screening into proxy discrimination.
- **`KEY` d) Flag it as a proxy for national origin and require the employer to justify the fluency level against actual job demands.**

*explanation:* A fluency requirement that disproportionately screens out speakers of particular languages functions as a proxy for national origin or ethnicity even though fluency itself is not a protected characteristic. The auditor must require the employer to demonstrate that the specific proficiency level is genuinely necessary for the role. Name visibility is irrelevant to whether the fluency criterion carries proxy risk.

### 95. AIHR-I · D2 · task 2.5 · `a2337676`

> Analyze a vendor bias-audit report to distinguish what it establishes from what it does not

**An audit found an adverse-impact ratio of 0.85 at a cutoff score of 70. The deployer raises the cutoff to 80 to reduce hiring volume. What does the audit establish under the new cutoff?**

- a) A more favorable ratio: higher cutoffs concentrate selection on top scorers equally across all groups.
- b) A compliant ratio: passing the 4/5ths rule at cutoff 70 means compliance holds across any cutoff the deployer sets.
- **`KEY` c) Nothing about the new configuration: the ratio applies only to the specific cutoff and conditions under which it was measured.**
- d) The same ratio: it is an intrinsic property of the model's scoring function, independent of the cutoff applied.

*explanation:* Adverse-impact ratios depend on where the selection threshold is set. Changing the cutoff changes which candidates pass and can materially shift the ratio for protected groups. The audit's finding is specific to the tested cutoff of 70 and cannot be assumed to hold at 80. Treating the ratio as intrinsic to the algorithm or as a guarantee across all cutoffs both misrepresent how impact ratios are calculated.

### 96. AIHR-I · D2 · task 2.5 · `fe3fd893`

> Analyze a vendor bias-audit report to distinguish what it establishes from what it does not

**A vendor updates its resume-screening model's ranking algorithm six months after an audit. The deployer keeps using the tool, citing the existing audit. What is the audit's current status?**

- **`KEY` a) Potentially inapplicable: the updated algorithm is a different configuration from the one that was audited.**
- b) Still valid: no regulation has established a formal expiration standard for AI hiring-tool audits.
- c) Still valid: it lapses only if the vendor formally classifies the update as a major version change.
- d) Partially valid: still current for adverse-impact ratios but outdated only for technical performance metrics.

*explanation:* An audit covers a specific tool configuration at a specific point in time. A ranking-algorithm update changes that configuration, potentially altering how the model scores applicants and whether adverse impact occurs. Waiting for a vendor-declared major version or pointing to absent expiration standards both misplace decision authority with the vendor rather than with the deployer's own ongoing analysis.

### 97. AIHR-I · D2 · task 2.5 · `f9445a85`

> Analyze a vendor bias-audit report to distinguish what it establishes from what it does not

**A vendor's audit covers the AI tool's scoring output but not the human review panel that subsequently ranks shortlisted candidates. An HR analyst concludes the audit validates the company's full hiring process. What is wrong with that conclusion?**

- a) The audit covers the tool, and human review is presumed unbiased unless a separate complaint is filed.
- b) Audits must include human review stages to be recognized as valid by equal-employment authorities.
- c) Human review panels require a separate behavioral audit conducted only by qualified industrial psychologists.
- **`KEY` d) The audit's scope ends at the tool's output; bias introduced in the human review stage is unexamined.**

*explanation:* An audit's scope is bounded by what was actually examined. This audit covered only the tool's scoring output, leaving the human review stage—and any bias it introduces—outside the audit's findings. The conclusion conflates coverage of one workflow component with validation of the entire process. Requiring human-stage inclusion for validity, or mandating industrial psychologists, are not established standards.

### 98. AIHR-I · D2 · task 2.5 · `6915d352`

> Analyze a vendor bias-audit report to distinguish what it establishes from what it does not

**An employer's legal team argues that a favorable vendor bias audit shields the company from discrimination liability if an applicant files a claim. Which analysis is correct?**

- **`KEY` a) Incorrect: the audit is evidence of diligence but does not transfer or eliminate the employer's liability.**
- b) Partly correct: liability transfers for the audited job category but stays with the employer for other roles.
- c) Correct: a third-party audit formally transfers legal responsibility for disparate impact to the vendor.
- d) Correct if the auditor is independent: regulator-recognized audits carry indemnifying force by convention.

*explanation:* A bias audit is evidence that the deploying organization exercised diligence, not a mechanism that transfers legal liability to the vendor. Employers remain responsible for discriminatory outcomes produced by tools they choose to deploy, regardless of audit results. Transferring liability to the vendor, limiting transfer to audited job categories, or treating independent audits as indemnifying are all unsupported claims.

### 99. AIHR-I · D2 · task 2.6 · `d5b1f73b`

> Apply accommodation and accessibility duties to AI-mediated assessment

**A gamified AI assessment measures problem-solving speed. A candidate with a motor impairment cannot operate the game controls at the required pace. What must the employer do?**

- a) Extend the time limit, because removing the speed constraint resolves any motor-impairment barrier in gamified assessments.
- b) Accept the result, because the timed format is job-relevant and was applied uniformly to all candidates.
- **`KEY` c) Provide an equivalent problem-solving assessment that does not require motor-speed input.**
- d) Rely on vendor accessibility certification, because commercial validation shifts the employer's obligation to the vendor.

*explanation:* When the interface—not the construct being measured—creates the performance barrier, the employer must provide an alternative that isolates the actual construct (problem-solving) from the inaccessible delivery mechanism. Uniform application of the same format does not neutralize discriminatory impact, extended time does not resolve a motor-control barrier in a game-based interface, and vendor certification does not transfer the employer's duty.

### 100. AIHR-I · D2 · task 2.6 · `5abec73c`

> Apply accommodation and accessibility duties to AI-mediated assessment

**An HR team is launching an AI video-interview tool that scores facial expressions and speech cadence. What must they do before deployment to meet accessibility duties?**

- **`KEY` a) Design and validate an equivalent alternative assessment path before any candidate sits the tool, matched in construct and psychometric quality.**
- b) Make an alternative route available on request after launch, since building one in advance is only required once a specific need arises.
- c) Validate that the tool accurately predicts job performance, confirming the construct rather than the interface is being measured.
- d) Apply the same video format to every candidate uniformly, since identical conditions prevent the assessment from systematically disadvantaging any group.

*explanation:* Accessibility duties require a genuinely equivalent alternative—matched in construct and psychometric quality—to be designed and validated before deployment, not improvised after a request arrives. Demonstrating accurate predictive validity does not resolve interface barriers for candidates with speech or facial-movement disabilities. Building the alternative only on request leaves candidates without a usable option when they need it. Applying uniform conditions does not neutralise systematic disadvantage caused by the format itself.

### 101. AIHR-I · D3 · task 3.1 · `542e75fd`

> Determine the observable capabilities a stated business need actually requires

**A recruiter finishes writing a job description and considers role scoping complete. What is wrong with this sequence?**

- a) The job description should go to compensation first so scope reflects the salary band.
- b) Scoping is complete at this stage; the error is not involving the hiring manager in drafting.
- **`KEY` c) Role scoping must precede the job description; reversing the order embeds undefined accountabilities.**
- d) The role should be narrowed further after sourcing, once the talent pool is known.

*explanation:* Role scoping defines what the role is accountable for and must constrain the job description, not emerge from it. Writing the description first risks embedding vague or overlapping accountabilities that make accurate candidate evaluation impossible. Routing to compensation or adjusting scope post-sourcing both substitute the wrong anchor for business logic. Involving the manager in drafting is good practice but does not address the sequencing error.

### 102. AIHR-I · D3 · task 3.1 · `23cb99e8`

> Determine the observable capabilities a stated business need actually requires

**A manager says the new hire must have 'ten or more years in supply chain.' To convert this into an observable capability, the recruiter should:**

- a) Label the experience figure a preferred qualification rather than a mandatory one.
- b) Keep the ten-year threshold because experience length reliably signals capability.
- **`KEY` c) Ask what behaviors or outputs that experience is assumed to produce, then define those.**
- d) Replace it with a degree requirement, since credentials are equally observable.

*explanation:* Years of experience is a proxy, not a capability. The recruiter must identify the concrete, assessable behaviors the experience is supposed to guarantee, then specify those directly. Keeping the threshold treats a proxy as a valid measure. Substituting a credential commits the same error — credentials are also inferred rather than directly observed as behavioral output. Relabeling the requirement as preferred still leaves an unobservable criterion in place.

### 103. AIHR-I · D3 · task 3.2 · `94e3150c`

> Distinguish AI-related job titles that describe materially different work

**A posting titled 'Principal Data Scientist' lists duties: running SQL queries on pre-labeled datasets, generating weekly reports via a vendor platform, and presenting findings to stakeholders. What does this most accurately indicate?**

- **`KEY` a) A seniority-inflated analyst role, because the tasks are reporting and querying work that does not match the title's claimed level.**
- b) A senior model-building role, because 'Principal' consistently signals advanced ML research responsibilities.
- c) A legitimate senior role, because SQL and vendor platform expertise qualify as advanced skills in enterprise data science.
- d) An AI governance role, because stakeholder presentation and dataset oversight are responsible-AI functions.

*explanation:* The described tasks—SQL queries, vendor platform reporting, and stakeholder presentations—reflect analyst-level work. The 'Principal' title claims a seniority level the described responsibilities do not support, which is a textbook case of seniority inflation. 'Principal' is not a standardized indicator of model-building depth; the tasks must be read directly.

### 104. AIHR-I · D3 · task 3.2 · `a4245033`

> Distinguish AI-related job titles that describe materially different work

**A recruiter must fill a role requiring model fine-tuning. Candidate A fine-tuned an LLM on proprietary data. Candidate B built prompt chains integrating GPT-4 into a CRM workflow. Which candidate should advance?**

- a) Either equally, because both worked with LLMs and the distinction between fine-tuning and API integration is a tooling preference.
- **`KEY` b) Candidate A, because modifying model weights on proprietary data is the specific builder skill the role requires.**
- c) Candidate B, because cross-functional CRM integration shows business impact that outweighs narrow model-training experience.
- d) Candidate B, because proficient API use demonstrates the same underlying model competency as fine-tuning.

*explanation:* Fine-tuning a model on proprietary data requires understanding of training pipelines, weight updates, and evaluation—work that is materially different from constructing prompt chains and calling APIs. The role specifies model fine-tuning, so the candidate whose described work matches that requirement should advance. Proficient API use does not qualify someone for model modification work.

### 105. AIHR-I · D3 · task 3.3 · `551f3a63`

> Determine whether a job description specifies AI capability as observable tasks or as tool names

**A recruiter sees a requisition requiring 'Must have 3 years of Tableau experience.' No candidate using a different BI tool is being considered. What should the recruiter do first?**

- a) Retain the Tableau requirement, since named tools help candidates self-screen before applying.
- b) Keep the tool name but add a seniority label to signal the role's technical depth.
- **`KEY` c) Rewrite it as an observable task, such as 'builds and publishes interactive dashboards from raw data.'**
- d) Move Tableau to the nice-to-have section without changing the existing requirement language.

*explanation:* Naming a specific tool restricts the pool to prior users of that product rather than to candidates who can perform the underlying work. Rewriting the requirement as an observable task opens the pool to all capable candidates regardless of which tool they used. Retaining the tool name for self-screening perpetuates the same narrowing problem. Moving the tool name to nice-to-have without rewording still anchors screening to product familiarity rather than demonstrated capability.

### 106. AIHR-I · D3 · task 3.3 · `ed7e68c6`

> Determine whether a job description specifies AI capability as observable tasks or as tool names

**A candidate has never used the tool named in a job posting but has performed every listed task using a different platform. Applying task-based hiring principles, what should the recruiter do?**

- **`KEY` a) Advance the candidate, because demonstrated task performance meets the capability requirement regardless of which specific tool was used.**
- b) Reject the candidate and flag the requisition for a diversity review, since a mismatch between posted requirements and applicant background may signal a systemic barrier.
- c) Reject the candidate, because every item in a job posting represents a non-negotiable gate that must be met exactly as written.
- d) Advance the candidate only for junior roles, where the cost and disruption of switching to a new platform are generally considered acceptable.

*explanation:* Task-based hiring evaluates whether a candidate can perform the required work, not whether they used a specific product. A candidate who has performed every listed task on a different platform has demonstrated the underlying capability. Rejecting on tool-name grounds confuses product familiarity with competence. Limiting task-based evaluation to junior roles misapplies the principle, which is role-agnostic. Triggering a diversity review addresses a potential systemic symptom rather than applying the correct capability-focused screening standard.

### 107. AIHR-I · D3 · task 3.4 · `815cd748`

> Analyze how AI shifts the task composition of an existing role

**After deploying an AI writing assistant, an editor role still requires final approval, brand-voice judgment, and stakeholder negotiation. The team lead updates the job description by deleting 'drafting' duties and keeping all other lines unchanged. What is the primary flaw in this approach?**

- a) The revision should have also updated performance metrics to reflect output volume, since AI increases the content editors can approve per day.
- **`KEY` b) Removing automated tasks without rebuilding the role around residual judgment and accountability leaves the redesign incomplete.**
- c) The revision should wait until AI capabilities stabilize, because role redesign is best done once as a post-maturity project.
- d) Approval duties should also be removed, since AI-generated content reduces the volume of editorial decisions that need to be made.

*explanation:* Role redesign requires actively rebuilding the role's purpose, hiring criteria, and performance expectations around the judgment, brand-voice, and accountability tasks that now define the work—not merely subtracting automated line items. Simply deleting tasks leaves the role implicitly anchored to its old structure. Updating only volume-based metrics misses the qualitative shift in what the role demands. Treating redesign as a one-time, post-maturity event ignores that AI capabilities continue to expand, making redesign an ongoing process.

### 108. AIHR-I · D3 · task 3.7 · `5d826dc4`

> Interpret published competence documentation to determine what a credential tested

**A credential program publishes no JTA and no blueprint, but its website describes a rigorous development process. What should an evaluator do when asked to recommend it for a hiring screen?**

- **`KEY` a) Decline to recommend it, because without published scope documentation the program offers no verifiable validity evidence.**
- b) Recommend it cautiously, because a described rigorous process is reasonable proxy evidence when formal documentation is absent.
- c) Recommend it if the provider is well-known, because brand reputation substitutes for published validity evidence in practice.
- d) Recommend it after confirming item count, because question volume determines scope validity without a blueprint.

*explanation:* A program publishing no JTA and no blueprint provides no verifiable evidence of what it assessed; an evaluator cannot make a defensible hiring inference from marketing descriptions alone. A described rigorous process, item count, and brand reputation are not substitutes for published documentation of content domain and cognitive level.

### 109. AIHR-I · D3 · task 3.7 · `4ed7a722`

> Interpret published competence documentation to determine what a credential tested

**A credential's marketing claims it is 'competency-based and performance-oriented,' but its published blueprint lists all items at the knowledge/recall level. Which action correctly applies this evidence?**

- a) Treat it as performance-based, because any JTA-derived exam must have captured observable workplace behaviors.
- b) Suspend judgment until item count is known, because cognitive level only matters in exams with fewer than 60 items.
- **`KEY` c) Treat the credential as recall-level, because the blueprint's declared taxonomy governs the inference, not the marketing language.**
- d) Accept the marketing claim, because 'competency-based' language reliably signals higher-order thinking in the item bank.

*explanation:* The blueprint's declared cognitive level is the authoritative validity evidence; marketing language is not. When the two contradict, a competent evaluator relies on the published scope document. Accepting marketing language over documented taxonomy, assuming JTA use guarantees performance-based items, or tying cognitive-level relevance to item count all reflect misapplications of credential evaluation principles.

### 110. AIHR-I · D3 · task 3.8 · `f061a2da`

> Determine the appropriate verification action for a claimed credential and recognize fabrication or lapse signals

**A candidate presents a clear digital scan of a professional license. The issuing board's name is legible and no alterations are visible. What should the HR specialist do next?**

- a) Have the candidate sign an authenticity declaration, transferring liability if the credential is false.
- b) Accept the scan, since forgeries are typically caught by careful visual inspection.
- c) Check the candidate's professional networking profile, since platforms cross-check member credentials.
- **`KEY` d) Contact the issuing board directly to verify the license number, holder name, and current status.**

*explanation:* Verification requires confirmation from the issuing body's own records. A clean-looking scan cannot reveal whether the license is active or genuine. A signed declaration shifts liability but does not confirm authenticity. A professional networking profile is a candidate-controlled or intermediary source, not an authoritative issuer record. Only direct contact with the issuing board confirms whether a matching, active record exists.

### 111. AIHR-I · D3 · task 3.9 · `ff0ab093`

> Determine how AI-driven task change affects internal mobility and reskilling decisions

**A workforce planner argues that the ATS already surfaces internal candidates because employees can create profiles on the external recruiting platform. What is the critical flaw in this reasoning?**

- **`KEY` a) Most employees never self-nominate on external platforms, so the internal talent pool remains largely invisible to the system.**
- b) External platforms use different competency frameworks, making internal profiles incompatible with internal role requirements.
- c) External platforms rank candidates by years of experience, which systematically disadvantages shorter-tenured internal employees.
- d) Employees who create profiles on external platforms signal intent to leave, skewing the internal candidate pool toward flight risks.

*explanation:* An external ATS depends on voluntary self-nomination, so most of the internal workforce never appears in it. A dedicated internal marketplace proactively profiles capabilities rather than waiting for employees to opt in. Ranking by tenure, framework incompatibility, and flight-risk signaling are secondary concerns that do not address the core visibility gap created by passive internal populations.

### 112. AIHR-I · D3 · task 3.9 · `242d6b00`

> Determine how AI-driven task change affects internal mobility and reskilling decisions

**A logistics company introduces AI route optimization. Planners now focus on exception management and carrier negotiation instead of manual scheduling. The workforce plan should treat this primarily as:**

- **`KEY` a) A task-composition shift that changes skill emphasis within the role and triggers an internal adjacency and reskilling review.**
- b) A role-elimination event requiring headcount reduction, since AI now performs the core task planners were hired to do.
- c) A technology upgrade affecting only tools used, leaving the role design and required competencies unchanged.
- d) A temporary transition requiring no plan revision, because roles will stabilize once AI implementation is complete.

*explanation:* AI typically reshapes the task mix within surviving roles rather than eliminating them. Treating the change as a task-composition shift correctly triggers a review of internal adjacency and reskilling needs. Framing it as role elimination, a temporary transition, or a tool-only upgrade all cause the organization to miss the real workforce planning obligation.

### 113. AIHR-I · D4 · task 4.1 · `810c2ebb`

> Apply confidentiality rules to candidate data in general-purpose AI tools

**A recruiter accesses an AI writing assistant through the company's single sign-on portal. It is not listed in the approved tools register. Can the recruiter paste interview notes into it?**

- a) Yes, provided the recruiter deletes the session, which eliminates any compliance risk.
- b) Yes, because interview notes are the interviewer's work product, not the candidate's personal data.
- c) Yes, because SSO access means the vendor meets the organisation's data-handling standards.
- **`KEY` d) No, because SSO access is not organisational approval; the tool must appear on the approved register.**

*explanation:* IT authentication through SSO controls who can log in; it does not constitute a data-protection review or organisational approval for processing candidate personal data. Interview notes record what a candidate said and did and are therefore personal data about the candidate, not merely the interviewer's work product. The recruiter must confirm the tool is on the approved register before entering any candidate data.

### 114. AIHR-I · D4 · task 4.2 · `11601b9a`

> Determine what review an AI-drafted recruiting artifact requires before it is published or sent

**A recruiter uses an AI tool to draft a job posting. It lists a certification requirement and salary band. The recruiter has no approved job brief. What should the recruiter do before publishing?**

- a) Publish as drafted, because a confidently stated certification requirement signals the AI used authoritative regulatory data.
- b) Review only tone and grammar before publishing, since factual errors are uncommon in modern AI-generated content.
- c) Publish immediately, because clicking 'publish' counts as human involvement and satisfies AI oversight requirements.
- **`KEY` d) Obtain the approved job brief and verify every requirement and salary figure against it before publishing.**

*explanation:* Whatever a job posting states becomes the organization's commitment, regardless of how it was generated. Without an approved job brief, the recruiter cannot confirm that the certification requirement or salary band is accurate or authorized. Publishing without that verification creates legal and operational exposure. Clicking publish, checking only tone and grammar, or trusting the AI's confident phrasing do not fulfill the obligation to verify substantive factual claims against an approved source before the posting goes live.

### 115. AIHR-I · D4 · task 4.2 · `004d1a43`

> Determine what review an AI-drafted recruiting artifact requires before it is published or sent

**Before an AI-drafted job description is published, a recruiter's primary review responsibility is to:**

- a) Check spelling, tone, and formatting, because those elements most often cause candidate confusion.
- **`KEY` b) Verify that every requirement, benefit, and legal statement matches the approved role brief.**
- c) Confirm posting length and keyword density to optimize search visibility before publication.
- d) Scan for discriminatory language only, because salary and legal content is accurate when AI uses real posting data.

*explanation:* Reviewing AI-drafted recruiting content is primarily a factual accuracy check against approved source material, not a style or grammar exercise. AI models can invent requirements, salary figures, and legal language, and the organization is bound by whatever is published, making factual verification the recruiter's core duty.

### 116. AIHR-I · D4 · task 4.3 · `065f018d`

> Assess AI-generated or AI-assisted candidate material fairly

**An HR team argues that a blanket ban on AI-assisted applications carries no discrimination risk because it applies equally to all candidates. Which analysis is correct?**

- a) A blanket ban is permissible because organizations have a legitimate basis for distinguishing AI-assisted from human-written material.
- b) A blanket ban is legally safe when the organization documents its business justification and applies the policy consistently.
- c) A blanket ban eliminates discrimination risk because it treats all candidates' applications under identical submission criteria.
- **`KEY` d) A facially neutral ban can still produce disparate impact if AI-detection enforcement disproportionately flags protected groups.**

*explanation:* Even a facially neutral policy creates disparate impact liability when its enforcement tool—AI-detection software—flags non-native speakers at higher rates. Consistent application of a flawed enforcement mechanism does not cure the discriminatory effect. Documenting a business justification does not shield an organization from disparate impact claims, and treating all candidates under identical criteria does not guarantee equal outcomes when the detection method is biased.

### 117. AIHR-I · D4 · task 4.3 · `943aaf21`

> Assess AI-generated or AI-assisted candidate material fairly

**An organization bans AI-assisted applications entirely, arguing the rule applies equally to all candidates and therefore eliminates discrimination liability. What is the critical flaw in this reasoning?**

- **`KEY` a) Uniform rules can still produce disparate impact when non-native speakers who rely on AI for language support are disproportionately burdened.**
- b) A blanket ban is enforceable only when the organization documents a validated detection tool with a false-positive rate below 5%.
- c) The ban misidentifies the problem; writing quality, not candidate qualifications, is the legal issue courts examine in hiring disputes.
- d) The ban is unenforceable because AI-assisted and human-written text are legally indistinguishable, removing any valid basis for the policy.

*explanation:* Facially neutral policies can still create disparate impact when they disadvantage protected groups unequally in practice. Non-native English speakers who use AI to bridge language gaps are disproportionately burdened by a blanket ban, preserving discrimination exposure despite the rule's uniform wording. No validated detection threshold makes such a ban legally defensible as a standalone enforcement mechanism, and courts examine whether qualified candidates were excluded, not writing quality in isolation.

### 118. AIHR-I · D4 · task 4.4 · `cdb8b264`

> Determine when a hiring task must not be delegated to AI

**A candidate requests the reason for their rejection after receiving an AI-generated email with a footer disclosing it was produced by an automated system. What is the organization's accountability position?**

- a) Protected; the automated-system disclosure shifts responsibility away from the organization for the decision the email conveys.
- **`KEY` b) Fully accountable; the organization is bound by every communication it sends to candidates, regardless of what drafted it.**
- c) Protected; a rejection sent by an ATS is held to a lower legal standard than one delivered by a recruiter.
- d) Partially accountable; accountability is shared equally between the organization and the AI vendor whose system sent the email.

*explanation:* An organization is bound by every communication it sends to candidates, including AI-generated ones; a disclosure footer does not disclaim that accountability. The mode of delivery—ATS, automated email, or recruiter—does not change the legal standard applied to the adverse decision. Vendor co-liability does not reduce the organization's own obligation, and no lower standard applies simply because an ATS transmitted the message.

### 119. AIHR-I · D4 · task 4.4 · `976cd01e`

> Determine when a hiring task must not be delegated to AI

**An AI screening tool shows statistically equal rejection rates across all demographic groups. A compliance officer proposes eliminating individual human review of rejections based on this finding. What should the hiring process owner do?**

- a) Accept the proposal; balanced aggregate rejection rates confirm individual adverse decisions are fair and need no human review.
- b) Accept the proposal only for candidates below the median, retaining human review for borderline scores near the cutoff.
- c) Accept the proposal and schedule quarterly audits of the fairness statistics to maintain ongoing accountability.
- **`KEY` d) Reject the proposal; aggregate fairness metrics do not substitute for individual human review of adverse decisions candidates can contest.**

*explanation:* Aggregate demographic parity does not satisfy the individual-level accountability obligation that attaches to each adverse decision. A candidate who contests their rejection is entitled to a human-reviewed, documented rationale; a group-level statistic cannot answer an individual's challenge. Restricting human review to borderline scores still leaves clear rejections unaccountable. Periodic audits are a separate obligation and do not replace individual-level review.

### 120. AIHR-I · D4 · task 4.4 · `5a2ece23`

> Determine when a hiring task must not be delegated to AI

**A hiring manager reads an AI recommendation to reject a borderline candidate, agrees with it, and takes no further action. The candidate is rejected automatically. Which statement correctly describes the manager's accountability?**

- a) No accountability; passive agreement with an AI output is not a human decision and creates no documentation obligation.
- b) Partial accountability, shared equally with the AI vendor, because the tool initiated the outcome.
- **`KEY` c) Full accountability; choosing not to override an AI recommendation is itself a human decision the manager must document.**
- d) No accountability; the AI produced the recommendation and the rejection was executed automatically, not by the manager.

*explanation:* When a manager has the ability to override an AI recommendation and chooses not to, that inaction is itself a human decision; the outcome belongs to the manager, not the AI. Accountability is personal and attaches at the point of human deliberation, regardless of whether the manager actively typed a rejection or passively allowed automation to proceed. Treating passive agreement as a non-decision, or sharing accountability equally with the vendor, misrepresents where the obligation sits.

---

# AIMS-F — ISO/IEC 42001:2023 Foundation

**Source this certification cites:** ISO/IEC 42001:2023.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 121. AIMS-F · D1 · task 1.1 · `09db140e`

> Explain what an AI management system is and what a management system standard does

**Which PDCA phase does an internal AIMS audit belong to, and why?**

- **`KEY` a) 'Check', because audits are a performance evaluation mechanism that monitors the AIMS against its requirements.**
- b) 'Act', because audit findings trigger corrective actions, making the audit part of the improvement response.
- c) 'Plan', because audits establish the evidence base needed before objectives and risk treatments can be set.
- d) 'Do', because audits are operational activities carried out as part of running the management system daily.

*explanation:* Internal audits are a 'Check' activity: they evaluate whether the AIMS conforms to requirements and is effectively implemented. Corrective actions taken in response to audit findings belong to 'Act'; the audit itself is not an operational 'Do' activity nor a planning input.

### 122. AIMS-F · D1 · task 1.2 · `b97b25ea`

> Determine the organization's roles with respect to its AI systems

**A data analytics firm uses a third-party AI platform and also co-develops new AI features with that vendor under a joint agreement. What does the 'AI partner' role capture in this arrangement?**

- **`KEY` a) A shared lifecycle collaboration where joint development creates shared responsibility for the system's AI impacts.**
- b) A regulatory co-filing arrangement where both organizations jointly submit compliance documentation to authorities.
- c) A reseller arrangement where the firm markets the vendor's platform to its own clients under a commercial licence.
- d) A subscription relationship where the firm receives vendor support under a standard service-level agreement.

*explanation:* The AI partner role describes an organization that collaborates in the AI system lifecycle in ways that create shared responsibility for AI impacts. A joint feature-development agreement with shared influence over the system fits this definition. A subscription, reseller arrangement, or regulatory co-filing does not constitute lifecycle collaboration of this kind.

### 123. AIMS-F · D1 · task 1.4 · `3f0430cf`

> Explain the harmonised structure and how ISO/IEC 42001 sits alongside ISO/IEC 27001 and ISO 9001

**How does the Harmonised Structure affect Clause 9 management review inputs in ISO/IEC 42001 compared with ISO/IEC 27001?**

- a) It makes Clause 9 inputs identical across both standards, so no AI-specific performance indicators need to be added to the review agenda.
- b) It means ISO/IEC 42001 replaces the ISO/IEC 27001 management review entirely, requiring separate non-integrated review cycles.
- **`KEY` c) It provides a shared review structure, but ISO/IEC 42001 additionally requires AI-specific performance data not present in ISO/IEC 27001 reviews.**
- d) It allows ISO/IEC 27001 management review outputs to satisfy ISO/IEC 42001 Clause 9 without adding any AI-specific content.

*explanation:* While the Harmonised Structure gives Clause 9 a common framework across standards, ISO/IEC 42001 requires management review inputs and outputs that reflect AI system performance, including AI-specific indicators. Reusing ISO/IEC 27001 review records without AI-specific content would not fulfil Clause 9 of ISO/IEC 42001.

### 124. AIMS-F · D1 · task 1.5 · `83f159c4`

> Explain the regulatory drivers for an AIMS and why certification is not compliance

**Which description of the EU AI Act is most accurate?**

- a) It applies identical mandatory obligations to every AI system regardless of the risk level it presents.
- **`KEY` b) It imposes risk-tiered obligations on a phased timeline that has been revised since the Act was adopted.**
- c) It is fully in force with all provisions immediately applicable and no transitional periods remaining.
- d) It treats ISO/IEC 42001 certification as conclusive proof of compliance with its requirements.

*explanation:* The EU AI Act differentiates obligations by risk tier—prohibited, high-risk, limited-risk, and minimal-risk—and its implementation timeline has been amended since initial adoption, meaning different provisions apply at different dates. The Act does not apply uniformly to all AI systems regardless of risk. Not all provisions are immediately applicable; transitional periods exist. ISO/IEC 42001 certification is not treated as conclusive proof of compliance with the Act.

### 125. AIMS-F · D1 · task 1.6 · `a0772e2c`

> Distinguish an AIMS from model-level assurance and from AI ethics frameworks

**A regulator asks whether an ISO/IEC 42001-certified organization's deployed models have been validated for bias. What does certification confirm?**

- a) That the organization has adopted a formal AI ethics code covering fairness thresholds for all models.
- **`KEY` b) That the management system includes processes for determining and monitoring bias validation activities.**
- c) That individual AI models are certified as safe and trustworthy through the conformity assessment.
- d) That each deployed model has passed bias validation procedures explicitly mandated by the standard.

*explanation:* ISO/IEC 42001 certifies that a management system governs AI-related decisions, including how technical assurance activities such as bias validation are determined and monitored. It does not mandate specific testing protocols or certify individual models. Certification confirms the system, not the models' technical properties.

### 126. AIMS-F · D1 · task 1.6 · `8d880a2b`

> Distinguish an AIMS from model-level assurance and from AI ethics frameworks

**A compliance officer claims Annex D eliminates the need for a context-of-the-organization analysis by pre-defining sector considerations. Which statement about Annex D is accurate?**

- a) Annex D is informative but triggers mandatory additional controls whenever an organization's sector is listed.
- b) Annex D replaces Clause 4 for listed sectors because sector-level context is more specific than organizational context.
- c) Annex D is normative for listed sectors and reduces the context analysis to a confirmation exercise.
- **`KEY` d) Annex D is informative sector guidance; the normative context-of-the-organization clauses still apply in full.**

*explanation:* Annex D is informative and illustrative. Every organization, regardless of sector, must complete the normative context-of-the-organization analysis under Clause 4. Annex D offers sector illustrations but neither replaces that analysis nor imposes additional mandatory controls. The compliance officer's claim reflects a common misreading of informative annexes.

### 127. AIMS-F · D2 · task 2.1 · `f50f74e8`

> Determine the organization's context and interested parties for an AIMS

**During AIMS scoping, a team argues that climate change need only be considered if the organization holds an ISO 14001 certificate. Which action correctly applies clause 4.1 of ISO/IEC 42001?**

- a) Accept the argument only if the AI systems have no direct carbon footprint, since indirect climate relevance is excluded from clause 4.1.
- b) Reject the argument, but limit assessment to AI infrastructure energy use, as that is the only climate-relevant internal issue under clause 4.1.
- c) Accept the argument; clause 4.1 delegates climate-change assessment to whichever environmental management system the organization operates.
- **`KEY` d) Reject the argument; climate change must be assessed as a relevant issue regardless of whether an environmental management system exists.**

*explanation:* Clause 4.1 explicitly requires every organization implementing an AIMS to determine whether climate change is a relevant issue; this obligation is independent of holding ISO 14001 or any other environmental certification. Neither direct carbon emissions nor energy consumption alone defines the boundary of what must be assessed.

### 128. AIMS-F · D2 · task 2.2 · `66fea350`

> Determine the scope of the AI management system

**A retailer's AIMS scope covers only internally developed AI. A compliance officer discovers that a cloud HR vendor has quietly enabled an AI feature that actively ranks job applicants. What should the organization do?**

- a) Keep the scope unchanged, because the organization does not own or develop the vendor's AI and bears no AIMS obligation for it.
- **`KEY` b) Expand the AIMS scope to include the vendor feature, since third-party AI used in organizational processes falls within the AIMS boundary.**
- c) Log the discovery as a nonconformity and defer any scope revision until the next scheduled management review cycle.
- d) Permanently exclude the feature, because the organization cannot control how the vendor built or trained the underlying model.

*explanation:* ISO/IEC 42001 requires the scope to reflect AI systems that affect the organization's activities, regardless of who developed them. The vendor's screening feature is actively influencing hiring decisions within the organization's processes, so it falls inside the AIMS boundary. Keeping the scope limited to internally developed tools leaves a material AI system ungoverned — this is a scope definition problem, not merely a nonconformity to log. Lack of ownership or inability to control the vendor's model does not exempt the organization from governing how that AI affects its own outcomes.

### 129. AIMS-F · D2 · task 2.3 · `f2265782`

> Explain leadership requirements, the AI policy, AI objectives and planning of changes

**An organization's AI policy states: 'We commit to developing AI responsibly and improving transparency with affected communities.' A reviewer argues this is non-conforming because it lacks a numeric target. Which statement best describes the reviewer's position?**

- a) Correct, because every policy commitment must be paired with a quantitative KPI under ISO/IEC 42001.
- b) Incorrect, because a clear policy commitment removes the need for separate objectives on the same topic.
- **`KEY` c) Incorrect, because the policy states high-level commitments; numeric targets belong in objectives, not the policy.**
- d) Correct, because ISO/IEC 42001 prohibits directional language in the policy when measurable targets are feasible.

*explanation:* The AI policy's role is to provide a framework and state high-level commitments — it is not required to contain numeric targets. Measurable targets are a feature of AI objectives. The reviewer is incorrect because the standard treats the policy and objectives as distinct artifacts; a policy commitment does not replace objectives, nor must commitments be quantified within the policy itself.

### 130. AIMS-F · D2 · task 2.4 · `5d0d9624`

> Assign roles, responsibilities and authorities for AI

**After AIMS certification, an organization significantly expands its AI use into new business domains but does not revisit its role and authority assignments. This situation is best described as:**

- a) Acceptable, because role assignment is a one-time setup activity completed at implementation.
- b) A concern only at the next three-year recertification audit, when scope changes are formally reviewed.
- **`KEY` c) A concern, because role and authority assignments must reflect the organization's current AI scope.**
- d) Acceptable, because the conformance authority holder automatically covers any new AI domains.

*explanation:* Role and authority assignments under ISO/IEC 42001 must remain relevant to the organization's actual AI use; as scope evolves, assignments should be reviewed so that no outcomes are left unowned. The standard does not treat role assignment as a one-time activity, does not automatically extend any single role to new domains, and does not defer scope-driven reviews to a recertification cycle. The three-year recertification cycle is a certification body practice, not a requirement of the standard.

### 131. AIMS-F · D2 · task 2.4 · `255323d0`

> Assign roles, responsibilities and authorities for AI

**Top management assigns one person to hold both conformance authority and performance reporting authority for the AIMS. Which statement about this arrangement is accurate?**

- a) Non-compliant, because combining the roles creates a conflict of interest the standard explicitly prohibits.
- **`KEY` b) Permissible, because the standard identifies them as distinct functions but does not require separate holders.**
- c) Permissible only if the combined role is reviewed and reconfirmed at every management review.
- d) Non-compliant, because ISO/IEC 42001 requires these two authorities to be held by separate individuals.

*explanation:* ISO/IEC 42001 identifies ensuring AIMS conformance and reporting AIMS performance as two distinct assigned authorities, but it does not prohibit a single person from holding both, nor does it require them to be combined. There is no conflict-of-interest prohibition in the standard regarding this combination, and no requirement to reconfirm the arrangement at each management review. The choice of one or two holders is an organizational decision, provided both functions are clearly assigned.

### 132. AIMS-F · D2 · task 2.6 · `ea67eb46`

> Apply the AI system impact assessment

**An organization documents both individual and societal impacts in one AI system impact assessment report for a hiring tool. The compliance manager proposes removing societal impacts, arguing they belong in a separate governance process. What should the organization do?**

- a) Remove societal impacts, because ISO/IEC 42001 requires individual and societal impacts to be assessed in separate documents.
- **`KEY` b) Retain societal impacts, because the assessment must address consequences for groups and societies alongside individual impacts.**
- c) Move societal impacts to an annex, because the standard's mandatory template separates individual and societal sections.
- d) Remove societal impacts, because only public-sector organizations must assess broader societal consequences.

*explanation:* ISO/IEC 42001 requires the AI system impact assessment to address impacts on individuals, groups of individuals, and societies within the same documented process. There is no requirement to separate these into distinct documents, and no exemption exists for private-sector organizations. The standard also prescribes no fixed mandatory template, so relocating content to an annex for structural compliance is not a requirement. Removing societal impacts on either of these grounds would leave the assessment incomplete.

### 133. AIMS-F · D2 · task 2.6 · `b1ea2bf8`

> Apply the AI system impact assessment

**A loan-approval AI denies credit without notifying applicants that an AI made the decision. Which party must be included in the impact assessment?**

- a) Only financial regulators, because they are the primary interested parties for credit AI systems.
- b) Only applicants who actively use the online portal, as they are the direct end-users.
- **`KEY` c) Denied applicants, even those who never interact with the system, because third-party impacts are in scope.**
- d) Only internal credit analysts who review AI outputs before final decisions are issued.

*explanation:* The impact assessment must identify impacts on all affected individuals, including those who never interact with the system but whose legal position or life opportunities are affected by its decisions. Limiting scope to direct users or internal staff excludes third parties who bear real consequences. Regulators are interested parties but do not replace affected individuals in scope.

### 134. AIMS-F · D2 · task 2.6 · `a335a9a2`

> Apply the AI system impact assessment

**An AI loan-approval system denies credit without ever displaying results to applicants. An assessor argues applicants need not be included in the impact assessment because they never interact with the system. What should the organization do?**

- a) Defer to the completed DPIA, because it fully covers individual impact for automated loan decisions.
- b) Exclude applicants, because impact assessment scope covers only users who interact directly with the AI interface.
- **`KEY` c) Include applicants, because the assessment must cover parties whose legal position or life opportunities the system affects.**
- d) Include applicants only if they belong to a protected group; otherwise exclude them from scope.

*explanation:* The AI system impact assessment must identify impacts on individuals whose legal position or life opportunities are affected, regardless of whether those individuals interact with the system. Applicants denied credit are directly affected and must be included. Limiting scope to direct interface users misreads the standard. Including only protected-group members introduces an unjustified restriction. A DPIA addresses data-protection risks and does not fully substitute for the broader individual-impact analysis required by ISO/IEC 42001.

### 135. AIMS-F · D2 · task 2.8 · `cbfcb33f`

> Apply AI risk treatment and produce the Statement of Applicability

**After risk treatment, an AI risk owner wants to sign off on residual risk without escalating to management. What does ISO/IEC 42001 require?**

- **`KEY` a) Escalate to authorized management, who must approve residual AI risk acceptance.**
- b) Allow the risk owner to approve, since owning the risk grants sufficient authority.
- c) Obtain management sign-off before writing the treatment plan, as approval is a prerequisite.
- d) Defer approval until residual risk is near-zero, as any remaining exposure cannot be accepted.

*explanation:* ISO/IEC 42001 requires designated management to approve both the risk treatment plan and the acceptance of residual AI risks; the risk owner alone lacks sufficient authority. Residual risk need not reach zero before acceptance. Management approval follows finalization of the treatment plan rather than preceding it, so the claim that sign-off is a prerequisite to writing the plan is incorrect.

### 136. AIMS-F · D3 · task 3.2 · `f74447c0`

> Explain awareness and communication requirements

**Under ISO/IEC 42001, what is the organization's obligation regarding external AIMS communications?**

- a) Disclose the AI policy to all external stakeholders as a default requirement of the standard
- b) Communicate externally only when a formal inquiry is received from a regulator or auditor
- **`KEY` c) Determine what AIMS-relevant information to communicate externally, to whom, when, and how**
- d) Treat external communications as out of scope, governed solely by applicable regulatory frameworks

*explanation:* ISO/IEC 42001 requires the organization to plan both internal and external communications, determining the content, audience, timing, and method. It does not mandate blanket external disclosure of the AI policy, does not treat external communications as out of scope, and does not limit external communication to regulator-triggered events. The organization retains discretion over what is communicated externally within the framework it designs.

### 137. AIMS-F · D3 · task 3.2 · `e001ba3c`

> Explain awareness and communication requirements

**A manager argues that a pre-existing corporate communication policy already satisfies ISO/IEC 42001's communication requirement. What is the main flaw in this argument?**

- a) The corporate policy cannot satisfy the requirement because it does not address external regulatory disclosures
- b) A pre-existing policy is invalid unless reapproved after each AIMS audit cycle
- **`KEY` c) A generic policy lacks the AI-specific scope and tailoring that AIMS communication planning requires**
- d) ISO/IEC 42001 mandates a standalone communication document separate from any other organizational policy

*explanation:* ISO/IEC 42001 requires organizations to determine AIMS-relevant communications covering what, when, with whom, and how. A generic corporate policy written without reference to the AIMS cannot be assumed to cover those AI-specific dimensions. The standard does not require a standalone communication document, does not mandate post-audit reapproval, and does not specifically require external regulatory disclosure planning.

### 138. AIMS-F · D3 · task 3.6 · `ab6263f0`

> Explain data management requirements for AI systems

**An organization trains a churn model on historical records, then applies feature normalization and removes duplicates. Under ISO/IEC 42001, what must data provenance capture?**

- a) Only the original data source, since provenance tracks origin rather than downstream processing.
- **`KEY` b) The full chain of creation, transformation, validation, and transfer steps across the data lifecycle.**
- c) Only post-ingestion steps such as normalization and deduplication, since provenance begins when processing starts.
- d) The original source plus contractual agreements, since legal coverage satisfies provenance requirements.

*explanation:* ISO/IEC 42001 describes data provenance as encompassing creation, update, transcription, abstraction, validation, and transfer of control — the complete transformation history. Limiting provenance to the original source alone ignores downstream processing that can introduce errors or bias. Treating only post-ingestion steps as provenance misses the originating context. Equating contractual agreements with provenance conflates data-rights records with the technical and process audit trail the standard requires.

### 139. AIMS-F · D3 · task 3.6 · `dd09940d`

> Explain data management requirements for AI systems

**A model is trained on data that passed through three transformation steps. Under ISO/IEC 42001, which scope of provenance tracking is correct?**

- **`KEY` a) Provenance must cover creation, intermediate transformations, validation, and transfer of control—not only the final dataset.**
- b) Provenance records are technical artifacts and are not linked to the organization's risk management obligations.
- c) Provenance is required only for the final training dataset; upstream preprocessing steps are outside its scope.
- d) Formal provenance tracking is mandatory only for third-party sources; internally generated data is assumed to be known.

*explanation:* ISO/IEC 42001 specifies that provenance records cover creation, update, transcription, abstraction, validation, and transfer of control throughout the pipeline. Limiting provenance to the final dataset or to external sources only leaves intermediate transformation steps ungoverned, which the standard explicitly addresses.

### 140. AIMS-F · D3 · task 3.6 · `87d03b82`

> Explain data management requirements for AI systems

**Under ISO/IEC 42001, how should an organization determine the appropriate level of data quality for an AI system?**

- a) Delegate data quality decisions to data engineers, because the standard treats this as a technical matter only.
- b) Achieve at least 95% training-data accuracy before the system is permitted to enter production.
- c) Apply the same quality dimensions—accuracy, completeness, timeliness—uniformly across all AI systems in the organization.
- **`KEY` d) Define quality criteria suited to the system's purpose and risk level, then demonstrate those criteria are met.**

*explanation:* ISO/IEC 42001 requires organizations to establish data quality criteria appropriate to the specific AI system's purpose and risk—not a universal numeric threshold or a uniform set of dimensions. Treating quality as purely a technical concern misreads the standard's governance orientation, and mandating a fixed accuracy percentage is a prescriptive requirement the standard does not impose.

### 141. AIMS-F · D3 · task 3.7 · `121f8e71`

> Analyze which of an existing ISMS's support and operation machinery carries over to an AIMS

**An organisation marks its three qualified information-security analysts as competent for AI management roles, citing their existing ISO/IEC 27001 Clause 7.2 records. Which statement best identifies the error?**

- a) ISO/IEC 42001 requires competence to be formally re-evaluated on an annual cycle, regardless of role continuity or the quality of previously documented evidence.
- **`KEY` b) AI management requires a distinct body of knowledge, so information-security competence evidence cannot demonstrate AI-specific competence without a separate assessment against AI management criteria.**
- c) Because AI management and information security share core risk-management principles and control frameworks, existing competence records are sufficient to satisfy both domains without further assessment.
- d) The records are reusable only if the analysts also hold a current, externally verified information-security qualification recognised under a national accreditation scheme.

*explanation:* ISO/IEC 42001 Clause 7.2 requires competence appropriate to AI management, which is a different body of knowledge from information security. Prior competence records are evidence for a different domain and cannot substitute for AI-specific competence demonstration without further assessment. No annual re-evaluation mandate or external qualification requirement appears in the standard. The argument that shared risk principles make competence transferable is a genuine misconception but conflates domain overlap with domain equivalence.

### 142. AIMS-F · D3 · task 3.8 · `be876cdf`

> Apply the clause 8 operational requirements for assessment and treatment

**An organization stores AI system impact assessment results in the project manager's personal email folder. Does this satisfy the clause 8 retained-results requirement?**

- a) Yes; the standard does not specify storage location, so a personal email folder is acceptable.
- b) Yes; any record in any form satisfies the requirement because retained results equal retained documents.
- c) No; retained results must be stored in a system formally approved by the certification body.
- **`KEY` d) No; retained results must be controlled documented information traceable to the specific AIMS activity.**

*explanation:* Clause 8 requires retaining documented information as evidence of results; that information must be controlled and traceable to the specific AIMS activity. A personal email folder does not provide adequate control or traceability. The standard does not require a certification-body-approved storage system — the organization determines the appropriate format and location within its document control framework. The claim that any record in any form satisfies the requirement ignores the control and traceability obligations.

### 143. AIMS-F · D3 · task 3.8 · `a90aee16`

> Apply the clause 8 operational requirements for assessment and treatment

**An AI system's output accuracy has degraded significantly over three months due to data drift, with no intentional model update made. Must the organization trigger a clause 8 review?**

- a) No; performance degradation is a monitoring issue handled under clause 9, not a clause 8 trigger.
- b) No; only intentional changes to the model or training data constitute a significant change trigger.
- c) Yes, but only after the degradation is confirmed by an external technical audit of the AI system.
- **`KEY` d) Yes; a significant change in outputs or performance is a trigger regardless of whether it was intentional.**

*explanation:* A significant change in an AI system's outputs or performance triggers a clause 8 review whether or not the change was intentional; the standard does not limit triggers to deliberate model updates. Classifying performance degradation as a clause 9 monitoring matter only, or waiting for external confirmation before acting, would delay a mandatory response not supported by the standard.

### 144. AIMS-F · D4 · task 4.1 · `87c740c9`

> Explain the structure of Annex A and the status of Annex B

**A candidate claims: 'Annex B of ISO/IEC 42001 is normative, so its guidance is a hard requirement organizations must implement without tailoring.' Why is this incorrect?**

- a) Annex B is normative but only applies to organizations with AI systems above a defined risk threshold.
- b) Annex B is normative and lists optional controls that supplement Annex A as an extended catalogue.
- c) Annex B is normative and its guidance becomes mandatory only after inclusion in the Statement of Applicability.
- **`KEY` d) Annex B is normative, but it is written in 'should' - clause 6.1.3 e) has the organization consider its guidance when implementing the controls it has determined, not implement every sentence of it.**

*explanation:* The candidate's premise is correct and the inference is not. Annex B is normative, but normative STATUS and requirement MODALITY are different properties. Annex B restates each control under a 'Control' heading using 'should'. What gives it force is clause 6.1.3 e): the organization shall define an AI risk treatment process that considers the guidance in Annex B for the implementation of the controls determined under b) and c). So it binds as an input to be considered when implementing those controls, not as text whose own sentences are requirements, and tailoring is expected. The risk-threshold option invents a threshold the standard does not contain. The extended-catalogue option misreads Annex B's purpose: it provides implementation guidance for the Annex A controls rather than additional controls. The Statement of Applicability option is contradicted by B.1, which states that organizations do not have to document or justify the inclusion or exclusion of implementation guidance in the statement of applicability.

### 145. AIMS-F · D4 · task 4.1 · `b40e412a`

> Explain the structure of Annex A and the status of Annex B

**A team argues that because Annex A is 'not exhaustive,' any listed control can be dropped without justification. What does 'not exhaustive' actually mean?**

- **`KEY` a) Organizations may add controls beyond the list; listed controls still require risk-based justification to omit.**
- b) Organizations should adopt additional controls from ISO/IEC 27001 Annex A to fill identified AI governance gaps.
- c) The list is incomplete by design, so all listed controls are optional starting points that can be freely substituted.
- d) Because Annex A is normative, all 38 controls remain strictly mandatory regardless of risk profile.

*explanation:* 'Not exhaustive' means the annex permits organizations to add controls beyond those listed; it does not make every listed control freely droppable. Decisions to include or exclude controls are driven by objectives and risk assessment. Treating all listed controls as freely substitutable conflates extensibility with blanket optionality. Claiming all 38 controls are strictly mandatory regardless of risk profile misreads the normative status of the annex. Directing organizations to ISO/IEC 27001 Annex A to fill gaps is unsupported by ISO/IEC 42001.

### 146. AIMS-F · D4 · task 4.2 · `b965acf2`

> Explain how Annex A relates to the Statement of Applicability

**A small AI developer excludes a human-oversight Annex A control, stating only: 'Not applicable to our products.' An assessor flags this as inadequate. Which principle best explains the assessor's concern?**

- a) Human oversight controls are always mandatory under ISO/IEC 42001 and may never be excluded from the SoA.
- b) The exclusion is invalid because it was not pre-approved by an external certification auditor before entry in the SoA.
- **`KEY` c) The justification is a bare assertion; ISO/IEC 42001 requires exclusions to be substantiated, not merely stated.**
- d) The exclusion is invalid because it was not mapped to a specific identified risk demonstrating no residual risk remains.

*explanation:* ISO/IEC 42001 requires that exclusions be documented with substantive justification — a bare assertion of 'not applicable' does not satisfy that requirement. Exclusion is legitimate in principle for any Annex A control, including human oversight controls; no category of control is automatically mandatory. Auditor pre-approval and mandatory one-to-one risk mapping are not conditions imposed by the standard.

### 147. AIMS-F · D4 · task 4.3 · `379b53fe`

> Select controls for AI policy, internal organization and resources

**An AIMS resource assessment was completed eighteen months ago. The AI portfolio has since expanded significantly. Which action is consistent with ISO/IEC 42001 resource controls?**

- a) Limit the review to computational capacity, as hardware and cloud resources define the scope of resource controls.
- **`KEY` b) Reassess resource adequacy—people, tools, and infrastructure—to reflect the expanded AI portfolio.**
- c) Update only budget allocation records, since financial documentation is the primary evidence of resource control.
- d) Retain the original assessment, as resource controls require only a single documented evaluation at implementation.

*explanation:* Resource controls require ongoing assurance that all resources—human competencies, tooling, data, and infrastructure—remain adequate as the AIMS evolves; a one-time assessment does not satisfy this. Budget records alone are insufficient, and human competencies are explicitly within scope alongside computational resources.

### 148. AIMS-F · D4 · task 4.3 · `52004aae`

> Select controls for AI policy, internal organization and resources

**An internal AIMS audit finds no documented process for staff to raise concerns about AI practices. Which control category applies to close this gap?**

- **`KEY` a) Reporting of concerns controls, by establishing an internal process for staff to raise AI-related issues.**
- b) Internal organization controls, by assigning a named role to receive AI-related concerns from staff.
- c) Resource controls, by documenting the human resources available to investigate AI complaints.
- d) Policy controls, by adding an ethical AI commitment statement to the existing AI policy.

*explanation:* The absence of a mechanism for staff to raise AI concerns is a gap in the reporting of concerns control, which requires an established internal process for this purpose. A policy statement sets intent but does not create the process; assigning a named role is part of internal organization controls; documenting investigative capacity is a resource control.

### 149. AIMS-F · D4 · task 4.4 · `591b9767`

> Select controls across impact assessment and the AI system life cycle

**A responsible development review flags that an AI system's training dataset lacks documented provenance. Under ISO/IEC 42001, which action is required to address this finding?**

- a) Defer resolution until the next design phase, because responsible development controls are guidance only and not required for conformance.
- b) Escalate to the data protection officer, because undocumented provenance is primarily a privacy compliance issue.
- c) Retrain the model on a fully documented dataset, because responsible development controls require bias elimination as the primary remediation.
- **`KEY` d) Document and retain provenance information under responsible development controls, which encompass data quality and transparency.**

*explanation:* Responsible development controls under ISO/IEC 42001 encompass data quality, transparency, and human oversight — not only bias prevention. Documenting and retaining data provenance satisfies the data quality and transparency elements of these controls. Treating these controls as optional guidance is incorrect; they are normatively referenced and must be applied where applicable. Escalating solely to a data protection officer addresses privacy law but not the broader AI management obligation.

### 150. AIMS-F · D4 · task 4.6 · `430a65d2`

> Select controls for use of AI systems and for third-party and customer relationships

**An organization provides an AI fraud-detection model to a bank, which integrates it into a customer-facing app. Under ISO/IEC 42001, what should the AI provider do regarding third-party controls?**

- a) Transfer all third-party governance to the procurement department, which manages supplier relationships outside the AIMS.
- b) Issue a standard NDA and supplier clause, satisfying third-party obligations the same way ISO/IEC 27001 supplier controls do.
- c) Limit third-party controls to upstream dataset and model providers; the bank is a customer, not a supplier, so it is out of scope.
- **`KEY` d) Conduct AI-specific due diligence on the bank's deployment context and allocate life-cycle responsibilities between both parties.**

*explanation:* ISO/IEC 42001 third-party controls require the organization to allocate AI life-cycle responsibilities with partners and downstream deployers, not merely exchange legal documents. The bank integrating the model downstream is precisely the type of third-party relationship the controls address. Limiting scope to upstream providers only is a common but incorrect reading of the standard.

### 151. AIMS-F · D4 · task 4.6 · `2d291853`

> Select controls for use of AI systems and for third-party and customer relationships

**An organization deploying an AI loan recommendation system wants to satisfy Annex A use-of-AI controls. Which action most directly fulfils the responsible-use requirement?**

- a) Implement all fairness, accountability, transparency, and explainability measures in Annex B as mandatory controls for this context.
- **`KEY` b) Define responsible-use objectives and establish processes ensuring the system is used according to its intended use and documentation.**
- c) Obtain individual borrower consent before each AI-assisted recommendation, treating consent as the primary responsible-use mechanism.
- d) Delegate responsible-use governance to the compliance team and document the delegation in the AIMS scope.

*explanation:* Annex A use-of-AI controls require the organization to define responsible-use objectives, document processes, and ensure actual use aligns with intended use and system documentation. The Annex B considerations (fairness, transparency, etc.) use 'should' and are illustrative, not a mandatory exhaustive checklist. Treating them as mandatory misreads the normative weight of Annex B guidance.

### 152. AIMS-F · D4 · task 4.7 · `1dddb20e`

> Analyze overlap between ISO/IEC 42001 and ISO/IEC 27001 controls

**An organization maps its ISO/IEC 27001 incident-response procedure to an ISO/IEC 42001 control requiring responses to AI-specific incidents such as biased outputs and model drift. The team argues no additional work is needed. What most clearly exposes the false equivalence?**

- a) ISO/IEC 42001 requires a separate AI incident log, so any reuse of 27001 evidence is prohibited regardless of content overlap.
- b) Audit evidence gathered for a 27001 audit can be reused unchanged for a 42001 audit because both assess the same organizational processes.
- c) Once both systems are certified, auditors accept overlapping controls as satisfying both standards equally without reassessing AI-specific context.
- **`KEY` d) The 27001 procedure defines security-breach triggers and containment; it omits detection criteria and escalation paths for AI-specific failures.**

*explanation:* A security incident-response procedure is built around confidentiality, integrity, and availability breaches, with detection criteria and escalation paths suited to those events. ISO/IEC 42001's AI incident control requires the organization to detect and respond to AI-specific failures—biased outputs, model drift, unexpected behaviour—which have different detection signals, root-cause analyses, and remediation paths. The existing procedure does not address those triggers, so the AI obligation remains unmet. The claim that ISO/IEC 42001 prohibits any evidence reuse overstates the position; the standard does not forbid shared evidence where genuine overlap exists.

### 153. AIMS-F · D4 · task 4.7 · `9f9c2248`

> Analyze overlap between ISO/IEC 42001 and ISO/IEC 27001 controls

**An auditor confirms that a single supplier assessment procedure addresses both third-party AI risk (ISO/IEC 42001) and third-party information security risk (ISO/IEC 27001), and includes AI-specific criteria such as model transparency and training data quality. What is the correct audit finding?**

- a) Major non-conformity, because ISO/IEC 42001 requires AI supplier assessments to be documented separately from information security supplier assessments.
- b) Opportunity for improvement, because the ISO/IEC 27001 certificate scope should have been updated before AI-specific criteria were added.
- c) Minor non-conformity, because one procedure cannot simultaneously satisfy the accountability requirements of two separate management systems.
- **`KEY` d) Conformant, because the procedure genuinely addresses the AI-specific objectives of ISO/IEC 42001 and the information security objectives of ISO/IEC 27001.**

*explanation:* A shared procedure that demonstrably covers the AI-specific criteria required by ISO/IEC 42001—such as model transparency and training data quality—as well as the information security criteria required by ISO/IEC 27001 is conformant with both. The claim that one procedure cannot satisfy two systems' accountability requirements is unsupported by either standard. The suggestion that a certificate scope update is a prerequisite for adding AI criteria has no basis in ISO/IEC 27001 or ISO/IEC 42001. The assertion that ISO/IEC 42001 mandates separate AI supplier assessment documentation is a false attribution—the standard contains no such requirement.

### 154. AIMS-F · D5 · task 5.1 · `b7d1c5da`

> Explain monitoring, measurement, analysis and evaluation for an AIMS

**A company's AIMS review pack shows model accuracy and drift statistics but no data on whether AI governance processes achieved their intended outcomes. Which gap does this illustrate?**

- a) An independent third-party assessment is absent, which the standard requires before governance outcomes can be claimed.
- b) The standard's prescribed governance KPIs are missing from the review pack.
- c) No nonconformity has occurred yet, so evidence of governance outcomes is not yet required.
- **`KEY` d) AI system performance is measured, but AIMS effectiveness—a distinct requirement—is not.**

*explanation:* ISO/IEC 42001 distinguishes results produced by AI systems from results related to the management system itself. Measuring only model metrics leaves the AIMS effectiveness requirement unaddressed. Third-party measurement is not mandated by the standard, evidence of governance outcomes is a routine rather than incident-triggered obligation, and the standard prescribes no specific KPIs.

### 155. AIMS-F · D5 · task 5.1 · `5d504d63`

> Explain monitoring, measurement, analysis and evaluation for an AIMS

**An AIMS monitoring plan schedules governance process reviews quarterly. A colleague argues this violates the standard because monitoring must be continuous. Which assessment is correct?**

- a) The colleague is correct; documented evidence requirements can only be met through continuous data collection.
- b) The colleague is wrong only if an external auditor has pre-approved the quarterly schedule.
- c) The colleague is correct for high-risk AI systems, but wrong for limited-risk deployments.
- **`KEY` d) The colleague is wrong; the standard lets the organization determine when monitoring is performed.**

*explanation:* ISO/IEC 42001 requires the organization to determine when monitoring and measuring are performed; it imposes no requirement for continuous or real-time collection. Periodic scheduled reviews satisfy the standard. The standard creates no risk-tier exemptions and does not require auditor pre-approval of monitoring schedules.

### 156. AIMS-F · D5 · task 5.2 · `24177d84`

> Explain the internal audit requirement

**Which statement correctly distinguishes audit scope from audit criteria in an AIMS internal audit?**

- a) Scope is set by the auditor; criteria are set by the certification body for each audit cycle.
- b) Scope lists the auditors assigned; criteria describe the processes and locations to be examined.
- c) Scope and criteria are interchangeable; both describe what the audit will examine.
- **`KEY` d) Scope defines the boundaries of the audit; criteria are the requirements used to assess conformity.**

*explanation:* Audit scope defines what is included in the audit—processes, locations, time period—while audit criteria are the policies, procedures, or requirements used as the reference for evaluation. They are distinct concepts; conflating them is a common misconception. Both are defined by the organization, not the auditor or certification body.

### 157. AIMS-F · D5 · task 5.3 · `79209585`

> Explain management review inputs and results

**Which of the following is a required result — not an input — of the AIMS management review under ISO/IEC 42001?**

- a) Monitoring and measurement results from AI system controls implemented during the review period.
- **`KEY` b) Decisions on continual improvement opportunities and any need for changes to the AIMS.**
- c) Changes in external and internal issues relevant to the AIMS since the last review.
- d) Trends in nonconformities and corrective actions observed since the last review period.

*explanation:* ISO/IEC 42001 specifies that management review results must include decisions related to continual improvement opportunities and any need for changes to the AIMS. Nonconformity trends, monitoring results, and changes in context are inputs to the review, not outputs.

### 158. AIMS-F · D5 · task 5.5 · `fcb8a516`

> Describe the certification route and what ISO/IEC 42006 governs

**Which description most accurately characterizes what ISO/IEC 42006 governs, distinguishing it from ISO/IEC 42001?**

- a) ISO/IEC 42006 governs accreditation bodies that accredit certification bodies, making it the top-level standard in the certification scheme.
- b) ISO/IEC 42006 and ISO/IEC 42001 address the same subject, with ISO/IEC 42006 being the more recent revision replacing the earlier standard.
- **`KEY` c) ISO/IEC 42006 governs certification bodies auditing AI management systems; ISO/IEC 42001 governs the AIMS requirements organizations must meet.**
- d) ISO/IEC 42006 is a sector-specific extension of ISO/IEC 42001, adding AIMS requirements for high-risk AI application domains.

*explanation:* ISO/IEC 42006 sets requirements for bodies that audit and certify organizations' AI management systems, covering competence, impartiality, and audit conduct. ISO/IEC 42001 defines the AIMS requirements that organizations must implement. The two standards address different subjects and different audiences; one does not govern accreditation bodies, replace, or extend the other.

### 159. AIMS-F · D5 · task 5.5 · `c318ef8f`

> Describe the certification route and what ISO/IEC 42006 governs

**During a two-stage initial certification audit under ISO/IEC 17021-1, what is the primary purpose of Stage 1?**

- a) To allow mature organizations to proceed directly to Stage 2, bypassing Stage 1 when documentation is already complete.
- b) To issue a provisional certificate confirming the organization's intent to conform with ISO/IEC 42001 before full evidence is reviewed.
- c) To conduct a full technical assessment of AIMS implementation, equivalent in depth to Stage 2 but limited to documentation review.
- **`KEY` d) To review documented AIMS and assess readiness for Stage 2, identifying significant gaps before the on-site audit.**

*explanation:* Stage 1, per ISO/IEC 17021-1, is a readiness review: the certification body examines documented information and determines whether the organization is sufficiently prepared for the Stage 2 on-site audit. It is not a full technical assessment equivalent to Stage 2, and neither stage can be bypassed regardless of documentation maturity. No provisional certificate is issued at Stage 1.

### 160. AIMS-F · D5 · task 5.5 · `fa5276a3`

> Describe the certification route and what ISO/IEC 42006 governs

**ISO/IEC 42001 states that a conforming organization can generate evidence of responsibility regarding its AI systems. What does this imply about ISO/IEC 42001 and certification?**

- **`KEY` a) ISO/IEC 42001 defines AIMS requirements; independent certification bodies under accreditation conduct the conformity assessment.**
- b) ISO/IEC 42001 is guidance only; ISO/IEC 42006 contains the certifiable AIMS requirements organizations must meet.
- c) ISO/IEC 42001 requires organizations to self-certify and then submit evidence to an accreditation body for final approval.
- d) ISO/IEC 42001 directly certifies conforming organizations, making third-party certification bodies unnecessary.

*explanation:* ISO/IEC 42001 sets 'shall' requirements that organizations implement; conformance can be evidenced through third-party certification by an independent certification body. ISO/IEC 42001 does not itself certify organizations, and it is not merely guidance. ISO/IEC 42006 governs certification bodies, not the AIMS requirements. Self-certification submitted to an accreditation body is not a defined pathway.

---

# AIMS-IA — ISO/IEC 42001:2023 Internal Auditor

**Source this certification cites:** ISO/IEC 42001:2023 and ISO 19011:2026.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 161. AIMS-IA · D1 · task 1.2 · `e42d2814`

> Determine how an auditor resolves a situation where two ISO 19011 audit principles point in different directions

**An internal auditor is planning a follow-up audit on a high-risk AI system access control process. She has deep operational knowledge of that process from her previous role managing it eighteen months ago. Applying independence (4.6) suggests she should step aside, but applying due professional care (4.4) suggests her technical competence makes her the most qualified person available. Which analysis of this tension is most defensible?**

- a) Due professional care (4.4) governs because superior technical knowledge demonstrably produces more reliable findings — and clause 4.1 identifies reliable findings as the ultimate purpose the principles serve.
- **`KEY` b) Both principles genuinely engage this situation. The auditor weighs 4.6 and 4.4 through professional judgement, documenting mitigation steps rather than treating either principle as automatically decisive.**
- c) Independence (4.6) is a precondition for professional care (4.4): an auditor lacking independence cannot reliably exercise diligence, so the conflict is apparent and the auditor must withdraw regardless of technical competence.
- d) Clause numbering resolves the tension: integrity (4.2) is foundational, and independence (4.6) outranks professional care (4.4) by sequence, so the auditor must withdraw without analysing her specific circumstances.

*explanation:* Clause 4.6 explicitly acknowledges that internal auditors may not always achieve full independence and calls for every effort to remove bias when that is the case — it does not mandate withdrawal. Clause 4.4 frames diligence and reasoned judgement as the appropriate response to exactly these competing considerations. Because ISO 19011:2026 presents all seven principles as fundamental without ranking them, the auditor's professional judgement — exercised and documented — is the defensible resolution, not a rule that collapses one principle into the other. The option treating independence as a precondition for professional care imports a hierarchy the text does not state: 4.6 contains an explicit internal-auditor carve-out, which that reading ignores. The option favouring due professional care on reliability grounds is defensible but incomplete: it does not address the mitigation steps 4.6 calls for when full independence is unavailable. The option resolving by clause-number sequence relies on an ordering the document never asserts.

### 162. AIMS-IA · D1 · task 1.3 · `2908b2d1`

> Apply the distinction between ISO 19011 as methodology and ISO/IEC 42001 as criteria to a proposed audit finding

**A colleague says: 'Our audit programme fully complies with ISO 19011:2026—we could get certified to it.' What is the correct response?**

- a) A certification body can assess the audit programme against ISO 19011:2026 and issue a certificate covering methodology only.
- b) Certification to ISO 19011:2026 is possible but is handled by ISO/IEC 42006:2025, not a general certification body.
- c) ISO 19011:2026 contains one 'shall,' so certification against that single requirement is theoretically possible, though uncommon.
- **`KEY` d) ISO 19011:2026 states no requirements for organizations; certification is impossible because there is nothing to conform to.**

*explanation:* ISO 19011:2026 clause 1 explicitly states the document provides guidance; it imposes no requirements on organizations. Because there is nothing to conform to, there is no basis for certification. The suggestion that a single 'shall' enables partial certification misunderstands the document: the only 'shall' in ISO 19011:2026 is patent-rights boilerplate directed at readers, not an auditable obligation placed on an auditee. The idea that ISO/IEC 42006:2025 handles such certification confuses that standard's scope—it supplements requirements for bodies that certify AI management systems—with the entirely separate question of certifying an audit methodology document. The suggestion that a methodology-only certificate is possible still requires a conformance basis, which ISO 19011:2026 does not supply.

### 163. AIMS-IA · D1 · task 1.4 · `2c772fe4`

> Analyze how an internal auditor preserves objectivity where independence from the audited activity is not practicable

**A small organization's AIMS internal audit is underway. The only person with sufficient AI expertise to evaluate the model-monitoring process is the engineer who designed and operates it. The audit programme manager documents this constraint in the audit plan and assigns a second auditor to independently review all evidence and findings from that area before they are reported. Which conclusion best characterises this arrangement?**

- a) The arrangement satisfies ISO 19011:2026 clause 4.6 only if the engineer provides a written declaration of impartiality, because clause 4.6 makes the auditor's own assertion the primary safeguard when structural independence is unavailable.
- **`KEY` b) The arrangement satisfies clause 9.2.2 b) of ISO/IEC 42001, because disclosed constraint plus independent evidence review is a structural measure aimed at ensuring objectivity and impartiality, which is all that clause requires.**
- c) The arrangement is insufficient, because ISO 19011:2026 clause 4.6 treats independence as a prerequisite for objectivity: where full independence is absent, procedural safeguards cannot compensate, and the audit finding from that area cannot be reported.
- d) The arrangement partially satisfies ISO/IEC 42001 clause 9.2.2 b), but remains non-compliant because that clause contains prescriptive separation-of-duties rules prohibiting evidence-gathering by anyone who contributed to the activity, regardless of compensating controls.

*explanation:* ISO 19011:2026 clause 4.6 explicitly addresses the situation where internal auditors cannot be independent of the activity audited: it calls for every effort to remove bias and encourage objectivity rather than disqualifying the auditor or excluding the area. Independence and objectivity are treated as distinct concepts, which is why the clause can require objectivity even where independence is absent - making the option that treats them as synonymous and bars reporting a specific misconception the clause refutes. ISO/IEC 42001 clause 9.2.2 b) requires only that auditors be selected and audits conducted to ensure objectivity and impartiality; it contains no separation-of-duties rule and no prohibition on an auditor gathering evidence in an area they contributed to. Documenting the constraint and having a second auditor independently review the evidence and findings is precisely the kind of structural, visible measure that satisfies both provisions. The option requiring only a written declaration from the engineer misreads clause 4.6: the clause calls for effort to remove bias through measures, not merely the auditor's own assertion of impartiality.

### 164. AIMS-IA · D1 · task 1.5 · `b80199aa`

> Classify activities in a described audit programme as within or outside the internal auditor's remit

**An internal auditor completes a clause 9.2 audit of the organization's AIMS and finds no nonconformities. Which action is within the internal auditor's remit?**

- a) Include a formal certification recommendation, since full conformance supports it.
- b) Declare the organization fit for certification as the natural conclusion of conformity evaluation.
- **`KEY` c) Report findings and conclusions to management for the organization to act on.**
- d) Notify the certification body that internal audit evidence confirms readiness for certification.

*explanation:* ISO/IEC 42001 clause 9.2 requires the internal audit to provide information on conformance and effective implementation to the organization; the output is findings and conclusions reported to management. Reporting findings and conclusions to management is therefore squarely within the internal auditor's remit. Issuing a certification recommendation, notifying the certification body, or declaring the organization fit for certification are all certification-body activities governed by ISO/IEC 17021-1 and ISO/IEC 42006, entirely outside the internal auditor's scope.

### 165. AIMS-IA · D1 · task 1.5 · `e560d1c7`

> Classify activities in a described audit programme as within or outside the internal auditor's remit

**An internal auditor completes a clause 9.2 AIMS audit and finds no nonconformities. Which action is within the auditor's remit?**

- a) Include a formal certification recommendation as a required clause 9.2 output.
- b) State in the report that the certification body is obliged to grant a certificate.
- c) Notify the certification body that internal audit results confirm fitness for certification.
- **`KEY` d) Report findings and conclusions to management for the organization to act on.**

*explanation:* ISO/IEC 42001 clause 9.2 requires internal audits to give the organization information on conformance and effective implementation; outputs go to management for action. Granting or recommending a certificate is a certification-body activity governed by ISO/IEC 17021-1, entirely outside a first-party auditor's remit. Notifying the certification body of internal results and declaring an obligation on that body are equally outside scope.

### 166. AIMS-IA · D2 · task 2.2 · `fc5a2e73`

> Analyze how audit programme risks and opportunities shape its scope and resourcing

**An internal auditor managing an AIMS audit programme has 15 auditor-days available. A newly deployed high-risk AI recruitment system has never been audited; a lower-risk AI document-classification system was audited satisfactorily last year. The auditor proposes allocating 12 days to the recruitment system and 3 days to the document-classification system. Which analysis best describes the programme-level consequence of this allocation?**

- **`KEY` a) The split is directionally sound under clause 4.8, but 3 days may yield too thin a sample to support any conclusion on the document-classification system, so the programme should record both the rationale and the resulting coverage limitation.**
- b) The split is impermissible because clause 4.8 directs effort toward significant matters but does not authorise reducing any in-scope area's coverage below the depth needed for a uniform, criterion-by-criterion review of every system.
- c) The split satisfies both clause 4.8 and clause 4.7 together, because concentrating effort on the higher-risk system inherently generates sufficient evidence across the whole programme, and no separate documentation of the trade-off is needed.
- d) The split is acceptable only after the audit client approves it, because clause 5.3 requires the programme manager to present all auditor-day allocations to the audit client for sign-off before any audit activity begins.

*explanation:* Clause 4.8 recommends that the risk-based approach substantively influence where audit effort concentrates, making the 12/3 split directionally sound. The best answer is better than the option claiming the split satisfies both principles automatically, because that option conflates auditor presence with evidential sufficiency: clause 4.7 requires conclusions to rest on verifiable, sampled evidence, and 3 days may not yield enough to support any conclusion about the document-classification system — a limitation the programme must state explicitly rather than leave implicit. The option requiring the audit client to approve each day-by-day allocation overstates clause 5.3, which asks the programme manager to identify and present resource risks when developing the programme, not to obtain pre-approval for individual allocation decisions. The option treating clause 4.8 as forbidding any reduction in coverage misreads it: clause 4.8 directs focus toward significant matters and does not mandate uniform depth across all in-scope areas.

### 167. AIMS-IA · D2 · task 2.2 · `e5ac972c`

> Analyze how audit programme risks and opportunities shape its scope and resourcing

**An AIMS audit programme covers five AI systems. Midway through the annual cycle, the manager learns that a previously low-risk AI recruitment tool now processes sensitive personal data at significantly greater volume. The manager has consumed 80% of the annual audit budget. Which analysis of how ISO 19011:2026 clauses 4.8 and 5.3 apply is most accurate?**

- a) Clause 4.8 means auditee risk changes automatically trigger programme objective revisions, making a formal mid-cycle objective rewrite the primary required action before any resource reallocation occurs.
- **`KEY` b) The risk shift is a programme risk under clause 5.3, requiring the manager to inform the audit client; clause 4.8 supports redirecting remaining effort toward the recruitment tool rather than holding the original allocation.**
- c) The risk-based approach under clause 4.8 justifies silently reallocating the remaining 20% to the recruitment tool, omitting other scheduled systems with no documentation or notification to the audit client.
- d) Because 80% of the budget is spent and the programme was approved, remaining audits should proceed as planned; clause 5.3 risk identification applies only during initial programme development, not mid-cycle.

*explanation:* Clause 5.3 identifies risks arising during programme implementation — not only at initial establishment — as matters the programme manager should surface to the audit client, including changed circumstances that affect resource adequacy. Clause 4.8 supports adjusting where remaining effort concentrates in response to a materially changed risk picture, but does not authorise omitting other areas without documentation or revision of the programme's stated objectives. The option requiring a formal objective rewrite before any reallocation conflates adjusting the distribution of effort within the programme (what clause 4.8 addresses) with changing the programme's goals — a more significant step that the scenario does not demand. The option restricting clause 5.3 to initial programme development misreads the clause, which covers risks throughout the programme lifecycle. The option treating reallocation as requiring no documentation or client communication ignores both the recording expectation in clause 5.3 and the evidence-based approach's demand for transparency about what was and was not covered.

### 168. AIMS-IA · D2 · task 2.2 · `b9aa0f2a`

> Analyze how audit programme risks and opportunities shape its scope and resourcing

**While developing next year's AIMS internal audit programme, the programme manager identifies that the only auditor with AI model validation competence is also the process owner for two of the five processes to be audited. Clause 5.3 of ISO 19011:2026 lists 'selection of the audit team' among the risk sources for an audit programme. How should the programme manager treat this situation?**

- a) The auditor's dual role is an organisational design issue rather than a programme-level risk; it belongs in the AIMS risk register rather than in the audit programme risk analysis, because it reflects the auditee's own operational structure.
- b) Team selection is an administrative matter internal to the programme; the manager should assign the auditor only to the three processes where they have no ownership role, without escalating to the audit client, since resourcing decisions sit within the programme manager's remit.
- c) Because ISO 19011:2026 is guidance rather than requirements, the manager may set aside the team-selection risk when time is short and assign the auditor to all five processes, treating the guidance as discretionary where operational constraints apply.
- **`KEY` d) The competence gap and objectivity constraint together constitute a risk to the programme's objectives; clause 5.3 calls for the manager to identify such risks and present them and the resource requirements to the audit client when developing the programme.**

*explanation:* Clause 5.3 records that the programme manager should identify risks to the programme - including those arising from team selection - and present them and the programme's resource requirements to the audit client when developing the programme. Resolving the situation by restricting the auditor to three processes is a defensible partial measure, but it addresses only the objectivity concern and misses the clause 5.3 obligation to surface the competence gap and its consequences to the audit client. Treating the dual role as belonging solely in the AIMS risk register conflates programme-level risks with the auditee's operational risks; they are distinct categories. Treating ISO 19011:2026 as wholly discretionary misreads the guidance: the standard's 'should' language reflects its guidance character, but a manager who ignores a known programme risk without presenting it to the client cannot claim to be following the spirit of clause 5.3.

### 169. AIMS-IA · D2 · task 2.5 · `1b3204d6`

> Determine the objectives, scope and criteria for an individual AIMS audit

**An internal auditor is drafting the scope statement for an AIMS audit covering the organization's customer-churn prediction AI system. The statement reads: 'Scope: Data Science function, Q1 activities.' A colleague argues this is sufficient because the responsible function is named. Which analysis of that scope statement is most defensible?**

- a) The statement is sufficient; ISO 19011:2026 clause 3.6 treats virtual locations and specific AI systems as optional elaboration the auditor may add during fieldwork, not at planning.
- b) The statement is insufficient only because 'Q1' is vague; precise calendar dates complete the scope, since naming the responsible function implicitly covers all AI systems that function operates.
- c) The statement is sufficient; ISO/IEC 42001:2023 clause 9.2.2 requires a defined audit scope but specifies no mandatory content elements, so any written boundary satisfies the requirement.
- **`KEY` d) The statement is insufficient; clause 3.6 requires scope to include virtual locations, specific processes, and time period, so omitting the AI system and its environment leaves findings without a defined boundary.**

*explanation:* ISO 19011:2026 clause 3.6 states that audit scope generally includes physical and virtual locations, functions, organizational units, activities and processes, and the time period covered. For an AIMS audit, the specific AI system and its operating environment are boundary elements without which a finding cannot later be tested against the scope. The answer naming only the vague time period as the gap is defensible but too narrow: fixing the date alone still leaves the AI system and virtual location undefined, so the scope remains insufficient on multiple grounds. The answer treating naming the responsible function as implicitly covering all AI systems it operates reflects a common misconception—a function may operate several AI systems with different risk profiles, and an unstated system cannot anchor a finding. The answer citing clause 9.2.2 of ISO/IEC 42001 as setting no content expectations for scope is a genuine practitioner error: clause 3.6 of ISO 19011:2026 does supply content guidance, and that guidance applies to planning, not only to fieldwork.

### 170. AIMS-IA · D2 · task 2.5 · `97f95447`

> Determine the objectives, scope and criteria for an individual AIMS audit

**During audit planning, the programme owner proposes that the criteria for an internal AIMS audit consist solely of ISO/IEC 42001:2023 clauses 4 through 10 and Annex A. The organization has an approved AI ethics policy, an AI system register, and documented AI risk treatment procedures. A senior auditor challenges the proposed criteria. Which analysis best supports the senior auditor's challenge?**

- a) The criteria are adequate. Evaluating internal policies and procedures belongs exclusively to management review under clause 9.3, where effectiveness against intended results is formally assessed, not in internal audits.
- **`KEY` b) The criteria are incomplete. Clause 9.2.1 requires audits to assess conformity to both the standard's requirements and the organization's own AIMS requirements, leaving the ethics policy, system register, and risk procedures unaudited.**
- c) The criteria are incomplete. ISO 19011 requires fresh top-management approval of audit criteria for each individual audit, so using programme-level criteria without a new sign-off violates that requirement.
- d) The criteria are adequate. Annex A controls listed in the statement of applicability already reference risk treatment procedures, so those procedures are implicitly covered without being named as separate audit criteria.

*explanation:* ISO/IEC 42001:2023 clause 9.2.1 frames internal audit against two distinct limbs: conformity to the standard's own requirements, and conformity to the organization's own requirements for the AIMS. Limiting criteria to clauses 4–10 and Annex A addresses only the first limb; the AI ethics policy, system register, and risk treatment procedures are the organization's own requirements and constitute the second limb. The answer citing a top-management sign-off requirement for each individual audit is a false attribution: ISO 19011 contains no such rule, making it a plausible-sounding but incorrect basis for the challenge. The management-review answer misattributes effectiveness assessment exclusively to clause 9.3—clause 9.2.1 explicitly includes effective implementation and maintenance as an audit question. The Annex A implication argument is also wrong: a control's presence in the statement of applicability does not incorporate the organization's implementing procedures as audit criteria.

### 171. AIMS-IA · D2 · task 2.6 · `d3a7d8d1`

> Determine which auditing methods fit the evidence an AI management system produces, including remote methods and virtual locations

**An internal auditor is planning a review of an organization's AI model registry and automated training pipeline, both hosted in a cloud environment with no physical infrastructure on-site. The audit programme manager is deciding how to conduct the audit. Which basis for selecting the auditing method best reflects ISO 19011:2026 clause 5.5.3?**

- a) Assign method selection to the lead auditor during audit planning, because determining how to gather evidence is an audit-team responsibility rather than one belonging to the audit programme manager.
- b) Select the method that minimises travel cost and scheduling effort, since clause 5.5.3 directs the programme manager to conduct audits efficiently, and efficiency is primarily a function of resource use.
- **`KEY` c) Choose a combination of on-site and remote methods, balanced by considering the risks and opportunities associated with each, given that the evidence resides in a virtual location accessible from any point.**
- d) Default to on-site auditing, because cloud-based AI evidence such as model registries and pipelines requires physical presence at the auditee's premises to be inspected with appropriate rigour.

*explanation:* Clause 5.5.3 asks the person managing the audit programme to select methods based on objectives, scope and criteria, with the balance of on-site, remote or combined approaches determined by consideration of associated risks and opportunities — a recorded judgement, not a default. Because the model registry and pipeline reside in a virtual location, a risk-based combination is the defensible starting point and is better than delegating that decision to the lead auditor, because clause 5.5.3 places method selection with the programme manager, not the audit team. Delegating to the lead auditor is a genuinely defensible position — the lead auditor does make detailed method decisions during planning — but clause 5.5.3 locates the initial selection responsibility with the programme manager, making that option second-best rather than best. The option asserting that physical presence is necessary for cloud evidence rests on the misconception that on-site is inherently more rigorous; the option citing cost and convenience misreads 'efficiently' as overriding the evidence-type and risk analysis.

### 172. AIMS-IA · D2 · task 2.7 · `4a1b06eb`

> Explain how audit programme results are monitored, reviewed and improved

**ISO/IEC 42001:2023 clause 9.2.2 requires documented information as evidence of audit programme implementation and audit results. Only completed audit reports are on file. Which description is most accurate?**

- a) No nonconformity exists, because clause 9.2.2 requires only audit results, and the completed reports fully satisfy that obligation.
- **`KEY` b) A nonconformity against clause 9.2.2 is supportable, because programme-implementation evidence is required in addition to audit results and is absent.**
- c) A nonconformity against clause 9.2.1 is supportable, because programme records fall under the internal audit planning requirement, not clause 9.2.2.
- d) A nonconformity against ISO 19011:2026 is supportable, because its audit-record guidance is normatively binding on the organisation.

*explanation:* ISO/IEC 42001:2023 clause 9.2.2 requires documented information as evidence of two distinct things: the implementation of the audit programme and the audit results. Retaining only audit reports leaves programme-implementation evidence absent, making a nonconformity against clause 9.2.2 defensible. The option asserting that audit results alone satisfy clause 9.2.2 misreads the clause, which explicitly names both categories. The option raising a nonconformity against ISO 19011:2026 reflects a common misconception: ISO 19011:2026 is a guidance document containing no normative requirements, so no nonconformity can be raised against it. The option redirecting the finding to clause 9.2.1 is also incorrect; clause 9.2.2 is the sub-clause that specifies the documented-information obligation for audit programme implementation and results.

### 173. AIMS-IA · D2 · task 2.7 · `61cf9218`

> Explain how audit programme results are monitored, reviewed and improved

**All scheduled AIMS audits were completed on time and individual reports were filed. Does this confirm the audit programme has been adequately monitored under ISO 19011:2026?**

- a) Yes; schedule adherence confirms the programme is achieving its objectives.
- **`KEY` b) No; monitoring also asks whether the programme is achieving its objectives, not only whether audits ran on time.**
- c) No; monitoring requires confirming each auditor held verified competence credentials before each audit.
- d) Yes; filing individual audit reports constitutes adequate programme-level monitoring.

*explanation:* ISO 19011:2026 clause 5.6 distinguishes implementation (were audits conducted as planned?) from effectiveness (is the programme achieving its objectives?). Completing audits on schedule addresses only implementation. Filing individual audit reports evaluates individual audit quality, not programme performance. Auditor credential verification is an individual-audit planning step, not a programme monitoring measure. Only the option identifying objective achievement as a separate monitoring question correctly reflects clause 5.6.

### 174. AIMS-IA · D3 · task 3.1 · `6bb38458`

> Place a described audit activity at its correct point in the sequence from initiation to completion

**The audit report has been distributed. The audit team leader is deciding whether the audit is complete under ISO 19011:2026. What does clause 6.6 state at this point?**

- a) Distributing the report and completing the audit are the same event, so no further steps are needed once distribution is confirmed.
- b) Lessons learned must be captured within clause 6.6 before completion, because each audit is self-contained and independent of the programme.
- c) The audit is complete only after all corrective actions in the report are verified as closed, since follow-up is part of clause 6.6.
- **`KEY` d) The audit is complete once planned activities are carried out and the report distributed; follow-up under clause 6.7 is a separate subsequent activity.**

*explanation:* ISO 19011:2026 clause 6.6 states that the audit is complete when planned activities have been carried out and the approved report has been distributed. Clause 6.7, audit follow-up, is a distinct subsequent step that may extend beyond that point. Treating corrective-action verification as a prerequisite for completion conflates clause 6.6 with clause 6.7. Treating distribution and completion as the same event ignores that completion requires planned activities to have been carried out, not merely the report sent. Lessons learned feed back to the audit programme under clause 5.7 and are not a closing condition of clause 6.6.

### 175. AIMS-IA · D3 · task 3.2 · `f78251d1`

> Analyze whether the review of documented information supports proceeding to further audit activities

**An internal auditor is reviewing documented information before fieldwork on the organization's AI recruitment-screening system. The AIMS scope statement names three AI models, but the supplied documentation covers only one. The AI policy exists but contains no reference to the other two models, and no impact assessment results are provided for them. What should the audit team leader do?**

- a) Narrow the audit scope to the one documented model and complete fieldwork as planned, because restricting scope to available evidence is a proportionate response that avoids delaying the audit programme.
- b) Proceed to fieldwork and expand on-site evidence collection to compensate, because the missing documentation for the two models can be located during interviews and record inspection once the audit team is on-site.
- c) Raise a nonconformity against clause 6.1.4 for the missing impact assessment results, then continue fieldwork, because documenting the gap satisfies the auditor's obligation and fieldwork can run in parallel with corrective action.
- **`KEY` d) Inform those responsible for the gap and decide whether to continue or suspend, because ISO 19011:2026 clause 6.3.1 treats an inadequate documentation review as a condition that may justify halting audit activities before fieldwork begins.**

*explanation:* ISO 19011:2026 clause 6.3.1 advises that where the documentation review reveals inadequate documented information, the audit team leader should inform those responsible and decide whether to continue or suspend until the matter is resolved. This makes early escalation followed by a deliberate continuation decision the best course. Proceeding to compensate on-site misreads clause 6.3.1: the guidance calls for surfacing the gap before fieldwork, not absorbing it once on-site. Narrowing scope unilaterally bypasses the audit client, who holds authority over scope boundaries. Raising a nonconformity at this stage conflates a pre-fieldwork adequacy judgement with a formal audit finding — a finding requires evidence gathered against criteria during fieldwork, and the documentation review has not yet reached that stage.

### 176. AIMS-IA · D3 · task 3.4 · `a60747a4`

> Analyze whether information collected constitutes verified audit evidence

**An auditor testing control A.7.4 (data quality) receives a well-structured, internally consistent procedure document bearing a current approval signature. No data quality records, test results, or operational outputs are reviewed. What does Annex A.5 of ISO 19011:2026 indicate about whether this document alone is sufficient evidence that the control operates effectively?**

- **`KEY` a) Annex A.5 requires evidence to be complete, correct, consistent, and current. The document satisfies consistency and currency but not correctness against operational outputs, so further evidence is needed.**
- b) Annex A.5 requires cross-referencing only when inconsistency is already suspected, so a consistent, currently approved document suffices to confirm effective operation.
- c) Annex A.5 applies integrity checks only to information from unexpected channels, so a procedure received through normal audit channels may be relied upon without additional operational testing.
- d) Annex A.5 treats completeness as confirmed by a document bearing an authorised signature, so current approval satisfies the sufficiency test without reviewing operational records.

*explanation:* Annex A.5 of ISO 19011:2026 asks the auditor to consider whether information is complete, correct, consistent, and current. A procedure document that is internally consistent and currently approved satisfies only two of those four dimensions. It says nothing about whether the process actually operates as described, leaving correctness against operational outputs and completeness of practice unestablished. The option limiting cross-referencing to situations where inconsistency is already suspected inverts the Annex A.5 guidance, which calls for proactive sufficiency assessment rather than reactive checking. The option equating completeness with document existence misreads the term: completeness in Annex A.5 refers to whether all expected content and evidence is present, not merely whether a document has been produced. The option restricting Annex A.5 to unexpected-channel information conflates the integrity-assessment note — which addresses how channel affects reliability — with the full sufficiency test, which applies to all information regardless of how it was received.

### 177. AIMS-IA · D3 · task 3.5 · `a8e9f989`

> Determine what to ask and how to record it when interviewing personnel involved in AI system work

**An internal auditor is planning interviews for an AIMS audit covering how training data is validated before model deployment. The data engineering team lead can describe the validation procedure and has prepared a process flowchart. Individual data engineers perform the actual validation checks daily. Whom should the auditor interview to obtain evidence that the procedure is followed in practice?**

- a) Senior AI governance staff above the team lead, because their cross-functional visibility over validation activities exceeds what either the lead or engineers can provide.
- **`KEY` b) Both the team lead and the data engineers, because ISO 19011 requires interviewing appropriate levels — the lead describes design; engineers evidence actual practice.**
- c) The team lead alone, because the flowchart documents the intended process and separate operator interviews are duplicative within an internal audit's scope.
- d) The data engineers only, because management interviews yield only intended-process descriptions, risking conflation of design intent with actual practice in the audit record.

*explanation:* ISO 19011:2026 Annex A.17 advises that interviews be held with individuals from appropriate levels and functions performing the activities within the audit scope. Interviewing only the team lead yields a description of the intended process, not evidence that it is followed — the engineers who execute the checks daily supply that evidence. Interviewing only the engineers, while valuable, discards the process-design context the team lead provides; both levels are appropriate here and together they allow the auditor to compare design with execution. Elevating to governance staff above the team lead moves further from the activity and produces even less operational evidence, making that choice weaker than interviewing both levels directly involved.

### 178. AIMS-IA · D3 · task 3.6 · `b5cb06e4`

> Analyze the sufficiency of evidence obtained through remote auditing methods

**During a remote internal audit of an AI incident-logging process, the auditor receives a read-only platform account, but several incident categories are hidden by role permissions the auditor cannot override. The audit report states: 'Incident log reviewed; no nonconformities identified.' Which conclusion about this report is best supported by ISO 19011:2026?**

- a) The report is inadequate because remote access to a live platform cannot substitute for on-site review of incident records; the auditor should have suspended the audit pending an on-site visit rather than proceeding with restricted access.
- **`KEY` b) The report is inadequate because the hidden categories were not audited; Annex A.16 and clause 6.4.5 advise that where access is partial, the limitation be recorded so the report accurately reflects what was and was not covered.**
- c) The report is adequate because the overall audit scope statement implied coverage of incident management, so the restricted categories are implicitly noted and need no separate disclosure in the findings section.
- d) The report is adequate because once the auditee granted remote platform access, the auditor has effectively been present in the system; partial role restrictions are a normal feature of production environments, not an audit limitation.

*explanation:* Clause 6.4.5 of ISO 19011:2026 addresses providing access to audit information, and Annex A.16 advises that agreed remote access protocols ensure appropriate resources are available. Where access is partial, the gap belongs in the audit record. Concluding 'no nonconformities identified' across a scope that was only partially examined overstates what the evidence supports — this is the clearest defect. The option relying on the scope statement conflates declared scope with actual coverage: a scope statement describes intent, not what was reached. The option treating partial access as a normal production feature ignores that the auditor's inability to view certain categories is precisely the kind of limitation Annex A.16 requires to be managed and recorded. The option requiring suspension misapplies Annex A.16, which does not make remote access a lesser substitute mandating on-site fallback whenever restrictions exist.

### 179. AIMS-IA · D3 · task 3.6 · `1a214870`

> Analyze the sufficiency of evidence obtained through remote auditing methods

**During a remote audit of an organization's AIMS, the auditee shares their screen and navigates live through the AI risk documentation, showing entries, timestamps, and ownership fields. The auditor observes the session for ten minutes. Which analysis of this evidence is most defensible?**

- a) The evidence is sufficient provided the auditee granted remote access, because granting access is functionally equivalent to the auditor navigating the system independently at the terminal.
- **`KEY` b) The evidence supports what was shown but requires Annex A.5 integrity assessment — noting who navigated, what was selected, and whether the view was complete — because the auditor saw a filtered presentation.**
- c) The evidence is inherently lower quality than on-site observation and must be flagged as reduced-confidence regardless of content, because remote methods introduce risks that on-site observation eliminates.
- d) The evidence is sufficient as observed, because real-time display equals direct system access and Annex A.5 integrity assessment applies only to static documents, not live demonstrations.

*explanation:* Annex A.5 calls on auditors to assess whether evidence is complete, correct, consistent, and current regardless of how it was obtained; Annex A.16 adds that remote methods can introduce additional risks, including the risk that what is displayed is a filtered or prepared view. Recording who navigated the session and what was chosen to display is precisely how the integrity assessment remains possible — it is a substantive evidential concern, not an administrative one. This is better than the blanket reduced-confidence position, which treats all remote evidence as inferior without assessing what was actually shown — a step Annex A.5 requires regardless of method. Treating real-time display as equivalent to independent direct access ignores that the auditor saw only what the operator chose to show, which is the core limitation Annex A.5 asks the auditor to assess. Limiting the integrity test to static documents has no basis in Annex A.5, which is method-agnostic.

### 180. AIMS-IA · D3 · task 3.6 · `2a47695b`

> Analyze the sufficiency of evidence obtained through remote auditing methods

**An audit programme manager is planning an internal audit of an AIMS clause 8.4 impact assessment process. All AI systems are cloud-hosted; all records, logs, and assessment outputs are in browser-accessible document management software. The manager must decide whether to audit remotely or on-site. Which analysis best reflects ISO 19011:2026 clause 5.5.3 on method selection?**

- a) On-site is better supported because clause 5.5.3 establishes on-site as the rigorous default; the manager should document why remote is acceptable rather than why on-site was selected, reversing the usual justification burden.
- **`KEY` b) Remote is well-supported here because documentary evidence and system outputs are equally accessible from any location; the recorded justification should address the specific risks and opportunities of the remote approach, not treat on-site as the default baseline.**
- c) Remote is acceptable only if travel is genuinely impractical; since the systems are cloud-hosted and not co-located with the audit team, the manager must first confirm physical access is unavailable before selecting remote methods.
- d) A combined on-site and remote approach is required when auditing a cloud-hosted system, because using remote methods exclusively does not satisfy the standard's guidance on balancing audit methods.

*explanation:* ISO 19011:2026 clause 5.5.3 advises that the balance of audit methods be suitably considered with regard to associated risks and opportunities, framing method selection as a recorded judgement rather than a hierarchy with on-site as the norm. Where the evidence to be examined is entirely documentary and system-based, remote access reaches it as completely as physical presence would; the auditor's task is to assess and record the specific risks of the chosen approach. The option treating on-site as the default baseline reverses clause 5.5.3's neutral framing — the clause names no preferred method. The option requiring physical access to be confirmed unavailable before remote methods are used imports a travel-impracticality threshold that does not appear in clause 5.5.3. The option requiring a combined approach imports a minimum on-site component that ISO 19011:2026 does not impose anywhere in the standard.

### 181. AIMS-IA · D3 · task 3.7 · `bcbc3ebe`

> Select sources of information appropriate to an AIMS audit

**An internal auditor is verifying data resource documentation under Annex A.7. The data governance team provides a monthly data quality summary report. What should the auditor do?**

- a) Accept the summary, because ISO 19011:2026 Annex A.14 ranks summary reports above underlying records as an evidence source.
- **`KEY` b) Request the underlying data quality and provenance records, because a summary answers a different audit question from the records it summarises.**
- c) Defer sampling to the next certification audit, because data resource documentation is unlikely to change once the AIMS is established.
- d) Decline to sample data quality records, because Annex A.7 documentation is the data governance team's responsibility and outside AIMS scope.

*explanation:* ISO 19011:2026 Annex A.14 advises choosing sources that match the question being investigated. A summary report and the records it summarises answer different questions, so verifying whether adequate documentation exists requires going to the underlying records. Annex A.14 prescribes no fixed hierarchy of evidence types — the claim that summary reports rank above underlying records is a misconception, not a standard rule. ISO/IEC 42001:2023 Annex A.7 data documentation falls squarely within AIMS scope regardless of which team maintains it, so declining to sample or deferring to a certification audit cannot be justified on those grounds.

### 182. AIMS-IA · D4 · task 4.13 · `251b199e`

> Analyze whether people performing AI-related work meet the competence requirements the AIMS claims

**An internal auditor reviews the AIMS for a team operating a deployed credit-scoring AI system. The statement of applicability includes control A.4.6. The auditor finds a document titled 'AI Operations Team – Role Descriptions' listing eight roles with required qualifications, but personnel files contain only employment contracts and payroll records. Which conclusion best fits the evidence?**

- a) Both clause 7.2 and A.4.6 are unsatisfied, but the primary finding is at A.4.6 because that control sets the documentation threshold for operational roles; clause 7.2 is only triggered once A.4.6 documentation is in place and can be cross-checked against individual records.
- b) There is a gap against A.4.6 only, because that control requires human-resource documentation across the AI life cycle, and personnel files covering deployment and operations are absent; clause 7.2 is a separate obligation not yet testable.
- **`KEY` c) There is a gap against clause 7.2: the organization has determined necessary competence via the role descriptions, but has not retained documented information evidencing that the individuals in those roles actually hold the competence required.**
- d) The role-description document satisfies clause 7.2 in full, because it establishes what competence the work requires and implies that appointed staff hold it by virtue of being hired into those roles.

*explanation:* Clause 7.2 has two distinct limbs: determining necessary competence and retaining documented information as evidence that individuals hold it. The role-description document addresses the first limb, so the determination is present. What is missing is individual-level evidence — certificates, transcripts, records of experience — that each person meets the standard set out in those descriptions. The best answer names this gap precisely against clause 7.2, which is the requirement that explicitly demands individual competence evidence for persons doing the work. The option citing A.4.6 alone is defensible — A.4.6 draws on the same factual gap — but it is narrower and less precise: clause 7.2 is the direct requirement for individual evidence, and A.4.6 does not substitute for it. The option treating clause 7.2 as dependent on A.4.6 documentation misreads both provisions; they are independent obligations. The option asserting the role descriptions satisfy clause 7.2 in full rests on the misconception that a job description implies individual competence without further evidence.

### 183. AIMS-IA · D4 · task 4.2 · `6f5e8496`

> Analyze whether the AIMS scope statement is defensible given the AI systems and roles determined

**A logistics company's AIMS scope, certified eighteen months ago, states it covers 'AI systems used in route optimisation and fleet scheduling.' Since certification the company has deployed an AI-based recruitment screening tool within the same HR division already inside the scope boundary. The tool is not mentioned in the scope statement. The auditor must determine whether a finding is warranted.**

- a) A finding is warranted only if the organisation also failed to document a formal exclusion rationale, since clause 4.3 imposes the same exclusion-justification discipline as clause 6.1.3 f).
- b) No finding is warranted; any AI system inside the existing boundary falls within the named category by implication, so the recruitment tool is already covered.
- c) No finding is warranted; clause 4.3 scope determination is a one-time activity at certification and need not be revisited when new AI systems are introduced.
- **`KEY` d) A clause 4.3 finding is warranted because a deployed AI system absent from the scope statement creates a demonstrable inconsistency with the required 4.1 and 4.2 inputs.**

*explanation:* Clause 4.3 requires the scope to be determined by considering the issues from 4.1 and the interested-party requirements from 4.2, and to be documented. A live AI system with its own risk profile and stakeholder footprint that is absent from the scope creates a verifiable inconsistency between those inputs and the stated applicability—the auditor can evidence this from the organisation's own records. This is a stronger position than the category-implies-coverage argument, because a recruitment screening tool has a materially different impact profile and interested-party set from route optimisation and fleet scheduling systems; a generic category label does not resolve applicability for a system with distinct characteristics. The one-time-activity position misreads clause 4.3, which ties scope to living inputs that change as the organisation changes. The exclusion-rationale position imports clause 6.1.3 f) discipline that clause 4.3 does not impose.

### 184. AIMS-IA · D4 · task 4.3 · `97e06119`

> Determine whether leadership and AI policy requirements are evidenced

**During an AIMS internal audit, the auditor finds that the AI policy exists as documented information, is communicated internally, and references the organisation's data governance policy. The statement of applicability excludes control A.2.4, justified by ad hoc review whenever significant AI changes occur. The auditor is assessing whether a finding is warranted. Which conclusion is best supported?**

- **`KEY` a) A finding is warranted at clause 6.1.3 if the auditor cannot confirm the exclusion of A.2.4 is sound, because the planned-interval review obligation originates in control A.2.4, not in clause 5.2, and an unsupported exclusion is where the gap lies.**
- b) No finding is warranted because A.2.4 is excluded from the statement of applicability and clause 5.2 contains no review obligation; an organisation may legitimately rely on ad hoc review once A.2.4 is excluded with a stated justification.
- c) A finding is warranted at clause 5.2 because the AI policy cross-references the data governance policy rather than standing alone, since clause 5.2 requires the policy to be available independently and does not permit referencing other organisational policies.
- d) A finding is warranted at clause 5.2 for the absence of planned-interval reviews, because clause 5.2 itself mandates periodic review of the AI policy and excluding A.2.4 does not remove that clause-level obligation.

*explanation:* Planned-interval review of the AI policy is a requirement of control A.2.4, not of clause 5.2. Clause 5.2 requires the policy to exist as documented information, be communicated within the organisation, and be available to interested parties as appropriate — it contains no periodic-review obligation. Where A.2.4 is excluded from the statement of applicability, the auditor's proper question is whether clause 6.1.3 is satisfied: did the organisation determine that A.2.4 is not necessary, and is the justification for that exclusion adequate? If the justification is unsound — for example, if ad hoc review cannot be shown to address the control's purpose — the finding belongs at clause 6.1.3, not at clause 5.2. The option finding no deficiency at all is the strongest distractor and is defensible up to a point: A.2.4 is excluded and a justification is stated. What makes the finding-at-clause-6.1.3 answer better is that the scenario says the auditor cannot yet confirm the justification is sound — the audit work is incomplete on that question, so the correct posture is conditional, not a clean 'no finding'. The option asserting a clause 5.2 review obligation is the primary misconception this item targets: clause 5.2 simply does not contain one. The option finding a defect in cross-referencing other policies is wrong in the opposite direction: clause 5.2 explicitly requires the AI policy to refer as relevant to other organisational policies, so cross-referencing the data governance policy is compliant, not a deficiency.

### 185. AIMS-IA · D4 · task 4.4 · `4b9737de`

> Analyze whether the AI risk assessment process conforms to clause 6.1.2

**You are auditing an organization's AI risk assessment process under clause 6.1.2. The organization maintains no document called a 'risk register'. Its assessment records show identified risks, analysis performed, evaluation outcomes against internally established criteria, and treatment decisions—all captured in individual assessment reports. The statement of applicability references those reports. Which conclusion best characterizes the conformance position?**

- a) The absence of a risk register is a nonconformity against clause 6.1.3, because a statement of applicability cannot be properly prepared without a consolidated register as a prerequisite input, making the SoA itself suspect.
- b) No nonconformity arises, but the auditor should recommend a risk register, because the individual report format makes it impractical to verify the comparability requirement in clause 6.1.2 b) without a consolidated view.
- c) The absence of a risk register is a nonconformity against clause 6.1.2, because a consolidated register is the only way to demonstrate the process produces results that are comparable across assessments over time.
- **`KEY` d) No nonconformity arises from the absent risk register alone: clause 6.1.2 requires a documented process and documented results, and individual assessment reports can satisfy that requirement if they contain the required content.**

*explanation:* The phrase 'risk register' appears nowhere in ISO/IEC 42001:2023. Clause 6.1.2 requires a documented AI risk assessment process whose results identify, analyse and evaluate risks; clause 6.1.3 requires a documented risk treatment process and a statement of applicability. Individual assessment reports that capture identified risks, analysis, evaluation against the organization's own criteria, and treatment decisions can satisfy these documentation requirements without a consolidated register. Raising a nonconformity for the absent register would cite a requirement the standard does not contain. The option pointing to clause 6.1.3 compounds the error by asserting the SoA requires a register as a prerequisite input—also not a standard requirement. The option framing a recommendation as a corrective action is more defensible than citing a false requirement, but it still mischaracterizes the situation: if the individual reports contain the required content, comparability under clause 6.1.2 b) is testable from them directly, and no corrective action is warranted on format grounds alone. The option stating that individual reports satisfy the clause, provided they contain the required content, is the most accurate characterization because it applies only what the standard actually requires and avoids importing a format prescription the standard does not impose.

### 186. AIMS-IA · D4 · task 4.4 · `93de840d`

> Analyze whether the AI risk assessment process conforms to clause 6.1.2

**An organization's AIMS documentation includes a detailed, approved AI risk assessment procedure. Audit interviews reveal that assessors routinely apply the procedure without reference to the AI policy or the organization's stated AI objectives, treating the risk assessment as a standalone technical exercise. The procedure itself contains no linkage to either document. Which finding most accurately reflects the conformance position under clause 6.1.2?**

- a) No finding is warranted, because clause 6.1.2 is satisfied once a documented risk assessment procedure exists; alignment with the AI policy and AI objectives is a management expectation rather than a stated requirement of that clause.
- b) A finding is warranted, but against clause 5.2 rather than 6.1.2, because the gap is a policy communication failure—assessors are unaware of the policy content—not a deficiency in the risk assessment process itself.
- **`KEY` c) A finding is warranted against clause 6.1.2, because the process must be informed by and aligned with the AI policy and AI objectives, and the evidence shows the documented procedure and its application both lack that linkage.**
- d) A finding is warranted against clause 6.1.2, but only if the auditor can demonstrate that identified risks would have differed had the policy and objectives been consulted, since a process gap without demonstrated impact does not constitute nonconformity.

*explanation:* Clause 6.1.2 requires the AI risk assessment process to be informed by and aligned with the AI policy and AI objectives. Evidence that the documented procedure contains no such linkage, and that assessors apply it without reference to those documents, establishes a process-design nonconformity against clause 6.1.2 directly. Limiting the finding to the existence of a documented procedure misreads the clause, which imposes qualitative requirements on the process design beyond mere documentation. Redirecting the finding to clause 5.2 conflates a policy communication issue with the structural requirement that the risk assessment process itself be aligned with the policy. These are distinct obligations: clause 5.2 governs the policy's properties and communication; clause 6.1.2 governs how the risk assessment process must be constructed. Requiring demonstrated impact on the identified risks adds a causation test the clause does not impose. The requirement is on process design; the auditor need not prove a different outcome would have resulted to raise a valid finding.

### 187. AIMS-IA · D4 · task 4.5 · `10b5f922`

> Analyze whether the AI risk treatment process and the statement of applicability conform to clause 6.1.3

**An internal auditor reviews an organization's AIMS documentation. The SoA includes control A.5.4 as included but the justification column states only 'Annex A control A.5.4.' The risk treatment plan references A.5.4 and traces it to a specific identified risk. What is the most defensible audit conclusion?**

- a) Nonconformity against clause 6.1.3 b), because the absence of substantive justification in the SoA indicates the Annex A completeness check was not performed, making it impossible to verify that no necessary control was omitted.
- b) Nonconformity against clause 6.1.3 f), because citing the control reference number alone does not constitute justification; clause 6.1.3 f) requires justification for each included control, not merely a label.
- **`KEY` c) Conformity, because clause 6.1.3 does not restrict justification to the SoA document itself; the risk treatment plan explicitly traces A.5.4 to a specific risk, and reading both documents together establishes the required linkage.**
- d) Observation only, because A.5.4 is included rather than excluded, and the justification burden under clause 6.1.3 f) falls more heavily on excluded controls; inclusion requires only that the control appear in the SoA.

*explanation:* Clause 6.1.3 f) requires the SoA to contain the necessary controls with justification for inclusion and exclusion, but it does not require that justification to reside exclusively within the SoA document. Where the risk treatment plan explicitly traces A.5.4 to a specific risk and treatment decision, an auditor reading both documents together can establish the required justification; the available finding is at most a documentation-quality observation, not a clear nonconformity. The nonconformity against clause 6.1.3 f) is defensible — citing only the control number is thin — but it overstates what the clause requires by implying the SoA column alone must carry the full rationale. This is why conformity is the better conclusion: the justification exists in the management system, even if not in the SoA column. The nonconformity against clause 6.1.3 b) conflates a weak SoA entry with evidence that the completeness check was not performed, which the risk treatment plan directly contradicts. The observation option rests on the misconception that clause 6.1.3 f) demands justification only for exclusions; the clause text requires justification for both inclusions and exclusions.

### 188. AIMS-IA · D4 · task 4.5 · `40f77ab2`

> Analyze whether the AI risk treatment process and the statement of applicability conform to clause 6.1.3

**The AIMS team tells you that Annex B is normative and that deviating from its implementation guidance without a documented rationale constitutes a nonconformity against clause 6.1.3. You find several Annex B recommendations the organisation has not followed, with no documented rationale. What finding does the evidence support?**

- a) There is no finding: Annex B's 'should' sentences are guidance regardless of the annex's normative status, and without a documented rationale requirement in Annex B.1, no obligation attaches to unimplemented recommendations.
- b) Each unimplemented Annex B recommendation is a standalone nonconformity, because Annex B is normative and its 'should' statements carry the same force as 'shall' once the related control appears in the SoA.
- c) The finding is at Annex B.1, which requires organisations to document justification for any implementation guidance they choose not to follow; absent rationale records are a direct nonconformity against that provision.
- **`KEY` d) The finding is at clause 6.1.3 e): no implementation and no rationale records mean the organisation cannot demonstrate it considered the Annex B guidance, which is the testable obligation.**

*explanation:* Clause 6.1.3 e) requires the organisation to 'consider the guidance in Annex B'—a genuine obligation, because Annex B is normative. However, Annex B is written in 'should' throughout, and Annex B.1 explicitly states that organisations do not need to document or justify inclusion or exclusion of implementation guidance in the SoA. The auditable obligation is therefore consideration, not implementation or documented rationale. Where there is no evidence of implementation and no record of consideration, the finding is that clause 6.1.3 e) consideration cannot be demonstrated. The option asserting that each unimplemented recommendation is a standalone nonconformity conflates the normative status of the annex with the modal of its sentences, which remain guidance. The option concluding there is no finding at all is defensible on the 'should' point but overlooks that clause 6.1.3 e) itself is a 'shall', making consideration a real requirement. The option citing Annex B.1 as the source of a documentation requirement misreads that provision: Annex B.1 relieves organisations of the documentation burden rather than imposing one.

### 189. AIMS-IA · D4 · task 4.6 · `3db07420`

> Distinguish the AI system impact assessment from the AI risk assessment and determine whether clause 6.1.4 is met

**An organization deploys an AI-driven hiring screening tool in one country. Its impact assessment documents risks to recruitment efficiency and data accuracy objectives. It does not address potential consequences for job applicants or broader labour-market effects. The auditee argues that societal impacts are irrelevant for a single-jurisdiction system and that clause 6.1.2 already covers individual consequences. Which analysis is most accurate?**

- a) The auditee is correct: clause 6.1.4 societal impact analysis applies only to multi-jurisdiction deployments, so a single-country system need only assess organizational and directly affected individual consequences.
- b) The auditee is wrong, but only on the societal-scope argument; omitting applicant-level consequences is not a 6.1.4 finding because clause 6.1.2 d) 1) already covers individual consequences, making that element of the auditee's position defensible.
- c) The auditee is partially correct: clause 6.1.2 d) 1) requires individual consequences in the risk analysis, so omitting applicant harms from the impact assessment creates only a documentation gap, not a substantive clause 6.1.4 gap.
- **`KEY` d) The auditee is wrong on both points: clause 6.1.4 requires assessment of consequences for individuals, groups and societies regardless of jurisdiction count, and clause 6.1.2 cannot discharge the 6.1.4 obligation because they are distinct, separately required processes.**

*explanation:* Clause 6.1.4 requires the impact assessment to address consequences for individuals, groups of individuals and societies, and to take into account the specific technical and societal context and applicable jurisdictions. It does not limit societal scope to multi-jurisdiction systems: an AI hiring tool operating in one country can still produce group-level or labour-market consequences that the clause requires to be assessed. The position that a single-jurisdiction deployment is exempt from societal analysis rests on a restriction the clause does not contain, making it indefensible on that point. The position that clause 6.1.2 already covers individual consequences confuses two distinct processes: 6.1.4 is outward-facing, addressing consequences for people and society, while 6.1.2 addresses risks to the organization's AI objectives. The NOTE under 6.1.2 d) 1) records only that impact assessment results can be used in the risk analysis — it does not collapse the two separately required processes into one, so the auditee's second argument also fails. The position that only a documentation gap exists understates the breach: the required substance — applicant and societal consequences — is absent from the assessment entirely, not merely misfiled.

### 190. AIMS-IA · D4 · task 4.6 · `249c2cf7`

> Distinguish the AI system impact assessment from the AI risk assessment and determine whether clause 6.1.4 is met

**An organization operates a single-country AI-based loan-scoring system. Its impact assessment, filed under clause 6.1.4, analyses consequences for individual applicants who may be incorrectly declined. The assessment contains no analysis of broader societal consequences. The auditee argues societal impact analysis is only relevant for multi-jurisdictional systems and this deployment is fully covered. What is the most defensible audit conclusion?**

- a) The clause 6.1.4 requirement is met, because the assessment addresses consequences for individuals, which is the primary scope; societal consequences are an optional extension that becomes mandatory only when the AI system crosses jurisdictional boundaries.
- b) The clause 6.1.4 requirement is not met, but the finding belongs at clause 6.1.3 rather than in the assessment content; excluding control A.5.5 without justification is the primary gap, and the missing societal analysis is a secondary concern.
- c) The clause 6.1.4 requirement is met, because a loan-scoring system primarily affects individual applicants; the standard's reference to societal consequences targets AI systems with mass-scale or infrastructure-level deployment, not a financial-services scoring tool.
- **`KEY` d) The clause 6.1.4 requirement is not fully met, because the clause explicitly requires the assessment to address consequences for individuals, groups of individuals and societies, and the single-country scope does not remove the obligation to consider societal consequences within that jurisdiction.**

*explanation:* Clause 6.1.4 requires the impact assessment to address consequences for individuals, groups of individuals and societies; this is a conjunctive list, not a hierarchy triggered by jurisdictional scope or deployment scale. A loan-scoring system operating in a single country can still produce societal consequences — for example, discriminatory patterns affecting a demographic group within that jurisdiction — so the single-country argument does not remove the obligation. The answer treating societal consequences as mandatory only across jurisdictions and the answer limiting the societal obligation to mass-scale systems both rest on conditions the clause text does not state, making them defensible misconceptions but not the best reading. The answer locating the primary finding in the statement of applicability for A.5.5 is defensible as a secondary observation — an unjustified exclusion of A.5.5 could also be raised — but the more direct and better-supported finding is the gap in assessment content against clause 6.1.4 itself, which applies regardless of which Annex A controls are selected.

### 191. AIMS-IA · D4 · task 4.7 · `180c6bcd`

> Analyze whether documented information requirements under clause 7.5 are met

**An internal auditor reviews a shared drive folder labelled 'AIMS Documents'. It contains the current AI policy, an impact assessment result, and three process definitions. All files are timestamped and readable. The drive has no version control, no approval metadata, and write access is unrestricted to all staff. Which conclusion about clause 7.5 conformity is best supported by this evidence?**

- a) The documents satisfy clause 7.5.2 because their content is current and reflects practice; format and approval formalities are secondary to substantive accuracy.
- b) The documents satisfy clause 7.5.3 because all staff can access them, and accessibility is the primary protection obligation that subclause imposes.
- **`KEY` c) The documents fail clause 7.5.2 and 7.5.3: no approval metadata means suitability and adequacy cannot be evidenced, and unrestricted write access means the documents are not adequately protected against unintended alteration.**
- d) The impact assessment result fails clause 7.5 because it must be retained as a record of a completed activity, and storing it alongside maintained documents in an uncontrolled folder conflates two distinct document-control obligations.

*explanation:* Clause 7.5.2 requires that documented information be reviewed and approved for suitability and adequacy when created or updated; the absence of any approval metadata means this cannot be evidenced for any of the documents. Clause 7.5.3 requires adequate protection, which unrestricted overwrite access directly undermines. The option asserting that technical accessibility alone satisfies 7.5.3 conflates availability with protection — the subclause requires both. The option about substantive accuracy is a defensible position but clause 7.5.2 does not permit approval formalities to be displaced by content currency alone. The option distinguishing retained records from maintained documents correctly identifies a real tension — the impact assessment result is the output of a completed process and is subject to retention controls — but that tension does not override the more immediate and evidenced failures in approval and protection that apply to all five documents equally; those failures are the better-supported finding on these facts.

### 192. AIMS-IA · D4 · task 4.8 · `18904585`

> Analyze whether operational planning and control under clause 8 is evidenced

**Six months ago, an organization expanded its customer-facing AI system to process a new category of personal data, changing the system's intended purpose. The AIMS documentation shows the original AI system impact assessment and role assignments from initial deployment. No updated assessment or role review has been conducted. The risk treatment plan and statement of applicability remain unchanged. Which clause provides the most direct basis for an audit finding?**

- a) Clause 5.3, because expanding the system's purpose requires roles and responsibilities to be reassigned, and the unchanged role documentation shows accountability has not been maintained after the change.
- **`KEY` b) Clause 8.2, because a significant change to the AI system's intended purpose is an explicit trigger for performing a new risk assessment, and no documented results exist for the changed operational context.**
- c) Clause 6.3, because expanding the system's purpose is a change to the AIMS that shall be carried out in a planned manner, and no planned approach to the change is evidenced in the documentation.
- d) Clause 9.1, because the organization has not monitored and measured the AI system's performance since the purpose changed, and performance evaluation is the primary mechanism for detecting gaps created by operational changes.

*explanation:* Clause 8.2 requires the organization to perform AI risk assessments at planned intervals or when significant changes are proposed or occur, and to retain documented information of the results. A change to the AI system's intended purpose — particularly one that introduces a new category of personal data — is a significant change that triggers this requirement directly. No updated assessment and no documented results exist for the changed context, satisfying both limbs of the finding. The finding against clause 6.3 is genuinely defensible because the change was not carried out in a planned manner; however, clause 6.3 addresses how changes to the AIMS shall be managed, whereas clause 8.2 names the specific operational re-execution that is required when a significant change occurs and identifies the missing output. Clause 8.2 is therefore the sharper and more direct citation. The clause 9.1 and clause 5.3 findings each capture a real gap — absent performance monitoring and stale role assignments respectively — but neither addresses the primary obligation that a significant change triggers: a new risk assessment with documented results.

### 193. AIMS-IA · D4 · task 4.9 · `d2dbb301`

> Determine the normative status of an Annex A control and of Annex B guidance when testing conformity

**During an internal audit, an auditor drafts this finding: 'Nonconformity — The organization has not implemented the data quality measures in Annex B clause B.7.3, because the procedure does not address all the should-level steps listed there.' The lead auditor questions whether the finding can stand. Which analysis is most accurate?**

- a) The finding can stand if the organization has not documented in its statement of applicability why it excluded those Annex B steps, since the SoA must justify exclusion of any normative content, including Annex B implementation guidance.
- b) The finding cannot stand because Annex B guidance is optional background reading that imposes no audit obligation; however, a finding could still be raised if the auditor shows the procedure fails the corresponding Annex A control stated in shall form.
- c) The finding can stand because Annex B is normative, and a normative designation means every sentence carries the same audit weight as a shall in clauses 4 to 10, regardless of the modal used in the annex.
- **`KEY` d) The finding cannot stand as drafted: a nonconformity requires a failed shall, and Annex B is written in should. The auditor may raise a concern about whether consideration of that guidance can be evidenced, but not a breach of the Annex B sentence itself.**

*explanation:* Annex B is normative because clause 6.1.3 e) requires the organization to consider its guidance, but what binds is the act of considering — not compliance with each individual should-level step. A nonconformity requires a failed shall, so the finding must be reframed around whether evidence of that consideration exists, not around failure to implement specific should sentences. The option asserting that normative designation converts every should into a shall-equivalent confuses the annex's status with its modal: normative means it cannot be ignored, not that its shoulds become shalls. The option requiring SoA justification for Annex B items is directly contradicted by clause B.1, which explicitly exempts implementation guidance from the inclusion/exclusion documentation obligation. The option suggesting the finding is unsalvageable in all forms is too broad: a correctly framed finding citing the shall in clause 6.1.3 e) — absence of evidence of consideration — could stand; only the finding as drafted, which cites non-implementation of should steps, cannot.

### 194. AIMS-IA · D5 · task 5.2 · `106ba660`

> Select the nonconformity statement that correctly links evidence to the requirement

**An internal auditor finds no documented criteria for distinguishing acceptable from non-acceptable AI risks. Which nonconformity statement is correctly structured?**

- **`KEY` a) Clause 6.1.1 requires AI risk criteria; no documented risk criteria were found, leaving acceptable and non-acceptable risks undefined.**
- b) No documented risk criteria were found; the AI Risk Owner failed to establish them, so clause 6.1.1 has not been met.
- c) Clause 6.1.1 requires AI risk criteria; the organization must produce a top-management-approved criteria document within 30 days.
- d) Clause 6.1.1 requires AI risk criteria; professional judgement indicates the current process is insufficient to meet this requirement.

*explanation:* A correctly structured nonconformity statement names the requirement (clause 6.1.1), states the specific evidence observed (no documented risk criteria found), and asserts the gap—nothing more. The statement attributing the gap to the AI Risk Owner adds blame the evidence cannot support, violating the objectivity element in ISO 19011:2026 clause 4.3. The statement prescribing a 30-day document makes the corrective-action decision for the auditee, contrary to ISO 19011:2026 clause 6.7. The statement relying solely on professional judgement without citing a specific observed fact is an assertion, not a finding, because it omits the evidence required by the definition of a finding in ISO 19011:2026 clause 3.11.

### 195. AIMS-IA · D5 · task 5.2 · `824fe404`

> Select the nonconformity statement that correctly links evidence to the requirement

**An internal auditor reviewing the AI risk assessment process finds that three sampled records lack documented likelihood estimates. Which nonconformity statement is correctly structured?**

- a) Clause 6.1.2 is not fulfilled because the risk analysis procedure is inadequate, as confirmed by the auditor's professional judgement during the walkthrough.
- **`KEY` b) Three sampled risk assessment records lack likelihood estimates, contrary to clause 6.1.2, which requires the organization to analyse AI risks.**
- c) Three sampled risk assessment records lack likelihood estimates; the AI Risk Owner failed to ensure the risk analysis procedure was followed.
- d) Clause 6.1.2 is not fulfilled; the organization should add a likelihood-rating field to its risk analysis template to close this gap.

*explanation:* A correctly structured nonconformity statement contains three elements: the criterion (clause 6.1.2, which requires the organization to analyse AI risks), the objective evidence (three sampled records lacking likelihood estimates), and the gap between them. The statement prescribing a likelihood-rating field in the template embeds a remedy the auditee has not chosen; audit methodology (ISO 19011:2026 A.18.3) calls for findings to record evidence and the criterion, not to direct corrective action. The statement attributing the gap to the AI Risk Owner adds motive or blame language that the sampled records alone cannot support, which fails the objectivity element of clause 4.3. The statement relying solely on professional judgement during a walkthrough, without citing a specific observed fact, lacks the evidence element that ISO 19011:2026 A.18.3 requires a nonconformity record to contain.

### 196. AIMS-IA · D5 · task 5.2 · `8f69a850`

> Select the nonconformity statement that correctly links evidence to the requirement

**AI objectives are documented but no monitoring records exist. Which nonconformity statement should the auditor record?**

- a) Clause 6.2 is not met: monitoring is absent; the organization must establish a quarterly review cycle with a designated process owner.
- b) Clause 6.2 is not met: the process owner neglected to implement monitoring, so no evidence exists that AI objectives are being tracked.
- **`KEY` c) Clause 6.2 is not met: objectives for the customer-scoring AI system are documented, but no monitoring records were available for review.**
- d) No monitoring records were found for the customer-scoring AI system's objectives, representing a significant gap warranting an audit finding.

*explanation:* The correctly formed statement names clause 6.2 as the criterion, identifies the specific system and evidence examined, and states the gap (no monitoring records available) without prescribing a remedy or attributing blame. Recommending a quarterly review cycle with a designated owner makes the auditee's corrective-action decision for them, contrary to ISO 19011:2026 clause 6.7 guidance. Stating the process owner 'neglected to implement' attributes fault that audit evidence cannot establish, failing the fair presentation requirement of ISO 19011:2026 clause 4.3, which calls for findings to be objective and accurate. Omitting the specific requirement and relying on a judgment of significance produces an observation rather than a finding, because ISO 19011:2026 clause 3.11 defines audit evidence as verifiable information evaluated against audit criteria.

### 197. AIMS-IA · D5 · task 5.4 · `a959a554`

> Determine whether a proposed finding is supportable given the normative status of the clause cited

**An auditor examining the statement of applicability notes that control A.7.4 is declared applicable, but the organization's implemented data quality process differs substantially from the approach described in Annex B. The auditor also notes that Annex B's guidance for A.7.4 was never reviewed during SoA development. Two findings are proposed: (1) nonconformity for implementing A.7.4 differently from Annex B; (2) nonconformity under clause 6.1.3 e) for failing to consider Annex B guidance. Which assessment of the two proposed findings is most accurate?**

- a) Finding 1 stands; declaring A.7.4 applicable makes Annex B's implementation description a requirement, so deviating from it is non-fulfilment of the normative annex.
- b) Neither finding stands: Annex B permits any suitable implementation, and clause 6.1.3 e) requires only that selected controls be listed in the SoA, not that each Annex B entry be separately reviewed.
- **`KEY` c) Finding 1 cannot stand because Annex B uses 'should'; Finding 2 stands because clause 6.1.3 e) requires consideration of Annex B guidance, and evidence shows that guidance was never reviewed.**
- d) Both findings stand: Annex B is normative, so differing implementation breaches it, and skipping the guidance review independently breaches clause 6.1.3 e).

*explanation:* Finding 1 fails because Annex B is written in 'should' throughout, and clause B.1 confirms that implementing a control differently from the guidance is not a breach. Annex B's normative designation means only that clause 6.1.3 e) — the consideration requirement — must be fulfilled; it does not convert Annex B's 'should' content into requirements. Declaring A.7.4 applicable therefore creates no obligation to follow Annex B's described approach. Finding 2 is supportable: clause 6.1.3 e) contains a 'shall' requiring the organization to consider Annex B guidance, and evidence that the guidance was never reviewed during SoA development directly fails that requirement. The distinction between Finding 1 and Finding 2 is precisely the distinction between implementing differently (permitted) and never considering at all (not permitted). The position endorsing both findings is the strongest competing view and is defensible in that Annex B is genuinely normative — but it misreads what normative status confers. Normative status makes the consideration obligation binding; it does not make each 'should' sentence a 'shall'. That is why endorsing both findings is weaker than endorsing only Finding 2. The position rejecting both findings correctly identifies that Annex B permits alternative implementations, but misreads clause 6.1.3 e) as a listing obligation. The clause requires active consideration of the guidance, not merely that controls appear in the SoA.

### 198. AIMS-IA · D5 · task 5.4 · `1fd382be`

> Determine whether a proposed finding is supportable given the normative status of the clause cited

**During an internal AIMS audit, you find that the AI development team does not document the rationale for data pre-processing decisions, contrary to Annex B guidance. The statement of applicability includes the corresponding Annex A control. The team lead confirms the guidance was reviewed but a different approach was deliberately chosen. Which finding classification is best supported by the evidence?**

- **`KEY` a) An observation or opportunity for improvement: Annex B uses 'should' throughout, clause B.1 states the guidance is not always suitable, and the team lead's confirmation shows consideration occurred, not a failure.**
- b) A nonconformity against Annex B: its normative status converts 'should' guidance into binding obligations equivalent to 'shall' requirements in clauses 4–10, regardless of how the control is otherwise implemented.
- c) A nonconformity against the included Annex A control: once declared in the statement of applicability, its 'shall' applies, and absent pre-processing rationale documentation proves the control is unmet.
- d) A nonconformity against clause 6.1.3 e): that clause requires adoption of Annex B guidance as written, and the team's deliberate rejection of the documented rationale approach directly breaches that obligation.

*explanation:* A nonconformity is the non-fulfilment of a requirement. Annex B is normative only in the sense that clause 6.1.3 e) requires the guidance to be considered; its content is written in 'should', and clause B.1 explicitly states that the guidance is not always suitable or sufficient and that organizations need not document or justify departures from it. The team lead's confirmation that the guidance was reviewed and a different approach deliberately chosen is evidence of consideration — exactly what clause 6.1.3 e) calls for — so no requirement has been breached and an observation is the correct classification. The option citing a nonconformity against Annex B as a whole conflates the normative status of the annex with the modal force of its content: normative placement does not convert 'should' sentences into 'shall' sentences. The option citing clause 6.1.3 e) misreads that clause: it requires consideration of the guidance, not adoption of it, and the facts show consideration occurred. The option citing the included Annex A control is the closest second-best, because the control does carry a 'shall' once selected, and absent documentation could look like non-implementation. It fails here because the evidence shows a deliberate alternative approach was chosen after review — the question is whether the control is implemented, not whether Annex B's suggested method was followed — and no evidence in the scenario establishes that the control itself is unmet, only that its Annex B implementation suggestion was not used.

### 199. AIMS-IA · D5 · task 5.4 · `874c8ba4`

> Determine whether a proposed finding is supportable given the normative status of the clause cited

**An internal auditor drafts two findings after an AIMS audit. Finding 1: 'Nonconformity — the internal audit procedure does not follow ISO 19011:2026 clause A.6 sampling guidance.' Finding 2: 'Nonconformity — no AI system impact assessment has been conducted, citing ISO/IEC 42001:2023 clause 6.1.4.' Which assessment of these two draft findings is most accurate?**

- a) Finding 1 should be downgraded to a minor nonconformity, not withdrawn: a significant deviation from ISO 19011 sampling guidance is too serious to record only as an observation.
- b) Both findings are supportable: ISO/IEC 42001:2023 implicitly binds organizations to ISO 19011 audit principles, and clause 6.1.4 is a clear 'shall' requirement with documented evidence of non-fulfilment.
- c) Finding 2 requires confirming the impact assessment process appears in the statement of applicability, since clause 6.1.4 is an Annex A control. Finding 1 is supportable as a process-level nonconformity against audit completeness.
- **`KEY` d) Finding 1 cannot stand: ISO 19011:2026 is guidance-only with no operative 'shall', so no nonconformity can be raised. Finding 2 is valid: clause 6.1.4 is a 'shall' requirement needing no statement of applicability entry.**

*explanation:* A nonconformity is the non-fulfilment of a requirement. ISO 19011:2026 is explicitly a guidance document — its scope so states — and contains no operative 'shall', only 'should'. No organization can be found non-conforming to it, so Finding 1 must be withdrawn; an observation or opportunity for improvement is the most it can support. Clause 6.1.4 sits within clauses 4 to 10 of ISO/IEC 42001:2023, is written in 'shall', and is a direct organizational requirement that applies without any statement of applicability entry. Finding 2 is therefore properly grounded. The option holding both findings supportable rests on the misconception that ISO/IEC 42001 implicitly incorporates ISO 19011 as a binding obligation. It does not: ISO 19011 is named only in a note to entry under clause 3.18, and clause 9.2 sets out the internal audit requirement in its own terms. The option proposing to downgrade Finding 1 to a minor nonconformity imports a severity scheme — major and minor — that ISO/IEC 42001:2023 does not define. More fundamentally, the problem is not the grade but the criterion: 'should' language cannot anchor a nonconformity at any severity level. The option conditioning Finding 2 on a statement of applicability entry correctly identifies that Annex A controls are conditional on declaration. It fails here because clause 6.1.4 is not an Annex A control — it is a clause 4-to-10 requirement — and the distinction between mandatory clauses and conditional Annex A controls is precisely what this finding tests.

### 200. AIMS-IA · D5 · task 5.7 · `73772fbe`

> Explain how internal audit results feed the management review inputs in clause 9.3.2

**After a management review, the record shows the date, attendees, topics discussed, and a note that 'the AIMS was found to be suitable, adequate and effective.' No explicit decisions are recorded. Which clause of ISO/IEC 42001:2023 is most directly left unevidenced?**

- a) Clause 9.2.2, because absent decisions indicate the internal audit programme was not properly executed before the review.
- b) Clause 9.3.1, because top management has not demonstrated it conducted the review at planned intervals as the clause requires.
- c) Clause 10.2, because absent recorded decisions means corrective actions cannot be tracked against the review's conclusions.
- **`KEY` d) Clause 9.3.3, which requires documented evidence of decisions on continual improvement opportunities and any need for AIMS changes.**

*explanation:* Clause 9.3.3 requires the management review results to include decisions related to continual improvement opportunities and any need for changes to the AIMS, and requires documented information as evidence of those results. A conclusion that no changes are needed is itself a decision that must be documented; recording only attendance and topics does not satisfy this. The gap is not at clause 9.2.2 (which concerns audit programme execution, not review outputs) nor at clause 10.2 (which governs reaction to nonconformities, not the recording of review decisions). Clause 9.3.1 sets the requirement to hold reviews at planned intervals, but the record shows a review did occur — the deficiency is in what the record captures, not whether the review happened.

---

# AISM-I — AI Service Management I

**Source this certification cites:** ITIL 4 and ISO/IEC 20000-1, per the item.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 201. AISM-I · D1 · task 1.3 · `c7c5e031`

> Explain value co-creation - how value is jointly produced by provider and consumer, not delivered - and how it changes when the provider's contribution is a probabilistic AI model (co-creation under uncertainty).

**A high-accuracy AI summarization service delivers summaries that do not advance a user's research goals. Why was value not realized?**

- **`KEY` a) High accuracy alone cannot guarantee value; the consumer's goals and context are also required.**
- b) The provider should have pre-loaded the user's research goals into the offering before delivery.
- c) The model's accuracy was insufficient, so the provider's output failed the quality threshold.
- d) The consumer failed to accept the delivered value correctly, creating a gap on the user side.

*explanation:* Value is co-created: the provider's capability and the consumer's goals and context together produce the outcome. High accuracy is a provider-side resource, not a guarantee of value, because the consumer's use completes it. Pre-loading goals into the offering misunderstands co-creation as a one-time design act rather than an ongoing interaction.

### 202. AISM-I · D1 · task 1.3 · `c0af8bdb`

> Explain value co-creation - how value is jointly produced by provider and consumer, not delivered - and how it changes when the provider's contribution is a probabilistic AI model (co-creation under uncertainty).

**Which statement correctly distinguishes assurance in an AI service from assurance in a deterministic service?**

- **`KEY` a) AI assurance must address probabilistic output ranges and consumer interpretation, not just provider output guarantees.**
- b) Both service types require the same assurance approach once AI accuracy exceeds an agreed performance threshold.
- c) AI services need no formal assurance; probabilistic outputs shift all outcome responsibility to the consumer.
- d) AI assurance can use identical SLA structures because providers control training and therefore control outputs.

*explanation:* Because AI model outputs are probabilistic, assurance cannot simply guarantee a specific output the way deterministic services can. Instead, it must address the range and confidence of outputs and how the consumer should interpret and use them—making expectation-setting a shared, co-creative responsibility. Treating AI SLAs as structurally identical to deterministic ones ignores this fundamental difference.

### 203. AISM-I · D1 · task 1.5 · `5679e5a7`

> Explain utility, warranty, and experience as the dimensions of a service's fitness - and how warranty changes for non-deterministic AI output, assuring a range of quality rather than an identical output.

**A service desk manager says: 'Our AI chatbot has excellent utility, so weaker warranty is acceptable for now—users still get value.' What is wrong with this reasoning?**

- **`KEY` a) Utility and warranty must both be satisfied; high utility cannot compensate for poor warranty.**
- b) Warranty is the primary value dimension; utility only matters after warranty thresholds are met.
- c) Utility covers reliability as well as function, so weak warranty automatically means weak utility too.
- d) Warranty covers what the service does, so weak warranty signals weak functionality, not a reliability gap.

*explanation:* A service delivers value only when it is both fit for purpose (utility) and fit for use (warranty). The two dimensions are not tradeable; high utility cannot compensate for poor warranty, because unreliable delivery prevents the functional capability from being realized. Neither dimension is primary—both are required.

### 204. AISM-I · D1 · task 1.6 · `777faa1a`

> Explain outputs vs outcomes, and cost and risk as what a service removes and imposes - including why AI's ability to mass-produce outputs sharpens the risk of mistaking outputs for outcomes.

**An AI writing assistant produces 500 marketing drafts per week at near-zero marginal cost. A manager argues this makes output volume essentially equivalent to value. Why is this reasoning incorrect?**

- a) Consumer review effort is a satisfaction issue, not a value issue, since value is defined by what the provider delivers.
- **`KEY` b) Low production cost ignores the costs and risks consumers incur reviewing, correcting, and using those drafts.**
- c) The error is only a communication problem; teams that understand the difference face no operational risk.
- d) When marginal cost approaches zero, output volume is a valid approximation of value delivered.

*explanation:* Even when AI produces outputs at near-zero marginal cost, the consumer still bears costs and risks—review effort, error correction, reputational exposure from poor content. The value equation must account for costs and risks imposed on the consumer, not only production costs on the provider's side. Volume of outputs is not equivalent to value.

### 205. AISM-I · D1 · task 1.7 · `3065d9f2`

> Explain service quality, service levels, and SLAs as the agreement of expectation - and how a service level is written for an AI service, committing to quality bounds and escalation rather than identical output.

**A support team reports all SLA metrics green for three consecutive months, yet consumer satisfaction scores are declining. What does this pattern most likely indicate?**

- a) Stricter penalty clauses are needed to motivate the provider to close the satisfaction gap.
- b) Satisfaction surveys are unreliable and should be discarded in favour of the objective green metrics.
- c) The service meets agreed levels; declining satisfaction reflects expectations that exceed the contract.
- **`KEY` d) The SLA metrics measure provider outputs, not outcomes that reflect what the consumer actually values.**

*explanation:* Green metrics alongside falling satisfaction is the classic SLA measurement pitfall: the measured targets do not capture what the consumer truly values, so metrics appear healthy while real quality deteriorates. Discarding satisfaction data or blaming inflated expectations ignores evidence that the chosen metrics are the wrong proxy. Penalty clauses address enforcement, not metric selection.

### 206. AISM-I · D2 · task 2.1 · `52c75c7a`

> Explain the components of a service value system and how they fit together.

**Which statement best describes the relationship between the Service Value Chain and the Service Value System?**

- a) The SVC is the SVS's central element and contains the guiding principles as sub-activities within it.
- b) The SVC is an external input to the SVS, feeding demand and opportunity into the system.
- **`KEY` c) The SVC is one component within the SVS, providing the operating model for converting demand into value.**
- d) The SVC is a lower-level view of the SVS, describing the same concept at a finer level of abstraction.

*explanation:* The Service Value Chain is one of five components of the SVS, not a synonym or restatement of it. It provides the interconnected activities through which demand and opportunity are converted into value. Describing it as a lower-level view of the same concept collapses the part–whole relationship. It is not an external input, and the guiding principles are a separate SVS component, not sub-activities of the value chain.

### 207. AISM-I · D2 · task 2.1 · `0a135b39`

> Explain the components of a service value system and how they fit together.

**A hospital uses the SVS to manage patient-facing services and internal support functions. Which statement best classifies this use?**

- a) Valid only for internal IT services; patient-facing services require a separate value management model.
- **`KEY` b) Valid — the SVS applies to any organization creating value through services, not only IT-based ones.**
- c) Invalid — the SVS is designed for commercial service providers, not public-sector organizations.
- d) Invalid — the SVS governs only IT service management and does not extend to non-IT value streams.

*explanation:* The SVS is a universal model for how any organization's components and activities work together to create value. It is not restricted to IT, to external customers, or to commercial contexts. Internal functions, non-IT services, and public-sector organizations all fall within scope.

### 208. AISM-I · D2 · task 2.4 · `2ef100fa`

> Given a described situation - including a decision about whether and where to adopt AI - apply the appropriate guiding principle to choose a sound course of action.

**A team wants to automate customer-complaint routing using AI. The existing manual process is poorly documented and inconsistently followed. Applying 'start where you are,' what should the team do first?**

- a) Evaluate only technology infrastructure, because 'start where you are' excludes workflows and skills.
- b) Proceed with AI adoption immediately, since technical feasibility confirms value alignment.
- **`KEY` c) Assess the current process, people, and skills honestly before introducing AI.**
- d) Freeze the existing process, because 'start where you are' means no changes before AI is introduced.

*explanation:* 'Start where you are' requires an honest assessment of the current state—people, skills, processes, and tools—so improvements build on reality rather than assumptions. It does not mean preserving a broken process unchanged, nor does it limit assessment to infrastructure alone. Technical feasibility does not by itself confirm value alignment.

### 209. AISM-I · D2 · task 2.6 · `fe476461`

> Explain governance as the direction and control that enables service management.

**How does the 'direct, monitor, evaluate' governance cycle operate over time?**

- **`KEY` a) As a continuous feedback loop where evaluation informs updated direction and monitoring.**
- b) As a one-time sequential process that concludes once results have been formally evaluated.
- c) As parallel independent activities owned by separate governance bodies with no shared output.
- d) As a reactive sequence triggered only when performance metrics fall below set thresholds.

*explanation:* Governance operates as a continuous cycle: evaluation feeds back into updated direction, and monitoring provides ongoing visibility. Treating it as a one-time sequence or as reactive-only misrepresents its nature as a persistent, iterative control mechanism. Parallel independent activities with no shared output contradicts the integrated design of the cycle.

### 210. AISM-I · D2 · task 2.9 · `adaa8d83`

> Given a described improvement effort, determine which continual-improvement step it skipped.

**A team improving first-contact resolution rates tracked only the resolution rate, ignoring agent workload and call-routing data. Resolution improved but agent burnout spiked. Which baseline gap caused this blind spot?**

- **`KEY` a) Failing to capture contributing process variables alongside the primary metric, leaving side-effects undetected.**
- b) Delaying baseline collection until after the routing change, excluding early burnout signals from the dataset.
- c) Skipping executive vision alignment, which would have flagged agent wellbeing as an in-scope concern.
- d) Reusing baseline data from a prior FCR initiative instead of measuring current agent capacity and routing patterns.

*explanation:* Limiting baseline measurement to the primary output metric while ignoring contributing variables — here, workload and routing — creates a partial picture that misses unintended consequences. A complete baseline captures the system, not just the headline number.

### 211. AISM-I · D2 · task 2.9 · `5d34e46a`

> Given a described improvement effort, determine which continual-improvement step it skipped.

**A service team launched a new triage process but never recorded ticket volumes beforehand. Six months later, metrics show no improvement. Which continual-improvement step did the team skip?**

- a) Embedding the change, because the new triage process was never added to standard operating procedures.
- b) Securing sponsorship, because insufficient budget prevented accurate data collection throughout the effort.
- c) Defining the vision, because the team lacked an agreed target state to direct the redesign work.
- **`KEY` d) Establishing a baseline, because without pre-change data, improvement cannot be measured or demonstrated.**

*explanation:* Without a pre-change measurement, the team has no reference point to determine whether the triage process made any difference — the classic 'no baseline' failure. Defining the vision and embedding the change are separate steps unrelated to this symptom. The inability to demonstrate improvement points directly to the missing baseline.

### 212. AISM-I · D3 · task 3.10 · `0c57c72e`

> Given a described flow, determine an improvement using value-stream thinking (find the waste).

**A team calculates flow efficiency at 8% for a 12-step order-fulfillment process. A stakeholder demands a target of 80%. What should the team communicate?**

- **`KEY` a) Explain that 8% is typical; reaching 20–40% would represent exceptional improvement and a realistic near-term goal.**
- b) Reduce the map to eight steps so the diagram reflects a more favorable efficiency ratio to the stakeholder.
- c) Recalculate by dividing value-adding steps by total steps, which will likely produce a higher, more accurate figure.
- d) Agree with the target, because modern automation makes 80% flow efficiency achievable in most service processes.

*explanation:* Real-world processes commonly run at 5–15% flow efficiency; 40% is considered exceptional. An 80% target without context sets the team up for failure. Flow efficiency is correctly measured as value-adding time divided by total lead time—not a step-count ratio—so recalculating with a step-count formula produces a meaningless, inflated number. Reducing the step count on the map misrepresents the actual process.

### 213. AISM-I · D3 · task 3.11 · `6be2820a`

> Determine where AI shifts human effort inside a management practice (such as triage, detection, or assessment) while the purpose of the practice and human accountability for its outcome remain unchanged.

**After AI is integrated into problem management to detect recurring incident patterns, the process owner proposes retiring the existing governance policy, arguing it was designed for manual detection. What should the process owner do?**

- a) Suspend the policy temporarily while the team measures AI detection accuracy before deciding on permanent governance changes.
- b) Retire the policy — governance built around manual detection is obsolete once AI performs that step more reliably.
- c) Transfer policy ownership to the AI vendor, since they now own the detection step the policy was designed to govern.
- **`KEY` d) Update the policy to reflect where human effort now sits, while preserving the accountability structure for problem outcomes.**

*explanation:* Governance structures are not obsolete when AI augments a practice; they must be updated to reflect the new location of human effort and judgment while preserving accountability for outcomes. The practice purpose — identifying and resolving problems — is unchanged. Retiring the policy or transferring ownership to the vendor abandons human accountability. Suspending the policy creates an unmanaged accountability gap during the interim period.

### 214. AISM-I · D3 · task 3.12 · `9fd16086`

> Explain supplier and service-provider management, and the distinctive dependency risk of an AI service built on a model you do not own - lock-in, and a provider changing the model underneath you.

**A provider silently retrains its foundation model, producing noticeably different outputs. The API interface remains unchanged. What does this scenario illustrate?**

- a) A minor event, because an unchanged API confirms the service contract has not been breached and outputs remain within acceptable tolerance.
- **`KEY` b) A model-changed-underneath risk, where behavioral drift occurs with no API change, requiring output monitoring beyond interface checks.**
- c) A standard update, since foundation model providers maintain backward compatibility as a reputational incentive, making silent behavioral changes commercially unlikely.
- d) An isolated issue, because meaningful output changes require the provider to also modify and republish documented model parameters in release notes.

*explanation:* A model update that leaves the API surface intact can still fundamentally alter service outputs. This is the 'model changed underneath' risk: behavioral monitoring and contractual model-version protections are necessary because API stability does not guarantee output stability. Backward compatibility is not a default guarantee from foundation model providers, and output changes do not require documented parameter modifications.

### 215. AISM-I · D3 · task 3.4 · `cd071162`

> Explain value streams - core and enabling - and their role in delivering a service.

**What is the primary purpose of modeling work as a value stream rather than as a list of departmental tasks?**

- **`KEY` a) To make end-to-end flow visible so that waste, delays, and improvement opportunities can be identified.**
- b) To assign every task to exactly one team so no individual participates in more than one stream.
- c) To create a permanent record of current procedures that satisfies audit and compliance requirements.
- d) To align each stream one-to-one with a product line so accountability for outcomes is unambiguous.

*explanation:* The defining purpose of a value stream model is to reveal how work flows from trigger to customer outcome, making waste and bottlenecks visible for improvement. Treating it as a documentation or audit artifact mistakes the map for the goal. Forcing exclusive task ownership ignores that people routinely contribute to multiple streams. Requiring a one-to-one match with product lines imposes an artificial structural constraint the concept does not require.

### 216. AISM-I · D3 · task 3.4 · `e40d5af4`

> Explain value streams - core and enabling - and their role in delivering a service.

**An organization's HR onboarding process supplies trained employees to every product delivery team. Which type of value stream does this best represent?**

- a) A core value stream, because onboarding touches every product team and therefore directly produces customer-facing value.
- b) Neither type, because operational support activities like onboarding fall outside any value stream model.
- **`KEY` c) An enabling value stream, because it builds organizational capacity rather than directly delivering value to the external customer.**
- d) A core value stream, because each product line it serves requires its own dedicated onboarding stream.

*explanation:* An enabling value stream supports the organization's ability to operate core streams; it does not itself deliver the product or service the external customer receives. HR onboarding builds organizational capacity, making it a classic enabling stream. The misconception that touching multiple teams makes a stream 'core' confuses reach with direct value delivery. The claim that a one-to-one dedicated stream is required imposes a structural constraint the concept does not support. The claim that operational activities fall outside value streams entirely is incorrect.

### 217. AISM-I · D3 · task 3.5 · `c020067f`

> Explain incident and problem management and select which applies - recognizing that a drop in AI output quality is itself an incident even when nothing is "down".

**During an active incident with an AI recommendation engine, a stakeholder demands Problem Management be completed before the incident is closed. What is the correct response?**

- a) Agree — the incident cannot close while the root cause remains unresolved, per standard service management practice.
- b) Agree — closing the incident before Problem Management finishes risks losing traceability between the two records.
- c) Decline — Problem Management is only triggered if the incident recurs after the initial workaround is applied.
- **`KEY` d) Decline — restore service and close the incident; Problem Management continues as a separate, parallel activity.**

*explanation:* Incident Management and Problem Management run as separate processes. The incident is closed once normal service operation is restored; Problem Management then continues independently to find and remove the root cause. Blocking incident closure on root-cause completion delays service restoration, which is contrary to Incident Management's primary objective. Traceability between the two records is maintained through linking, not by keeping the incident open.

### 218. AISM-I · D3 · task 3.9 · `574849b5`

> Explain service level management and monitoring & event management - including monitoring an AI service for drift and output-quality degradation, not just availability.

**Why does monitoring an AI service require more than tracking uptime and response time?**

- **`KEY` a) Output quality can degrade silently while the service stays available, so behavioral metrics must supplement infrastructure metrics.**
- b) Output quality is the model team's responsibility, so service management need only confirm the service is reachable.
- c) Uptime monitoring belongs to infrastructure teams, so service management must focus solely on output-quality metrics instead.
- d) Infrastructure metrics like CPU usage always reflect output-quality drift, making separate behavioral monitoring redundant.

*explanation:* An AI service can be fully available and fast yet produce degraded or drifted outputs that harm users — infrastructure metrics alone will not surface this. The claim that infrastructure metrics always mirror output-quality drift is a common but false assumption; behavioral monitoring is a distinct and necessary practice. Output-quality oversight belongs to service management, not solely to model developers.

### 219. AISM-I · D4 · task 4.1 · `dac43df2`

> Explain what AIOps is and how it changes service operations.

**An AIOps platform ingests server metrics, application logs, distributed traces, and network flow records simultaneously. Which AIOps characteristic does this illustrate?**

- **`KEY` a) AIOps correlates heterogeneous operational data — metrics, logs, traces, and events — within a single unified analysis layer.**
- b) AIOps ingests diverse data types primarily to accelerate alert delivery, not to find cross-source patterns unavailable to single-source monitors.
- c) AIOps is limited to infrastructure metrics; ingesting logs and traces requires a separate, non-AIOps analytics pipeline.
- d) AIOps processes multiple data types only after operators manually map each source to a common schema using field-matching rules.

*explanation:* A defining characteristic of AIOps is its ability to ingest and correlate heterogeneous operational data — metrics, logs, traces, and event streams — within a single analytical layer to surface cross-source patterns. Restricting AIOps to infrastructure metrics only, requiring manual schema mapping as a prerequisite, or attributing multi-source ingestion solely to faster delivery all misrepresent this foundational capability.

### 220. AISM-I · D4 · task 4.11 · `de570ed8`

> Given a described AI-driven service action an agent can perform, determine the highest safe level of autonomy the agent should be granted.

**An AI agent autonomously approves expense reimbursements under $50. A policy update raises the organization's financial risk threshold. What should happen to the agent's autonomy boundary?**

- a) Remove the agent from expense processing entirely, because any change in stakes requires full capability restriction.
- b) Retain the $50 limit, because the agent's confidence on these decisions has not changed.
- c) Raise the threshold, because higher organizational risk sensitivity implies broader safe autonomy.
- **`KEY` d) Lower the autonomous-approval threshold to reflect the organization's increased sensitivity to financial stakes.**

*explanation:* Stakes are a primary factor in setting the safe autonomy boundary; when organizational risk sensitivity increases, the same dollar amount represents higher relative stakes, so the autonomous-approval threshold must be lowered. Confidence is only one of four inputs and cannot hold the boundary steady when stakes have materially changed. Higher risk sensitivity means the organization tolerates less autonomous exposure, not more—raising the threshold would move in the wrong direction. Full capability removal is disproportionate; bounded autonomy calls for calibrating the envelope to the current risk profile.

### 221. AISM-I · D4 · task 4.12 · `81480b34`

> Analyze how errors compound across an agentic workflow's multi-step chain.

**An autonomous agent executes 12 sequential API calls before a human reviewer checks results. A pricing error at step 2 propagates undetected through all remaining steps. What most directly determines blast radius here?**

- a) The agent's execution speed, since slower calls give human observers more time to detect anomalies before they propagate.
- **`KEY` b) The number of downstream steps that commit changes before the error is caught, amplifying the scope of corrupted state.**
- c) The agent's architecture, since blast radius is a fixed structural property that cannot be reduced without a full redesign.
- d) The severity of the pricing error at step 2, since the initial mistake sets the ceiling for all subsequent damage.

*explanation:* Blast radius is determined by how many downstream actions execute and commit before the error is caught. The severity of the first erroneous action, execution speed, and architecture all shape context but do not directly govern how far damage spreads; the count of unchecked committed steps does.

### 222. AISM-I · D4 · task 4.12 · `6137f332`

> Analyze how errors compound across an agentic workflow's multi-step chain.

**Every step of an agentic order-fulfillment chain passes its unit test individually. Despite this, end-to-end runs repeatedly produce over-shipments. What does this pattern most likely indicate?**

- a) A single-step defect that unit testing missed; more granular per-step verification would isolate the over-shipment root cause.
- **`KEY` b) A multi-step failure: individually correct steps combine to produce an emergent error absent from any single step's test.**
- c) A schema mismatch; individually validated steps guarantee sequence correctness only when all steps share the same data schema.
- d) A blast-radius problem; restricting the agent's access to external shipping systems would stop the over-shipments.

*explanation:* When each step passes in isolation yet the sequence fails, the failure is emergent—arising from how steps interact, not from any single step's defect. This is the defining characteristic of multi-step failure. Restricting external access addresses blast radius but does not explain or resolve an interaction-driven sequencing error.

### 223. AISM-I · D4 · task 4.15 · `da5ef6f2`

> Diagnose why an AI-augmented operation degraded - model drift, data quality, or automation gone wrong.

**An AI triage system misroutes calls at a slowly worsening rate over six months. No alerts fire and no errors appear. A technician argues no action is needed because failures always produce explicit error signals. What is wrong with this reasoning?**

- **`KEY` a) It conflates error-free execution with correct behavior, missing that silent output degradation is a recognized failure mode.**
- b) It assumes drift can only be detected by comparing outputs against a freshly labeled holdout set, not by operational monitoring.
- c) It underestimates retraining frequency; more frequent retraining would prevent gradual misrouting regardless of cause.
- d) It misidentifies the pattern as automation failure when a slow worsening rate uniquely indicates a data pipeline issue.

*explanation:* The technician's error is equating error-free execution with correct outputs — a fundamental misunderstanding of how automated AI systems fail. Silent degradation, where a system continues producing outputs without exceptions while those outputs worsen, is a well-documented automation failure mode. The absence of alerts is not evidence of correct behavior; it is evidence that the monitoring design is insufficient.

### 224. AISM-I · D4 · task 4.2 · `be2c9c79`

> Given a described operation, determine where AIOps adds value across monitoring, event correlation, and noise reduction.

**An AIOps platform was trained on six months of stable traffic data. The business then launches a major feature that significantly changes usage patterns. What should the operations team do?**

- a) Disable AIOps and revert to manual monitoring until usage patterns stabilize over several months.
- **`KEY` b) Retrain the model on data that includes the new usage patterns so baselines remain accurate.**
- c) Take no action; baselines and correlations remain valid regardless of environmental changes.
- d) Raise alert thresholds to match higher traffic volumes so the model avoids excess noise.

*explanation:* AIOps models must be retrained when the environment changes significantly; baselines and correlation patterns learned from old data become inaccurate under new usage profiles. Assuming the model stays valid without retraining is a common and costly misconception. Disabling AIOps discards value rather than adapting it. Raising thresholds addresses volume, not the accuracy of learned baselines.

### 225. AISM-I · D4 · task 4.2 · `0e10f3e8`

> Given a described operation, determine where AIOps adds value across monitoring, event correlation, and noise reduction.

**An operations team receives 2,000 alerts per day. Operators cannot distinguish critical incidents from background noise. Which AIOps capability should be applied first to make the alert stream actionable?**

- a) Raise alert thresholds across all monitors so fewer alerts fire, reducing daily volume but risking missed genuine incidents by bluntly removing signal.
- b) Deploy autonomous remediation so AIOps resolves each alert immediately, acting on the full noisy stream without requiring operator validation.
- **`KEY` c) Alert noise reduction, to suppress redundant and low-value alerts so genuine incidents become visible without discarding coverage.**
- d) Permanently disable low-priority alert rules until each one is manually reviewed, eliminating coverage rather than filtering alerts contextually.

*explanation:* Alert noise reduction intelligently filters redundant or low-value signals, making real incidents visible without discarding coverage. Raising thresholds bluntly removes signal and risks missing genuine incidents. Permanently disabling rules removes coverage rather than filtering contextually. Autonomous remediation without noise reduction still acts on a noisy stream and bypasses required human validation.

### 226. AISM-I · D4 · task 4.3 · `2f9f599b`

> Analyze an alert flood to identify the underlying signal AIOps should surface.

**After AIOps identifies a misconfigured load balancer as the root cause of a 60-alert storm and the configuration is corrected, 12 alerts remain active 10 minutes later. What should the analyst conclude?**

- a) The root cause was misidentified, because fixing the true root cause clears all downstream alerts immediately.
- **`KEY` b) The 12 alerts may reflect propagation lag, secondary effects, or independent issues requiring further correlation.**
- c) Alert thresholds need raising on those 12 services, because persistent alerts after a fix indicate over-sensitive monitoring.
- d) The 12 alerts are independent issues; downstream alerts from a resolved root cause clear simultaneously.

*explanation:* Downstream systems recover at different rates after a root cause is remediated; some alerts clear quickly, others linger due to cascading effects or secondary faults. Assuming simultaneous clearance is a misconception—persistent alerts after a fix warrant further correlation, not automatic reclassification as independent incidents or threshold adjustments.

### 227. AISM-I · D4 · task 4.5 · `80643999`

> Given a described operation, determine whether a predictive approach fits.

**A logistics company has five years of consistently labeled GPS and delivery-time logs. Analysts want to predict which routes will experience delays tomorrow. Intervention cost is low. What should the team do?**

- a) Reject: GPS logs gathered primarily for regulatory compliance carry inherent validity limitations that prevent them from reliably predicting operational delay outcomes.
- b) Proceed: five years of accumulated data volume independently qualifies this process as a strong prediction candidate, regardless of how the data was labeled or collected.
- c) Reject: when delays occur frequently across routes, prediction cannot add value beyond simply applying a fixed delay-avoidance schedule to all routes.
- **`KEY` d) Proceed: consistently labeled data that reflects the target outcome, combined with low intervention cost, satisfies the prediction-value threshold for a predictive approach.**

*explanation:* When historical data is consistently labeled, reflects the outcome being predicted, and intervention cost is low, the prediction-value threshold is met and a predictive approach is justified. Data volume alone does not qualify a process—relevance and labeling quality matter. Compliance-origin data is not automatically unsuitable if it genuinely reflects the target outcome. Frequency of delay events does not by itself disqualify a predictive model from adding value.

### 228. AISM-I · D4 · task 4.6 · `0ce9ffa3`

> Analyze a recurring-incident pattern to determine whether a predictive control would prevent it.

**An AI service had six incidents over four months. Each began with a gradual memory rise that crossed 90% only after degradation had already started. An alert fires when memory exceeds 90%. Why does this alert fail to qualify as a predictive control?**

- a) The same threshold appeared in all six incidents, but threshold-based alerts are structurally incapable of serving as controls.
- b) It targets high memory rather than an upstream condition, so it addresses a symptom instead of a precursor.
- c) It notifies operators and reduces incident frequency, but frequency reduction alone does not make a control predictive.
- **`KEY` d) It fires after degradation has already begun, detecting the failure in progress rather than forecasting it beforehand.**

*explanation:* A predictive control must detect a leading indicator early enough to intervene before harm occurs. Because the 90% threshold is breached only after service degradation has already started, the alert responds to a failure in progress rather than forecasting it — disqualifying it as predictive. The option describing symptom-targeting identifies a design flaw but does not address the timing criterion that defines predictive controls. The option about frequency reduction confuses a beneficial side-effect with the qualifying criterion for a predictive control. The option about a shared threshold conflates recurrence patterns with root-cause confirmation and misrepresents why threshold-based alerts can or cannot be predictive.

### 229. AISM-I · D4 · task 4.6 · `3c496b2e`

> Analyze a recurring-incident pattern to determine whether a predictive control would prevent it.

**A predictive model flags memory-exhaustion risk 70% of the time but only 90 seconds before a crash—too short for any remediation action. The team considers it as a preventive control for a recurring crash pattern. Which factor is decisive in evaluating fit?**

- **`KEY` a) Insufficient lead time is decisive; a signal too late for remediation cannot function as a preventive control.**
- b) The 70% accuracy is below the required threshold, so the model should be rejected on accuracy grounds alone.
- c) The model fits because 70% correlation with the pattern makes accuracy the primary criterion for predictive control fit.
- d) The model qualifies because it limits escalation once the crash begins, reducing overall impact.

*explanation:* Predictive control fit requires both a detectable precursor signal and sufficient lead time to act before the failure. Ninety seconds is not enough time to remediate, so the model cannot prevent the incident even if accuracy were higher. Accuracy matters but is secondary to actionability; a perfectly accurate signal with no remediation window still fails as a preventive control. Acting after a crash has begun is reactive, not preventive, regardless of how much escalation is reduced.

### 230. AISM-I · D5 · task 5.1 · `80ec1472`

> Explain why AI in service management needs governance beyond traditional service controls.

**A service management team argues that existing change and incident management processes are sufficient to govern an AI system that autonomously resolves tickets. Why is this view mistaken?**

- a) These controls fail due to missing vendor SLA clauses; adding contractual liability terms to the AI supplier agreement closes the gap.
- b) These controls are insufficient only at large scale; a well-tested AI in a small environment is adequately governed by existing processes.
- **`KEY` c) These controls assume discrete, human-initiated actions, but AI autonomy means continuous action at scale without per-action human authorization.**
- d) These controls only fail when AI makes final decisions; recommendation-only AI systems remain fully covered by standard change processes.

*explanation:* Traditional service controls such as change and incident management are designed around discrete, human-initiated actions subject to per-event review. AI autonomy breaks this assumption: the system acts continuously, at high volume, and without individual human authorization for each action—creating a governance gap those controls were never designed to cover. The distractor confining the gap to decision-finality is wrong because the gap exists regardless of whether outputs are final or advisory. The distractor citing missing SLA clauses is wrong because contractual terms do not substitute for operational governance controls. The distractor limiting the problem to large scale is wrong because autonomy and opacity create governance gaps even in small environments.

### 231. AISM-I · D5 · task 5.2 · `1d6b4b16`

> Explain accountability when an AI agent takes a service action - who remains answerable.

**A service manager grants an AI agent authority to approve refunds up to $500 without human review. Where does accountability sit for each refund decision?**

- a) With the agent, mirroring how delegation to a human employee transfers responsibility.
- b) Shared equally between manager and agent, proportional to how often the agent acts unaided.
- **`KEY` c) With the service manager, because granting authority to an agent does not transfer answerability.**
- d) Suspended for refunds within the $500 limit, because the agent acts inside pre-approved boundaries.

*explanation:* Delegating authority to an AI agent differs fundamentally from delegating to a human: agents cannot be held answerable, so accountability stays with the person who authorized the agent's actions. Operating within pre-approved boundaries does not suspend human accountability.

### 232. AISM-I · D5 · task 5.6 · `b49da26b`

> Explain how AI service governance connects to the organization's broader AI governance and risk management.

**A compliance lead argues that AI service governance connects to enterprise risk management only as upward metric reporting. Which statement best explains why this view is incomplete?**

- a) The two tracks only need to formally connect during scheduled annual audits, not continuously.
- **`KEY` b) The relationship is bidirectional: enterprise risk appetite shapes required service controls, not only receives data from them.**
- c) The connection is technical, so IT and data science teams manage it independently of compliance functions.
- d) The flow is strictly downward: enterprise policy dictates controls, and services report compliance without sending data upward.

*explanation:* Connecting service-level governance to enterprise AI risk management is bidirectional: enterprise risk appetite sets boundaries for service-level controls, while service-level findings inform enterprise risk assessments. Treating it as upward reporting only ignores how enterprise risk appetite actively shapes service controls. The strictly downward-flow view errs by eliminating feedback from services. The IT-only scope view misplaces ownership. The annual-audit-only view ignores the need for continuous integration across governance layers.

### 233. AISM-I · D5 · task 5.7 · `6e875bcb`

> Given a described AI-driven service, determine what to monitor to detect drift, degradation, and harm.

**An AI medical-triage chatbot's average confidence scores remain high, but several high-confidence recommendations were clinically incorrect. What monitoring addition is most appropriate?**

- a) Rely on clinician complaint tickets as the primary harm signal, because harmful outputs are identifiable only after users report them.
- **`KEY` b) Add calibration monitoring comparing predicted confidence to actual correctness rates, because high confidence does not guarantee correct outputs.**
- c) Lower the confidence threshold for review, because this will surface incorrect outputs before they reach clinicians.
- d) Increase clinician review frequency for all outputs, because manual oversight compensates for any confidence-scoring deficiency.

*explanation:* Confidence scores are not inherently calibrated; a model can be systematically overconfident on incorrect outputs. Calibration monitoring—comparing stated confidence to empirical accuracy—detects this failure mode. Lowering the threshold without calibration data does not solve miscalibration, and reactive complaint-based or blanket manual-review approaches miss the root cause.

### 234. AISM-I · D5 · task 5.7 · `cc38d063`

> Given a described AI-driven service, determine what to monitor to detect drift, degradation, and harm.

**A loan-approval AI service has stable uptime and low latency but no user complaints. A service manager suspects the model may be harming applicants unfairly. Which monitoring signal should be added first?**

- a) Model confidence score distribution, because high-confidence outputs indicate correct, low-risk decisions without additional checks.
- b) Volume of user-submitted complaints, because harmful outputs are best confirmed through direct feedback from affected applicants.
- **`KEY` c) Approval-rate disparity across demographic subgroups, because aggregate metrics can mask harm concentrated in specific populations.**
- d) Server error rate and p99 latency, because infrastructure instability commonly causes inconsistent model decisions in production.

*explanation:* Aggregate metrics such as overall accuracy or uptime can appear healthy while serious harm is concentrated in a subgroup — a well-known failure mode for fairness-sensitive AI services. Approval-rate disparity across demographic groups is therefore the appropriate first signal to add. Uptime and latency are infrastructure signals that do not reveal model behavior toward specific groups. Confidence scores are not a reliable proxy for correctness or fairness. Relying on user complaints is reactive and misses proactive harm detection, especially when affected applicants may not know to complain.

### 235. AISM-I · D5 · task 5.9 · `5fc3fa9e`

> Given an AI service action that caused harm, determine an appropriate escalation and incident path.

**An AI recruitment tool rejects one candidate based on a hallucinated criminal record. No other candidates were affected. Should this be escalated as an AI harm incident?**

- a) Yes, but only after the internal investigation is complete so that accurate information is available before notifying stakeholders.
- b) No; the candidate could have appealed, so unexercised appeal rights transfer responsibility away from the provider.
- **`KEY` c) Yes; individual harm from an AI output triggers escalation regardless of how many users were affected.**
- d) No; escalation requires simultaneous harm to multiple users, so a single affected individual does not meet the threshold.

*explanation:* Harm escalation applies to individual AI-caused harm events, not only large-scale incidents. Scale does not set the escalation threshold. Waiting for a full investigation before escalating is also incorrect; serious incidents require timely notification. The availability of an appeal process does not transfer provider responsibility for a harmful AI output.

### 236. AISM-I · D6 · task 6.2 · `a603de99`

> Explain experience-focused measurement - measuring the outcome and satisfaction a user actually gets, not only technical service levels.

**A file-sharing service meets all contractual SLAs. Analysis reveals that 30% of large-upload attempts receive no error message but silently fail. Which concept does this most clearly illustrate?**

- a) A monitoring gap, because any degradation in a live system surfaces in at least one existing technical indicator.
- b) A user-behavior anomaly best addressed by UX research, since service management covers availability and response time, not upload success.
- c) An SLA breach, because silent failures constitute unavailability already captured by the uptime metric.
- **`KEY` d) A task completion failure invisible to technical SLAs, showing why outcome-based metrics are needed alongside technical measures.**

*explanation:* Silent upload failures mean users do not reach their intended outcome—a successful file transfer—yet the system is technically available and no SLA threshold is breached. This is precisely the gap outcome-based metrics address: they detect goal-attainment failures that technical indicators miss entirely. Attributing it to a monitoring gap or a UX-only concern misclassifies what kind of measurement is absent.

### 237. AISM-I · D6 · task 6.2 · `dc1075fb`

> Explain experience-focused measurement - measuring the outcome and satisfaction a user actually gets, not only technical service levels.

**Which description most accurately characterizes experience-focused measurement in IT service management?**

- a) Measuring service quality solely through periodic satisfaction surveys conducted after major incidents or changes.
- **`KEY` b) Assessing whether users achieved their goals and how the service felt from their perspective, complementing technical SLA data.**
- c) Replacing technical SLA metrics with qualitative user research owned by product and UX teams rather than service management.
- d) Extending existing SLA thresholds with tighter uptime and latency targets so technical performance better approximates experience.

*explanation:* Experience-focused measurement captures two user-side dimensions: goal attainment (did the user succeed?) and perceived quality (how did it feel?). These complement, not replace, technical SLAs. Periodic surveys alone are insufficient because they miss continuous outcome data, and tightening technical thresholds does not add the user-perspective dimension that experience measurement requires.

### 238. AISM-I · D6 · task 6.3 · `636ac5f4`

> Given a described service situation, determine an action that would improve the user's experience.

**A customer-service AI routes 95% of contacts correctly, but wheelchair users report the voice-only escalation path leaves them without a text alternative. What should the team do?**

- **`KEY` a) Add a text-based escalation channel, directly removing the barrier that currently causes complete service failure for this segment.**
- b) Improve routing accuracy toward 100% so fewer users ever reach the escalation path, reducing exposure to the access gap.
- c) Shorten average hold time on the voice channel so that users who cannot complete the interaction experience less total friction.
- d) Deprioritize the change because aggregate satisfaction scores across all users remain high, indicating overall system performance is acceptable.

*explanation:* The friction is an access barrier causing complete service failure for a specific segment; the fix must remove that barrier by providing a text alternative. Improving routing accuracy reduces how often escalation is needed but does not help users who do reach it, leaving the barrier intact. Aggregate satisfaction scores mask severe minority-segment failures, making them an inappropriate basis for deprioritization. Shortening hold time reduces wait duration but does not address the inaccessibility of a voice-only path for users who cannot use voice.

### 239. AISM-I · D6 · task 6.5 · `0dc07f28`

> Given an AI service with low or miscalibrated trust, determine what would build appropriate trust and adoption.

**An HR recruitment AI tells candidates it is AI-powered before each session. Users still report confusion about when its assessments are final. What additional transparency action is needed?**

- a) Add a technical explanation of the screening model so candidates understand the algorithm and trust its objectivity.
- b) Provide no further disclosure, because informing users of AI involvement at session start fully satisfies transparency obligations.
- **`KEY` c) Disclose at each decision point whether the assessment is AI-generated and whether a human will review it.**
- d) Increase displayed confidence on assessments to reduce candidate uncertainty about result reliability.

*explanation:* A single upfront AI disclosure does not help users calibrate trust at each decision point; contextual transparency about what the output is and who reviews it lets candidates act appropriately. A technical model explanation addresses developer understanding, not candidate-facing trust calibration.

### 240. AISM-I · D6 · task 6.7 · `9b3e9bc2`

> Explain the compute and energy footprint of AI services and why it is a service-management concern.

**Quantization reduces a model's size by 75% with only a 1% accuracy drop on the target task. Why does this support treating compression as a service-quality lever?**

- a) It confirms compression should be avoided, since even a 1% accuracy drop is unacceptable in production services.
- b) The one-time compression effort permanently resolves efficiency concerns without further monitoring as traffic grows.
- c) A smaller model file reduces storage costs, which is the primary service-management benefit of quantization.
- **`KEY` d) The efficiency gains improve scalability and sustainability while the accuracy trade-off stays within acceptable service bounds.**

*explanation:* When compression delivers large efficiency gains for a small, acceptable accuracy trade-off, it improves scalability and reduces environmental cost — both service-management concerns. The belief that compression always degrades quality to unacceptable levels ignores the routine success of techniques like quantization in production AI services. Framing compression as a storage-cost measure or a permanent fix also misrepresents its role.

---

# ISMS-F — ISO/IEC 27001:2022 Foundation - AI

**Source this certification cites:** ISO/IEC 27001:2022 (and Amd 1:2024).

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 241. ISMS-F · D1 · task 1.1 · `81c06da6`

> Define confidentiality, integrity and availability, and the supporting properties.

**Non-repudiation is best classified as which type of information security property?**

- a) A core CIA triad property, alongside confidentiality, integrity and availability
- b) An alternative name for accountability, since both prevent denial of actions
- **`KEY` c) A supporting property that complements the CIA triad but is not a core component**
- d) A subset of confidentiality, since proving origin depends on keeping sender identity secret

*explanation:* Non-repudiation is a supporting property that complements the CIA triad; it is not a core triad member. Although non-repudiation and accountability are related, they are distinct properties and the two terms are not interchangeable. Non-repudiation is also not a subset of confidentiality; it concerns proof of origin and action, not secrecy of identity.

### 242. ISMS-F · D1 · task 1.2 · `ce5ccc6d`

> Distinguish asset, threat, vulnerability, risk and control and explain how they relate.

**A backup restoration procedure is dismissed as 'not a real security control' because it does not block ransomware. Which concept does this misunderstand?**

- a) Asset, because backup media has lower value than production systems and falls outside asset scope.
- b) Vulnerability, because recovery procedures expose additional weaknesses rather than addressing existing ones.
- **`KEY` c) Security control, because controls include corrective and recovery measures, not only preventive ones.**
- d) Threat, because ransomware is a technical failure rather than an intentional act and is not a valid threat.

*explanation:* A security control is any measure that modifies risk, encompassing preventive, detective, corrective, and recovery types. Restricting controls to only those that block threats is a common misconception. Ransomware is a valid threat regardless of classification as human or technical in origin, and backup media is a recognised information asset.

### 243. ISMS-F · D1 · task 1.2 · `04b58ba5`

> Distinguish asset, threat, vulnerability, risk and control and explain how they relate.

**An unpatched OS has no known attacker targeting it. Which statement correctly describes the risk situation?**

- **`KEY` a) Risk exists because a plausible threat exploiting this vulnerability against the asset remains possible.**
- b) Risk exists only if patch cost exceeds the asset's monetary replacement value.
- c) Risk is absent because no active attacker is currently exploiting the vulnerability.
- d) Risk exists because a vulnerability alone, without any threat, is sufficient to constitute risk.

*explanation:* Risk arises from the combination of a plausible threat and a vulnerability affecting an asset — a confirmed or active attacker is not required. A vulnerability alone does not constitute risk; a threat must also be plausible. Asset monetary cost is irrelevant to whether risk exists. Absence of a current attacker does not eliminate the threat.

### 244. ISMS-F · D1 · task 1.4 · `71ac7a0a`

> Recognize the core members of the ISO/IEC 27000 family and what each does.

**Which document would an auditor cite when assessing conformance to mandatory 'shall' clauses in an ISMS audit?**

- a) ISO/IEC 27000, because its term definitions give legal meaning to conformance language across the family.
- b) ISO/IEC 27005, because it contains the risk-related 'shall' clauses underpinning ISMS conformance.
- **`KEY` c) ISO/IEC 27001, because it is the certifiable standard containing mandatory ISMS requirements.**
- d) ISO/IEC 27002, because its 93 controls are the mandatory requirements against which nonconformities are raised.

*explanation:* ISO/IEC 27001 is the certifiable requirements standard; its 'shall' clauses are what auditors assess conformance against. ISO/IEC 27002 provides guidance, not mandatory requirements, so nonconformities are not raised against it. ISO/IEC 27005 is a risk guidance document, not an audit criterion. ISO/IEC 27000 is a vocabulary document with no conformance clauses.

### 245. ISMS-F · D1 · task 1.5 · `a00180f6`

> Explain how AI systems change the information security attack surface.

**An organization's legal team pastes internal contract clauses into a cloud AI assistant. The provider states it does not store prompts after the session. Which statement best explains the information security implication?**

- a) The concern only arises if prompts contain personal data; business contract language can be shared without restriction.
- b) Encrypting the API connection satisfies confidentiality requirements because contract clauses are protected from third parties during transmission.
- c) No classification obligation applies because the provider's no-storage policy means information never persists outside organizational control.
- **`KEY` d) Prompt content carries the classification of the underlying information and crosses the inference boundary regardless of provider retention policy.**

*explanation:* Prompt content inherits the classification of the information it contains and crosses the inference boundary the moment it is submitted, creating exposure irrespective of provider retention policy. The no-storage claim addresses persistence, not the moment of transmission, and classification obligations are not limited to personal data.

### 246. ISMS-F · D1 · task 1.6 · `e6a4c241`

> Distinguish model-level risks from agentic risks.

**A deployed AI system receives a user prompt, generates a response, and returns it. No tools are called and no state is retained between requests. Which risk category does this deployment primarily represent?**

- a) Agentic risk, because the model's capability level determines blast radius regardless of autonomy.
- **`KEY` b) Model-level risk, because harm is bounded by the content of a single inference cycle.**
- c) Model-level risk only if output filtering is applied; without it the deployment becomes agentic risk.
- d) Agentic risk, because any system that interacts with users can plan responses across turns.

*explanation:* A stateless, tool-free system is the defining case of model-level risk: potential harm is limited to the content of a single inference. The deployment has no planning loop, memory, or external actions, so agentic risk categories do not apply. Output filtering is a control, not a property that changes the risk category itself.

### 247. ISMS-F · D2 · task 2.2 · `1b1f5e01`

> Explain clause 4 - internal and external issues, and interested parties.

**A logistics firm maps all applicable data-protection and transport-safety regulations and declares its external context analysis complete. Which misconception does this illustrate?**

- a) That external context is a one-time activity, so the firm will not revisit it when market conditions change.
- **`KEY` b) That external issues are synonymous with legal obligations, overlooking competitive, technological, and socio-economic factors.**
- c) That all external issues must be resolved before the ISMS scope can be formally approved.
- d) That interested parties are limited to regulators, ignoring customers and industry bodies as sources of requirements.

*explanation:* Reading external context as compliance obligations alone is what makes the consultant's reasoning wrong: a pressure can sit outside the organization and bear on the ISMS without being a legal duty, and treating the two as the same leaves those unexamined. ISO/IEC 27001 clause 4.1 requires the organization to determine the external and internal issues relevant to its purpose and affecting the intended outcomes of the ISMS. It names no categories, so the question is never whether a factor appears on a list but whether it sits outside the organization and bears on those outcomes.

### 248. ISMS-F · D2 · task 2.2 · `1672054c`

> Explain clause 4 - internal and external issues, and interested parties.

**Why does ISO/IEC 27001 require an organization to determine its context BEFORE defining the ISMS scope?**

- a) Because context analysis resolves all identified issues, and only then can a scope statement be produced.
- b) Because regulators require the context document before accepting a scope statement as legally valid.
- c) Because the scope must cover the entire organization, and context confirms no business unit can be excluded.
- **`KEY` d) Because internal and external issues and interested-party requirements shape the boundaries the scope must reflect.**

*explanation:* The scope must fit the organization's actual situation, so internal and external issues and interested-party requirements must be understood first — they define what the ISMS needs to protect and why. Requiring scope to cover the entire organization is a common misconception; a narrower, well-justified boundary is permitted. Context analysis identifies issues; it does not require their elimination before scoping. Regulatory pre-submission of a context document is not a standard requirement.

### 249. ISMS-F · D2 · task 2.3 · `e7d7e400`

> Explain the climate-change consideration introduced by Amendment 1:2024.

**An organization concludes climate change has no bearing on its ISMS context. Under Amendment 1:2024, what must it do?**

- a) Take no further action, since a non-relevant issue requires no documentation under the standard
- b) Complete a full climate risk assessment before recording any conclusion, even a negative one
- **`KEY` c) Document the non-relevance determination, as recording that conclusion is a standing requirement**
- d) Document non-relevance only if a certification auditor explicitly requests evidence during audit

*explanation:* The amendment requires that the relevance determination—including a conclusion of non-relevance—be documented. Simply ignoring the issue is not permitted, and the obligation is standing, not triggered by an auditor request. A full risk assessment is not required before recording a non-relevance conclusion.

### 250. ISMS-F · D2 · task 2.5 · `1b2820de`

> Analyze how a scope boundary is challenged when SaaS AI tools cross system and organizational lines.

**A company's ISMS scope covers 'all managed endpoints and on-premises servers used to process customer data.' Employees paste customer records into a browser-based AI tool using personal credentials. Why has the scope boundary failed?**

- a) The boundary holds because browser-only access leaves the managed endpoint perimeter intact and unmodified.
- b) The boundary holds because personal credentials place the activity outside the organization's ISMS jurisdiction.
- c) The boundary holds because the AI vendor's ISO 27001 certification automatically covers the subscribing organization's data.
- **`KEY` d) Customer data is processed on infrastructure the organization does not control, so the scope no longer reflects where processing occurs.**

*explanation:* A scope statement fails when the documented boundary no longer describes where organizational information is actually processed. Once customer data flows to third-party SaaS infrastructure, the scope—written for managed endpoints and on-premises servers—no longer captures that processing. Browser-only access does not prevent scope failure; the destination of the data, not the access method, determines whether the boundary holds. A vendor's own certification covers the vendor's ISMS only, not the subscribing organization's data or processes.

### 251. ISMS-F · D2 · task 2.6 · `7fd48dc2`

> Explain clause 5 - leadership, commitment, and the information security policy.

**An organization's information security policy is signed by the CEO and posted on the intranet. Under ISO/IEC 27001 clause 5.2, which statement is correct?**

- a) Intranet posting satisfies the communication requirement because all staff can access the document
- b) The policy must be disclosed publicly because clause 5.2 mandates external communication to all interested parties
- c) The CEO's signature is sufficient evidence that clause 5.1 leadership commitment is fully met
- **`KEY` d) The policy must be communicated so relevant persons understand it, not merely have access to it**

*explanation:* Clause 5.2 requires the policy to be available to interested parties as appropriate and communicated within the organization; the standard distinguishes availability from genuine understanding. A signature evidences approval, not ongoing commitment, and public external disclosure is not mandated — it is left to organizational discretion.

### 252. ISMS-F · D2 · task 2.8 · `d44a052d`

> Apply policy reasoning to determine what an acceptable AI use provision must address.

**A marketing employee uses a free, browser-based AI writing tool not in the approved software catalogue. The policy covers sanctioned tools only. What should the policy owner do?**

- **`KEY` a) Add a provision prohibiting any AI tool not on the approved catalogue, regardless of cost or delivery model.**
- b) Limit any new provision to technical staff, since non-technical employees rarely adopt AI tools independently.
- c) Exclude browser-based free tools from scope, as they fall outside IT governance jurisdiction.
- d) Clarify that employees must infer unsanctioned tools are prohibited; no policy change is needed.

*explanation:* An acceptable use policy must explicitly address unsanctioned tools; assuming employees infer prohibition without a stated rule creates an unenforceable gap. Browser-based and free tools carry data-handling risks and are not exempt from governance. Restricting scope to technical roles ignores the reality that AI writing tools are widely adopted by non-technical staff.

### 253. ISMS-F · D2 · task 2.9 · `db3fb179`

> Explain continual improvement and the plan-do-check-act model as the ISMS operating rhythm.

**In the PDCA cycle applied to an ISMS, which phase-to-activity match is correct?**

- **`KEY` a) Act — revising objectives or reallocating resources based on management review outputs.**
- b) Plan — conducting risk assessments only after a major structural change, not on a schedule.
- c) Check — issuing corrective actions and updating policies to close audit gaps.
- d) Act — taking disciplinary measures against staff who caused security incidents.

*explanation:* The Act phase uses evaluation results to adjust the system—revising objectives, changing processes, or reallocating resources—before the next Plan phase begins. Taking disciplinary action against individuals confuses personnel management with system improvement. Issuing corrective actions belongs to Act, not Check. Scheduled risk assessment is a Plan-phase activity, not an event-triggered one.

### 254. ISMS-F · D3 · task 3.1 · `99cc4324`

> Explain the risk assessment process - identification, analysis and evaluation.

**What distinguishes risk evaluation from risk analysis in the ISO/IEC 27001 risk assessment process?**

- a) Risk evaluation is performed by senior management; risk analysis is delegated to technical security staff.
- b) Risk evaluation ranks risks by relative severity; risk analysis compares them to acceptance criteria.
- c) Risk evaluation calculates likelihood and impact; risk analysis interprets those scores for management.
- **`KEY` d) Risk evaluation compares risk levels to the organization's criteria; risk analysis determines each risk's level.**

*explanation:* Risk analysis determines the nature and level of a risk; risk evaluation then compares those levels against the organization's predefined risk criteria to decide significance and priority. Ranking risks against each other without reference to acceptance criteria is a common misconception about what evaluation produces.

### 255. ISMS-F · D3 · task 3.11 · `f2ad29c7`

> Analyze why a conventional risk assessment can return a clean result for an estate with unmanaged AI exposure.

**A CISO reviews two consecutive risk assessments, both returning no critical findings. She knows AI tool adoption has grown significantly between the two cycles. What should she conclude about the second assessment's clean result?**

- a) A clean result from a repeated methodology is more reliable than one from a novel method.
- b) New AI tools will surface as findings in a subsequent cycle without any deliberate register update.
- **`KEY` c) The clean result is credible only if the asset register was updated to reflect current AI tool adoption.**
- d) Two consecutive clean results provide stronger evidence of a secure posture than a single clean result.

*explanation:* A clean result is meaningful only if the assessment scope actually covers the asset population. Given known growth in AI adoption, the CISO must confirm the register was updated before treating the finding as genuine assurance. Repeated cycles do not self-correct register gaps, and consistency across cycles can simply mean the same blind spot persisted.

### 256. ISMS-F · D3 · task 3.3 · `74123396`

> Apply risk identification to a described situation to name the asset, threat and vulnerability.

**A colleague argues that reputation cannot be an asset because it is intangible. In a risk involving reputational damage from a data breach, what should the auditor record as the asset?**

- a) IT systems involved, since only technical assets qualify for risk assessment
- **`KEY` b) Organisational reputation, as intangible items of value are valid assets under ISO 27001**
- c) The data breach event, as it directly causes the organisational harm
- d) Personal data of affected individuals, as regulatory liability is the primary concern

*explanation:* ISO 27001 recognises intangible items — including reputation, brand, and information — as assets whenever they have value to the organisation. Restricting assets to physical or technical items is a common misconception that leads to incomplete risk identification.

### 257. ISMS-F · D3 · task 3.4 · `828a838c`

> List the four risk treatment options.

**An organisation purchases a cyber-insurance policy to offset potential financial losses from a data breach. Which risk treatment option does this represent?**

- **`KEY` a) Share risk: the financial consequence of the risk is transferred to the insurer**
- b) Retain risk: paying a premium is an explicit acceptance of the underlying risk
- c) Modify risk: insurance reduces financial impact, changing the consequence of the risk
- d) Avoid risk: transferring financial exposure removes the need to manage the risk

*explanation:* Purchasing insurance transfers or shares the financial consequence of a risk with another party, making it risk sharing. Risk modification requires applying controls that change the likelihood or consequence of the risk itself, not merely compensating for losses after the fact.

### 258. ISMS-F · D3 · task 3.4 · `627551a3`

> List the four risk treatment options.

**An organisation patches a vulnerable server to reduce the likelihood of exploitation. Which risk treatment option does this represent?**

- a) Avoid risk: the activity generating the risk is discontinued by decommissioning the server
- **`KEY` b) Modify risk: a control is applied to change the likelihood or consequence of the risk**
- c) Share risk: responsibility for the vulnerability is transferred to the patch vendor
- d) Retain risk: the risk is accepted because patching brings it within tolerance

*explanation:* Applying a control that reduces likelihood or consequence is the definition of modifying risk. Patching does not cease the activity (avoidance) nor transfer responsibility to another party (sharing), nor does it represent a formal decision to accept the risk (retention).

### 259. ISMS-F · D3 · task 3.5 · `1d831197`

> Explain the purpose and required content of the Statement of Applicability.

**How does the SoA differ from the risk treatment plan, and why must both exist?**

- **`KEY` a) The risk treatment plan records actions and owners; the SoA records control necessity, justification, and implementation status.**
- b) The SoA is the external-facing summary of the risk treatment plan, omitting sensitive risk details for auditor review.
- c) They are functionally identical; the standard permits either document to satisfy both requirements.
- d) The risk treatment plan covers accepted risks; the SoA covers mitigated risks, so together they address the full register.

*explanation:* The risk treatment plan documents what actions will be taken, by whom, and by when. The SoA documents which controls are necessary and justifies every inclusion and exclusion. They serve distinct purposes and neither can substitute for the other under ISO/IEC 27001.

### 260. ISMS-F · D3 · task 3.6 · `18693360`

> Explain why Annex A is a set of reference controls, not a checklist to be copied into the SoA.

**Two organisations produce identical risk registers from independent assessments. What should be expected about their Annex A control selections?**

- a) Identical selections, because ISO 19011 audit guidelines require the same documented control justifications wherever risks are equivalent.
- b) Identical selections, because control choice is fully deterministic once the risk profile is established and documented.
- c) All 93 controls selected by both, because comprehensive coverage is required to ensure no identified risk remains unaddressed.
- **`KEY` d) Likely different selections, because context, existing safeguards, and risk appetite also shape each organisation's treatment choices.**

*explanation:* Risk treatment is not deterministic: even with identical risks, organisations differ in context, existing controls, risk appetite, and resources, producing legitimately different control selections. Control selection is driven by treatment needs, not by a formula that maps a risk profile to a fixed control set.

### 261. ISMS-F · D3 · task 3.9 · `3129b930`

> Explain how prompt and context data leaving the organization constitutes an information security risk.

**A user closes and deletes a chat session with an external AI provider immediately after use. Which assumption about provider retention is incorrect?**

- a) The organisation's data classification obligations persist even after the user-side session record is removed.
- **`KEY` b) Deleting the session on the user side terminates the provider's retention of those prompts at the same moment.**
- c) Closing the session on the user side removes the user's local record but leaves the provider's server-side copy unaffected.
- d) The inference boundary was crossed at the moment the first prompt was submitted, not when the session was closed or deleted.

*explanation:* Provider retention is governed by the provider's own policies and legal obligations, not by user-side deletion actions. Closing or deleting a chat session removes the user's local copy but does not compel the provider to purge its server-side records simultaneously. The remaining options correctly reflect how retention and the inference boundary operate: the provider's copy persists independently, the inference boundary is crossed at first submission, and classification obligations survive user-side deletion.

### 262. ISMS-F · D3 · task 3.9 · `cc13db12`

> Explain how prompt and context data leaving the organization constitutes an information security risk.

**A team lead argues that routing AI prompts through the organisation's enterprise API—rather than the provider's public web interface—means sensitive data never reaches the provider's infrastructure. Which concept does this reasoning misapply?**

- **`KEY` a) The inference boundary: enterprise API calls still deliver prompt data to the provider's model infrastructure regardless of which interface is used.**
- b) Provider retention: enterprise API agreements always prohibit the provider from storing any prompt data, unlike public interface sessions.
- c) Classification survival: using an enterprise API strips classification markings before transmission, reducing the sensitivity of disclosed content.
- d) Prompt data egress: egress is defined by the network path taken, so a private API route keeps data within the organisational boundary.

*explanation:* The inference boundary is crossed whenever data enters the model provider's processing environment. An enterprise API is a different access channel to the same provider infrastructure; the prompt still reaches and is processed by the provider's systems. The route of transmission does not determine whether the boundary is crossed. The remaining options describe misconceptions: egress is not defined by network path alone, API agreements do not universally prohibit retention, and API use does not strip classification markings.

### 263. ISMS-F · D4 · task 4.11 · `82b3a221`

> Explain the physical controls theme, and why AI does not materially change it.

**ISO 27001 Annex A labels its physical controls as 'unchanged by AI.' What does this designation most accurately mean?**

- a) The controls carry lower priority; the label signals they predate AI and have not been updated for current threats.
- b) The controls are exempt from AI-related risk assessments; AI has no bearing on physical security considerations.
- **`KEY` c) The core requirements remain valid without AI-specific modification, even where AI systems operate in the protected environment.**
- d) The controls apply only to non-AI systems; organizations deploying AI must substitute AI-specific physical security frameworks instead.

*explanation:* 'Unchanged by AI' means the fundamental requirement is unaltered — not that the control is obsolete or irrelevant to AI environments. Physical controls still protect premises where AI systems operate; they simply require no new AI-specific clauses. Treating the label as a signal of lower importance, an exemption from risk review, or a reason to substitute alternative frameworks all misread its purpose.

### 264. ISMS-F · D4 · task 4.11 · `f23cb9f6`

> Explain the physical controls theme, and why AI does not materially change it.

**Which statement most accurately describes what the clear desk and clear screen controls govern within an ISO 27001 ISMS?**

- a) They are housekeeping guidelines that encourage tidiness but carry no formal compliance requirement within an ISMS.
- **`KEY` b) They are formal controls requiring that unattended workspaces and screens do not expose sensitive information to unauthorized viewing.**
- c) They form a single unified control, so locking a screen automatically satisfies the clear desk requirement as well.
- d) They apply only to shared workstations; single-user private offices are exempt because unauthorized viewing risk is negligible.

*explanation:* Clear desk and clear screen are defined ISO 27001 controls with specific compliance obligations, not optional tidiness suggestions. They apply regardless of whether a workstation is shared or private. They are also distinct controls—locking a screen does not address physical documents or removable media left on the desk.

### 265. ISMS-F · D4 · task 4.13 · `8fe368f3`

> Apply information-classification reasoning to content a user is about to enter into an AI tool.

**A staff member wants to paste a paragraph from a CONFIDENTIAL document into a public AI chatbot. The organisation prohibits sharing CONFIDENTIAL information with external parties. What should the staff member do?**

- a) Proceed, because retyping content into a new location creates a fresh, unclassified instance of that information.
- b) Proceed with only a portion, because partial information does not constitute a full disclosure of classified content.
- c) Proceed and delete the chat history, because removing the output eliminates any disclosure of classified content.
- **`KEY` d) Refrain, because the CONFIDENTIAL classification travels with the information regardless of how it is transferred.**

*explanation:* Classification is a property of the information itself, not its container or transfer method. Pasting CONFIDENTIAL content into an external tool is still a disclosure to an external party and violates handling rules. Deleting the conversation does not undo the disclosure, and partial entry still exposes classified information.

### 266. ISMS-F · D4 · task 4.13 · `2068e991`

> Apply information-classification reasoning to content a user is about to enter into an AI tool.

**An employee plans to retype key facts from a CONFIDENTIAL project plan into a public AI writing assistant to improve phrasing. The original file is not attached. Under standard classification handling rules, what should the employee do?**

- **`KEY` a) Stop and use an approved internal tool, because the CONFIDENTIAL classification attaches to the information, not the file format.**
- b) Proceed, because paraphrasing removes the classification obligation since the original wording is not reproduced.
- c) Proceed, because the information already exists inside the organisation, so re-entering it externally is not a new disclosure.
- d) Proceed, because classification applies to the stored document, not to information retyped during a work task.

*explanation:* Classification attaches to the information itself, not to a physical file or its exact wording. Retyping or paraphrasing CONFIDENTIAL content into an external AI tool crosses the disclosure boundary just as attaching the document would. The employee must use an approved internal tool or obtain explicit authorisation. The misconception that paraphrasing strips classification is wrong, as is the belief that internal existence makes external entry risk-free, and the belief that classification only governs stored documents rather than information in any form.

### 267. ISMS-F · D4 · task 4.13 · `83be4808`

> Apply information-classification reasoning to content a user is about to enter into an AI tool.

**A manager finds the AI tool they want to use is not mentioned in the acceptable-use policy. They conclude this is a grey area and enter RESTRICTED project data. Which statement is correct?**

- **`KEY` a) Their conclusion is incorrect; RESTRICTED handling rules prohibit external disclosure regardless of whether a tool is named in policy.**
- b) Their conclusion is correct; classification rules apply only to tools explicitly listed as prohibited in the acceptable-use policy.
- c) Their conclusion is correct; omission from the policy list means the tool is neither approved nor prohibited for classified content.
- d) Their conclusion is incorrect; unlisted tools are automatically prohibited for all data, not just classified content.

*explanation:* Handling rules for a classification level govern the information at all times; a tool's absence from a policy list does not create permission to use it with classified content. The RESTRICTED label itself prohibits external disclosure, making this a clear violation rather than a grey area. The view that unlisted tools are blanket-prohibited for all data is an overgeneralisation that misses the specific classification-based obligation at issue.

### 268. ISMS-F · D4 · task 4.2 · `e980dcd0`

> Explain control attributes and how they support selection and reporting.

**An organization wants to filter all Annex A controls that address confidentiality. Which attribute enables this?**

- a) Control domain, because Annex A clause groupings separate controls by CIA property.
- **`KEY` b) Security property, because it tags each control with the CIA property or properties it serves.**
- c) Operational capability, because it groups controls by the functional security area they belong to.
- d) Control type, because preventive controls are specifically linked to confidentiality protection.

*explanation:* The security property attribute tags each control with the CIA property or properties it serves, making a confidentiality filter possible. Operational capability groups controls by functional area, not CIA property. Control type classifies controls as preventive, detective, or corrective — unrelated to CIA filtering. Annex A clause groupings do not align with CIA properties.

### 269. ISMS-F · D4 · task 4.3 · `cfcad8d9`

> Explain the purpose of the organizational controls theme.

**An organization's acceptable use policy covers only permanent employees. A contractor with full system access is not covered. Which misconception does this reflect?**

- a) That asset ownership determines scope, so only employees who own assets are bound by acceptable use obligations.
- b) That segregation of duties already controls contractor behavior, so a separate acceptable use obligation is unnecessary.
- c) That information classification governs access rights, making acceptable use policies redundant for non-employees.
- **`KEY` d) That acceptable use policies need not cover contractors or third parties who access organizational assets.**

*explanation:* Acceptable use policies must extend to all individuals who access organizational assets, including contractors and third parties. Limiting scope to permanent employees leaves external users without defined obligations, creating a significant governance gap recognized within the organizational controls theme.

### 270. ISMS-F · D4 · task 4.5 · `482ffb2f`

> Apply least-privilege and identity-lifecycle reasoning to a described access arrangement.

**During an access review, a manager approves all existing rights for her team without checking whether each right is still needed. What risk does this create?**

- a) Reduced risk, because the manager's sign-off transfers accountability for those rights away from IT.
- b) No additional risk; a completed approval makes permissions valid until the next scheduled cycle.
- **`KEY` c) Accumulated excessive privilege, because rights that no longer match current roles remain active.**
- d) Audit non-compliance only; the access rights themselves are unchanged so the underlying risk is unaffected.

*explanation:* A rubber-stamp review perpetuates privilege creep — rights accumulate beyond what roles require. Completed approval does not make permissions valid indefinitely; it only confirms they were reviewed at a point in time. The review creates an audit record but does not eliminate the underlying risk of excessive access. Business managers retain accountability for the access they approve and cannot transfer it to IT through sign-off.

### 271. ISMS-F · D4 · task 4.5 · `b0951f0e`

> Apply least-privilege and identity-lifecycle reasoning to a described access arrangement.

**A developer is granted database administrator rights for a two-week migration project. The project ends. What should happen to those rights?**

- **`KEY` a) Revoke them immediately and restore only the access the developer's permanent role requires.**
- b) Retain them until the next scheduled access review confirms they are no longer needed.
- c) Keep them active but require MFA per session, which satisfies privileged-access controls.
- d) Downgrade to read-only database access, since read-only satisfies least privilege for any role.

*explanation:* Least privilege requires that elevated access granted for a specific, time-limited purpose be revoked as soon as that purpose ends. Waiting for the next scheduled review leaves unnecessary privilege active and creates an unacceptable risk window. Downgrading to read-only is not automatically correct because the developer's permanent role may require no database access at all. Adding MFA reduces authentication risk but does not reduce the scope of rights granted.

### 272. ISMS-F · D4 · task 4.9 · `52b74d58`

> Explain the people controls theme - screening, terms, awareness, disciplinary process.

**An employee is promoted to a role with access to highly classified systems. What is the primary purpose of repeating screening at this point?**

- a) Screening depth is fixed by regulation and does not vary with role sensitivity.
- b) The person is already trusted, so prior screening remains fully adequate.
- c) Maximum screening must apply to every employee at every stage for consistency.
- **`KEY` d) Risk changes with the new role, so prior checks may no longer be sufficient.**

*explanation:* Screening is proportionate to the role and the assets the person will access. When either changes significantly, a reassessment is warranted because the risk profile has shifted. The idea that a one-time hiring check remains sufficient after a role change ignores the risk-based nature of screening. Applying maximum screening to everyone regardless of role confuses consistency with proportionality.

### 273. ISMS-F · D4 · task 4.9 · `c5fed66e`

> Explain the people controls theme - screening, terms, awareness, disciplinary process.

**Who should be involved in defining the disciplinary process for security policy violations?**

- a) Legal counsel alone, because disciplinary outcomes carry liability implications.
- **`KEY` b) Information security management and HR together, to define thresholds and apply employment law.**
- c) Senior management alone, because only executives can impose consequences on employees.
- d) HR alone, because disciplinary matters fall outside the security function's remit.

*explanation:* Defining what constitutes a security violation and how severe it is requires information security input; HR then applies the process within employment law. Treating the disciplinary process as a purely HR, legal, or executive function means security thresholds and triggers may be defined without the necessary technical and risk context.

### 274. ISMS-F · D5 · task 5.3 · `229609f9`

> Explain management review - its required inputs and its outputs.

**An ISMS manager argues that management review can be skipped because monthly internal audits already provide sufficient oversight. Which concept does this reasoning misunderstand?**

- **`KEY` a) Management review is a distinct top-management decision-making event that internal audit cannot replace.**
- b) Internal audits assess technical controls only, so they cannot evaluate the management system as a whole.
- c) Audit findings must be formally presented at a management review before any corrective action can begin.
- d) Frequent audits increase review workload, so more audits make management review harder to skip, not easier.

*explanation:* Internal audit and management review serve distinct purposes. Audit assesses conformance with requirements, while management review is a top-management decision-making event requiring specific inputs — such as changes in context, stakeholder feedback, and performance trends — and must produce committed decisions on improvement, resources, and ISMS changes. The claim that audits cover all required oversight confuses these two separate processes. Saying internal audits are limited to technical controls is also incorrect, as audits assess the whole management system, but that is not the core error in the scenario. Requiring audit findings to be presented before corrective action starts is not a standard requirement, and the idea that audit frequency affects the ability to skip review misunderstands both activities entirely.

### 275. ISMS-F · D5 · task 5.3 · `08073000`

> Explain management review - its required inputs and its outputs.

**How does ISO/IEC 27001 characterize the resource-related outputs required from a management review?**

- a) Corrective action assignments only; resource decisions belong to a separate financial process.
- b) Non-binding recommendations that budget holders may act on after the review.
- c) A log of resource requests submitted during the review period, approved or pending.
- **`KEY` d) Committed decisions on resource allocation made during the review itself.**

*explanation:* ISO/IEC 27001 expects resource-related review outputs to be actual decisions with committed actions, not advisory notes left for others to resolve later. Treating resource outputs as non-binding recommendations misunderstands the management review as a status briefing rather than a decision-making event.

### 276. ISMS-F · D5 · task 5.6 · `d77be46f`

> Distinguish certification from accreditation, and the roles of the certification body and accreditation body.

**What is the primary function of an accreditation body such as UKAS or DAkkS?**

- a) Audits organizations' ISMSs and issues ISO/IEC 27001 certificates on behalf of government
- **`KEY` b) Assesses and formally recognizes the competence of certification bodies**
- c) Certifies individual information security professionals under personnel schemes
- d) Publishes ISO/IEC 27001 and approves scope statements on individual certificates

*explanation:* An accreditation body evaluates whether a certification body is competent, impartial, and operating consistently — typically against ISO/IEC 17021-1 for management system certification. It does not itself certify organizations or publish standards.

### 277. ISMS-F · D5 · task 5.6 · `1ba40875`

> Distinguish certification from accreditation, and the roles of the certification body and accreditation body.

**Under what condition does an ISO/IEC 27001 certificate remain valid after the stage-2 audit?**

- a) As long as the accreditation body's own accreditation remains current, regardless of surveillance
- b) Until the next major revision of ISO/IEC 27001 is published, when all certificates lapse
- c) Indefinitely, unless the organization voluntarily notifies the certification body of withdrawal
- **`KEY` d) For a fixed certification cycle, subject to surveillance and recertification audits**

*explanation:* ISO/IEC 27001 certificates are issued for a defined certification cycle (typically three years) and require periodic surveillance audits and a recertification audit to remain valid. They do not continue indefinitely, nor do they lapse automatically when the standard is revised.

### 278. ISMS-F · D5 · task 5.7 · `eb32ef37`

> Apply incident-response reasoning to a described AI-related security incident.

**A post-incident review for a low-severity prompt injection event is complete. The team lead proposes sharing findings verbally at the next team meeting. What should happen instead?**

- a) Schedule the lessons-learned output for the next planned ISMS management review cycle rather than acting immediately.
- **`KEY` b) Formally document findings and feed them into the ISMS as inputs to control improvement or risk treatment updates.**
- c) Record the verbal discussion in meeting minutes and treat that as sufficient evidence for the next management review.
- d) Defer formal documentation until a major incident occurs, since low-severity events do not justify ISMS updates.

*explanation:* ISO/IEC 27001 requires lessons learned to be formally documented and used to improve the ISMS regardless of incident severity; minor events can reveal systemic weaknesses. Verbal sharing produces no auditable record, and deferring to a scheduled review delays necessary control improvements.

### 279. ISMS-F · D5 · task 5.7 · `19903f81`

> Apply incident-response reasoning to a described AI-related security incident.

**After containing a prompt injection attack on a customer-facing AI assistant and restoring service, what must the response team do next to satisfy the incident-response process?**

- a) Hold an informal verbal debrief, which satisfies requirements for low-severity events.
- **`KEY` b) Conduct a formal lessons-learned review and feed findings back into the ISMS.**
- c) Close the incident record, as containment and restoration confirm the threat is neutralised.
- d) Defer review until the next scheduled ISMS management review meeting.

*explanation:* Incident response does not end at restoration; ISO/IEC 27001 requires a formal post-incident review whose documented findings are fed back into the ISMS as improvements. Closing the record at restoration skips the lessons-learned phase entirely. An informal verbal debrief fails the documentation and ISMS-integration requirement. Deferring to a scheduled management review delays corrective action that should occur promptly after the incident.

### 280. ISMS-F · D5 · task 5.8 · `309bf077`

> Analyze why an AI-related incident may not surface through conventional monitoring.

**A security team reviews six months of SIEM logs after finding an AI pipeline was exfiltrating training data. No alerts fired during that period. Which analysis best explains the absence of alerts?**

- a) Behavioral baselines were never established, so the anomaly engine defaulted to passing all activity without scoring.
- b) API gateway logs were collected but stored in a separate silo the SIEM correlation engine never ingested.
- c) The SIEM would have flagged timing anomalies, but an unrelated maintenance window suppressed the alert queue.
- **`KEY` d) Exfiltration rode legitimate API calls within normal access patterns, so no log entry deviated from expected syntax or volume.**

*explanation:* When exfiltration rides legitimate API calls within normal access patterns, every log entry looks authorized—no syntactic deviation triggers a rule and no volume spike crosses a threshold. Blaming a suppressed alert queue, an unconfigured baseline, or a log-silo gap each assumes a detectable signal existed but was missed, which is the core misconception this item targets.

---

# ISMS-IA — ISO/IEC 27001:2022 Internal Auditor - AI

**Source this certification cites:** ISO/IEC 27001:2022 and ISO 19011:2026.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 281. ISMS-IA · D1 · task 1.1 · `d5f0b088`

> Distinguish first-party, second-party and third-party audits by purpose, criteria and who may conduct them - and distinguish the clause 9.2 internal audit requirement from the Annex A 5.35 independent review control.

**An ISMS manager proposes counting the certification body's annual surveillance visits as satisfying the Clause 9.2 internal audit requirement. Why is this incorrect?**

- a) Surveillance audits follow fixed three-year intervals, whereas Clause 9.2 requires audits at shorter, organization-defined intervals.
- **`KEY` b) Surveillance audits serve the certification body's conformity determination, not the organization's own internal assurance obligation under Clause 9.2.**
- c) ISO 19011 explicitly bars certification body auditors from conducting work that counts toward an internal audit programme.
- d) Surveillance audits cover only management system clauses and do not assess Annex A controls as Clause 9.2 requires.

*explanation:* A certification body's surveillance audit is conducted to support a certification decision under ISO/IEC 17021-1; it serves the certification body and the market. Clause 9.2 requires the organization itself to obtain internal assurance about its own ISMS — a purpose a third-party surveillance audit is not designed to fulfil. The claim that ISO 19011:2026 explicitly excludes certification body auditors from internal audit work is a false attribution — no such exclusion exists in that standard. The 'three-year interval' argument is also incorrect; Clause 9.2 specifies no numeric interval. The assertion that surveillance audits omit Annex A controls is equally unfounded as a general rule.

### 282. ISMS-IA · D1 · task 1.1 · `27c71ec8`

> Distinguish first-party, second-party and third-party audits by purpose, criteria and who may conduct them - and distinguish the clause 9.2 internal audit requirement from the Annex A 5.35 independent review control.

**A customer hires a consultancy to audit one of its suppliers on the customer's behalf. From the supplier's perspective, how is this audit classified under ISO 19011?**

- a) Third-party audit, because an external body independent of both parties performs the work.
- b) First-party audit, because the consultancy is not the customer and issues no certification.
- **`KEY` c) Second-party audit, because the consultancy acts on behalf of an interested party.**
- d) Third-party audit, because any consultancy involvement triggers the ISO/IEC 17021-1 framework.

*explanation:* ISO 19011:2026 Table 1 classifies an audit as second-party when it is conducted by a party with an interest in the auditee, or by another party acting on that interested party's behalf. Classification follows the commissioning party's relationship to the auditee, not who physically performs the work. A consultancy engaged by the customer therefore conducts a second-party audit. A third-party audit requires an independent auditing organization acting on its own authority, not as an agent of an interested party. The suggestion that consultancy involvement triggers ISO/IEC 17021-1 is a misconception; that standard governs certification bodies, not commissioned supplier audits.

### 283. ISMS-IA · D1 · task 1.2 · `bd13b898`

> Determine how an auditor resolves a situation where two ISO 19011 audit principles point in different directions.

**An internal auditor is the only person with the technical competence to audit a newly deployed cryptographic key-management system. She also designed part of its implementation. Which analysis best describes the conflict she faces?**

- a) Independence (4.6) overrides due professional care (4.4) because objectivity is the foundation of audit credibility, disqualifying her regardless of competence.
- **`KEY` b) Independence (4.6) and due professional care (4.4) both engage; neither automatically overrides the other, so the resolution requires weighing both under the specific circumstances.**
- c) Only independence (4.6) is engaged; due professional care (4.4) concerns execution quality and is not triggered by a conflict-of-interest situation.
- d) Due professional care (4.4) automatically resolves the conflict by requiring her to decline, because accepting without full independence violates that principle.

*explanation:* ISO 19011:2026 clause 4.6 calls for independence 'wherever practicable' and, where full independence is not possible, requires every effort to remove bias and encourage objectivity — it does not mandate automatic disqualification. Clause 4.4 simultaneously demands competent, reasoned judgement. Both principles are genuinely engaged, and clause 4.1 presents all principles as fundamental without ranking them, so the auditor must weigh both rather than apply a fixed rule. The view that independence always overrides is better than a throwaway position — objectivity is indeed foundational — but the standard's 'wherever practicable' language undercuts automatic disqualification, making the balanced-weighing answer stronger. The view that due professional care itself requires declining misreads clause 4.4 as a disqualification mechanism, which it is not. The view that clause 4.4 is not triggered at all ignores that the decision whether to accept the assignment is itself an exercise of professional judgement.

### 284. ISMS-IA · D1 · task 1.2 · `cc0731c2`

> Determine how an auditor resolves a situation where two ISO 19011 audit principles point in different directions.

**An internal auditor is the only person with the technical expertise to audit the cryptographic key-management process. She designed the key-rotation procedure currently in use. Time is short and the area carries high residual risk. Which reasoning best describes how she should resolve this conflict?**

- a) Both principles must be fully and simultaneously satisfied before the audit can proceed; ISO 19011 permits no partial trade-off between them, so structural separation must be achieved regardless of time pressure or residual risk.
- b) Independence prevails because ISO 19011 treats it as foundational; she must withdraw and leave the area unaudited, accepting the unmitigated residual risk until an external expert becomes available.
- **`KEY` c) Both principles are genuinely engaged and neither outranks the other in ISO 19011; a defensible resolution weighs the high residual risk, her unique competence, and every practicable bias-reduction measure she can apply, such as peer review of her conclusions.**
- d) Due professional care prevails automatically; when no qualified substitute can be found in time, her unique competence overrides the independence obligation and she may proceed without additional safeguards.

*explanation:* ISO 19011:2026 clause 4 presents all seven auditing principles as fundamental without ranking them; the standard contains no hierarchy placing independence above due professional care or vice versa. Clause 4.3 asks auditors to be independent wherever practicable and, where full independence is not achievable, to make every effort to remove bias and encourage objectivity. The reasoning that weighs both principles together and applies bias-reduction measures is better than the reasoning that due professional care prevails automatically, because treating competence as a trump card bypasses the bias-reduction obligation the standard imposes rather than satisfying it. The reasoning that independence alone prevails rests on a false hierarchy the standard does not state. The reasoning that both principles must be fully satisfied simultaneously misreads the standard, which acknowledges that full independence is not always practicable.

### 285. ISMS-IA · D1 · task 1.4 · `2492bee8`

> Identify the competence gaps in an audit team against a given audit's scope, including the technology competence a remote or hybrid audit demands.

**Midway through an ISMS internal audit, the team discovers that the cryptographic key-management process requires specialised knowledge no team member holds. The audit programme manager notes that team competence was validated against programme criteria before the audit began. What is the correct analysis?**

- a) The gap is closed by consulting ISO/IEC 27007 during the audit, because its ISMS-specific checklists supply the missing technical knowledge without requiring a separately competent auditor.
- b) The gap is acceptable because clause 7.2 requires competence validation at programme inception; a gap surfacing during execution does not invalidate that prior programme-level assessment.
- **`KEY` c) The gap must be treated as a limitation on conclusions for key management, because an unclosed competence gap constrains what the team can reliably establish, regardless of prior programme-level validation.**
- d) The gap affects only the lead auditor; procedures completed by other team members remain valid, and overall ISMS conclusions stand provided those procedures are finished without finding.

*explanation:* A competence gap that remains unclosed when the audit concludes becomes a limitation on the conclusions for the affected area; programme-level validation at inception does not remove a gap that surfaces in scope during execution. Treating prior validation as sufficient confuses the timing of competence assessment with its adequacy for the actual work performed — it is the better answer over the prior-validation position because the standard's competence requirement applies to the work being done, not only to the planning stage. The position that the gap affects only the lead auditor misunderstands how a team-level competence gap constrains collective conclusions. Consulting ISO/IEC 27007 guidance during the audit does not confer the knowledge and skills clause 7.2 requires; guidance documents supplement, they do not replace, auditor competence.

### 286. ISMS-IA · D2 · task 2.1 · `d69dc26e`

> Determine audit programme objectives from the organization's ISMS objectives, its information security risks, and the results of previous audits.

**An internal auditor is establishing next year's audit programme. The ISMS risk assessment has elevated cloud infrastructure to high risk. Last year's audit of that area found no nonconformities but recorded two observations and one improvement opportunity. A customer contract mandates annual assurance over data-residency controls. Which analysis most accurately identifies the inputs that should shape the programme's objectives?**

- a) The elevated risk profile is the primary input; the contractual requirement shapes only individual audits commissioned for that customer, and prior audit results inform follow-up scheduling rather than overall programme objectives.
- b) The elevated risk profile and contractual requirement apply, but the clean nonconformity record means cloud infrastructure warrants reduced programme attention, freeing capacity for higher-priority areas.
- c) The elevated risk profile and the contractual requirement are valid inputs; the previous audit's observations and improvement opportunity are excluded because clause 9.2.2 references only formal nonconformity reports as prior audit results.
- **`KEY` d) All three inputs apply: the elevated risk profile, the full prior audit results including observations and the improvement opportunity, and the contractual requirement — together they define what assurance the programme must provide across the cycle.**

*explanation:* ISO/IEC 27001 clause 9.2.2 requires the audit programme to consider the importance of the processes concerned and the results of previous audits. 'Results' encompasses the full audit output — observations and improvement opportunities — not only formal nonconformities. ISO 19011:2026 clause 5.2 identifies risk profile and interested-party requirements as programme-objective inputs, so the contractual data-residency mandate applies at programme level, not only when a customer-specific audit is commissioned. The option that excludes observations misreads clause 9.2.2. The option that treats a clean nonconformity record as grounds for reducing attention conflates absence of nonconformities with absence of risk — the elevated risk assessment contradicts that premise directly. The option that confines the contractual requirement to individual audit scope misreads ISO 19011:2026 clause 5.2, which places interested-party requirements at programme-objective level. All three alternatives are defensible positions a practitioner might hold, but only the option recognising all three inputs as programme-level inputs is fully consistent with both standards.

### 287. ISMS-IA · D2 · task 2.1 · `75fd2b0f`

> Determine audit programme objectives from the organization's ISMS objectives, its information security risks, and the results of previous audits.

**A financial services organization has two key customers whose contracts require annual third-party assurance over specific ISMS controls. The internal audit manager argues that clause 4.2 contractual requirements affect only individual audit scopes when a customer-commissioned audit is requested, and need not be reflected in programme-level objectives. Which analysis of her position is most accurate?**

- **`KEY` a) Her position is incorrect: clause 4.2 interested-party requirements are an explicit input to programme objectives under ISO 19011, so they must shape programme design, not only individual ad hoc audit scopes.**
- b) Her position is defensible: controls driven by clause 4.2 appear in the SoA, and the programme's general obligation to audit the ISMS already covers them, making a separate programme-level objective redundant.
- c) Her position is partially defensible: contractual requirements should inform programme objectives only in years a customer audit is due, since future contract renewals may shift which controls customers prioritise.
- d) Her position is incorrect only in that contractual requirements must appear as audit criteria in each individual audit; omitting a programme-level objective is not itself a nonconformity if criteria are correctly listed per audit.

*explanation:* ISO 19011:2026 identifies the needs and expectations of interested parties as a source from which programme objectives are derived; requirements established under clause 4.2 — including contractual obligations — therefore shape what the overall programme must achieve, not merely what a single commissioned audit covers. This is better than the SoA-coverage answer because including a control in the SoA does not automatically mean the programme is designed to provide the specific, recurring assurance the contract demands; control inclusion and assurance planning are distinct activities. The answer that limits contractual input to years when a customer audit is due is defensible as a risk-based prioritisation argument but is undercut by the annual nature of the contractual obligation, which makes every programme cycle relevant. The answer that relocates the obligation to individual audit criteria mistakes the relationship between programme objectives — what the cycle as a whole achieves — and audit criteria, which are the standards against which evidence in one audit is assessed.

### 288. ISMS-IA · D2 · task 2.2 · `eb4567bd`

> Determine risk-based frequency and priority across the areas within ISMS scope.

**An internal auditor is building the annual ISMS audit programme. Four in-scope processes exist: cloud infrastructure (high criticality, recent incidents), HR onboarding (medium criticality), physical access (low criticality, stable), and supplier management (high criticality, new relationships). Time allows only three audits this cycle. Which allocation best applies the risk-based approach in ISO 19011:2026 clause 5.2?**

- a) Audit the three processes with the greatest number of associated Annex A controls, because the risk-based approach means prioritising the operational risk-treatment layer over process criticality ratings assigned by management.
- **`KEY` b) Prioritise cloud infrastructure and supplier management; defer physical access to the next cycle with documented rationale, reflecting the programme's obligation to focus on matters most significant to the audit client.**
- c) Audit processes in ISO/IEC 27001 clause-number order across the three slots, because the standard's clause sequence reflects the logical priority hierarchy auditors are intended to follow when planning coverage.
- d) Combine physical access and HR onboarding into one audit slot so all four processes are touched this cycle, because leaving any in-scope process unaudited within a single cycle breaches the programme's coverage obligation.

*explanation:* ISO 19011:2026 clause 5.2 requires the audit programme to be planned so that audits focus on matters most significant to the audit client, with risk and criticality driving prioritisation across the cycle rather than demanding equal coverage within every cycle. Deferring the stable, low-criticality physical access process with documented rationale is the correct application of this principle. Combining physical access and HR onboarding to avoid any gap treats within-cycle coverage as an absolute obligation — a misconception the programme-cycle model refutes, since the programme as a whole (not each individual cycle) is the unit of coverage planning. Prioritising by Annex A control count conflates the organisation's risk-treatment layer with the audit programme's own risk assessment; these are distinct activities and the former does not govern the latter. Auditing by clause-number order imposes an arbitrary structural sequence. ISO/IEC 27001's Introduction explicitly states that clause order does not imply priority, and ISO 19011 does not endorse clause sequence as a substitute for risk-based programme planning.

### 289. ISMS-IA · D2 · task 2.2 · `4fa74813`

> Determine risk-based frequency and priority across the areas within ISMS scope.

**Midway through a two-year ISMS audit programme, the audit manager reviews programme performance. A supplier management audit was deprioritised in year one due to resource constraints and stable contracts. Since then, three new critical suppliers have been onboarded. Under ISO 19011:2026 clause 5.3, what does this situation most clearly indicate?**

- a) The organisation's information security risk assessment should be rerun to update the risk register, and the revised register should replace the existing year-two programme schedule to reflect the new supplier risk profile.
- b) A candidate might argue this constitutes a nonconformity against ISO/IEC 27001 clause 9.2.2, on the basis that a high-importance process was not audited in year one despite documented rationale — though the clause does not in fact mandate a fixed audit interval.
- c) The programme's risk and opportunity assessment remains valid because the original deprioritisation was documented and supplier management is still scheduled before the two-year cycle ends, satisfying the programme's planning requirements.
- **`KEY` d) A risk to the programme's own objectives has materialised — the changed supplier landscape is the kind of development clause 5.3 expects the programme manager to evaluate during the cycle, potentially warranting reprioritisation of the deferred audit.**

*explanation:* ISO 19011:2026 clause 5.3 requires the audit programme manager to identify and evaluate risks and opportunities that apply to the programme itself — distinct from the information security risks the ISMS manages — and to revisit these as circumstances change during the cycle. Three new critical suppliers represent a materially changed risk profile for the programme, making reprioritisation of the deferred audit the most defensible response. Treating the original risk assessment as permanently valid misreads clause 5.3 as a one-time establishment activity rather than an ongoing obligation; the changed landscape is precisely the trigger the clause anticipates. Rerunning the organisation's information security risk assessment conflates programme-level risks (the subject of clause 5.3) with ISMS-level risks managed under ISO/IEC 27001 clause 6.1 — a common and genuine misconception, but these are distinct activities with different owners and outputs. The nonconformity framing rests on a false premise: ISO/IEC 27001 clause 9.2.2 does not prescribe a mandatory audit interval for individual processes, so the absence of a year-one supplier audit does not by itself constitute a nonconformity, particularly where a documented rationale exists.

### 290. ISMS-IA · D2 · task 2.4 · `17c54d3c`

> Select on-site, remote or hybrid auditing methods for a given audit against the factors ISO 19011 sets out.

**A team leader notes that transmitting audit evidence over the internet introduces risks not present in on-site auditing. Where does ISO 19011:2026 address data security and technology-failure contingency for remote methods?**

- **`KEY` a) In Annex A of ISO 19011:2026, as informative guidance the team leader should consider when applying remote methods.**
- b) In the normative body of ISO 19011:2026, making these considerations mandatory requirements to document in the audit plan.
- c) In ISO/IEC 27001 only, because data security is an information security management obligation, not an audit process concern.
- d) Exclusively in the auditee's information security policy, since data security obligations rest solely with the auditee's environment.

*explanation:* ISO 19011:2026 Annex A is an informative annex that addresses additional risks introduced by remote auditing methods, including data security, confidentiality, and technology-failure contingency. Because the annex is informative, it provides guidance rather than imposing mandatory requirements. The distractor placing these considerations in the normative body incorrectly elevates informative annex content to mandatory status. The distractor restricting responsibility to ISO/IEC 27001 conflates the auditee's ISMS obligations with risks that arise within the audit process itself. The distractor assigning responsibility solely to the auditee's policy ignores that Annex A addresses the audit organisation's own data handling during remote activities.

### 291. ISMS-IA · D2 · task 2.5 · `48176c1e`

> Determine audit team composition and resourcing for a given audit.

**An internal audit requires evaluating cryptographic key management controls, but no auditor on the team has cryptographic expertise. What is the correct resourcing action?**

- a) Exclude cryptographic controls from scope until an auditor with that competence is formally recruited and assigned.
- b) Appoint a cryptography specialist as a technical expert; the specialist's documented observations alone constitute sufficient audit evidence.
- **`KEY` c) Appoint a cryptography specialist as a technical expert; a qualified auditor collects and evaluates evidence using the specialist's input.**
- d) Allow the specialist to lead evidence collection in that area, since technical content determines evidentiary weight, not auditor status.

*explanation:* ISO 19011:2026 defines a technical expert as someone providing specific knowledge to support the team who does not act as an auditor. A qualified auditor must collect and evaluate evidence; the specialist's input supports that process but does not independently constitute audit evidence. Treating the specialist's observations as standalone evidence, or allowing the specialist to lead evidence collection, misapplies the defined role. Excluding the controls from scope avoids the competence gap rather than resolving it.

### 292. ISMS-IA · D2 · task 2.7 · `60c3b7d2`

> Determine how AI systems within the ISMS scope change the audit programme's risk profile and its prioritisation.

**An internal auditor is revising the annual ISMS audit programme after the organisation's customer-service team began using a third-party large-language-model API six months ago. The API was onboarded through procurement and is documented in the supplier register. The model provider publishes no formal release notes when it updates the underlying model weights. Which analysis best justifies adjusting the audit interval for this system?**

- a) No adjustment is needed because the provider is already in the supplier register; Annex A supplier-relationship controls were applied at onboarding and no contract renegotiation has occurred, so the risk profile is unchanged.
- b) No adjustment is needed because the model provider holds its own ISO 27001 certification, which substitutes for direct evaluation of the supplier relationship within the ISMS audit programme and keeps residual risk at an accepted level.
- **`KEY` c) The interval should be shortened because silent model-weight updates functionally change the system's behaviour, so the change-controlled assumption that justified the original interval no longer holds for this supplier relationship.**
- d) The interval should be shortened only if management has not formally accepted the AI system's information-security risks; once risk acceptance is recorded, the programme has no obligation to revisit the system more frequently than originally scheduled.

*explanation:* The answer that calls for shortening the interval because silent weight updates break the change-controlled assumption is best because it identifies the specific mechanism — unannounced functional change — that invalidates the original interval's premise. It is better than the answer citing onboarding and the supplier register, which is defensible (controls were applied and no contract change occurred) but conflates initial coverage with ongoing adequacy: ISO/IEC 27001:2022 requires supplier relationships to be evaluated across their lifecycle, not only at entry, and a supplier whose product changes silently represents a different ongoing risk than one whose releases are controlled. The provider's own certification is a legitimate risk-reduction input but does not eliminate the ISMS programme's obligation to evaluate the relationship, particularly when the product's behaviour is opaque. Risk acceptance by management addresses appetite at a point in time; it does not remove the programme's obligation to monitor a system whose risk profile continues to evolve through silent updates.

### 293. ISMS-IA · D2 · task 2.7 · `62d3f05f`

> Determine how AI systems within the ISMS scope change the audit programme's risk profile and its prioritisation.

**An internal auditor is revising the annual ISMS audit programme after the organisation deployed three AI systems mid-year: one using an external inference API, one fine-tuned monthly on internal data, and one adopted by a business unit without going through change control. Which analysis most accurately characterises how these systems change the programme's risk profile?**

- **`KEY` a) All three raise the risk profile for distinct reasons: the API triggers Annex A supplier-relationship coverage, the monthly fine-tuning invalidates the change-controlled interval assumption, and the shadow system will not appear in planning inputs and requires an active discovery step.**
- b) The API and the fine-tuned model raise the risk profile because they are formally deployed, but the shadow system is a governance matter for management to resolve before the audit cycle begins and does not itself alter the programme's scope or priority.
- c) The fine-tuned model and the shadow system change the risk profile, but the external API does not, because Annex A supplier controls target traditional outsourcing arrangements and do not extend to model inference endpoints.
- d) Only the external API materially changes the risk profile by introducing a third-party dependency; the fine-tuned model stays within the change-controlled environment, and the shadow system will surface through the asset or risk register used as a planning input.

*explanation:* Each system disturbs the programme for a different, specific reason. The external inference API creates a supplier relationship that Annex A controls (particularly those covering supplier services) must address. The monthly fine-tuned model changes behaviour without a formal change request, invalidating an interval that was calibrated on the assumption that behaviour only changes through change control. The shadow system bypassed procurement and will not appear in the asset or risk register, so the programme must actively look for it rather than wait for management to surface it. The second-best option — which correctly identifies the API and fine-tuned model but treats the shadow system as a pre-audit governance matter — misreads the auditor's role: ISO 19011:2026 clause 5.2 advises that the audit programme itself should be designed to surface risks present in the audited environment, including undeclared systems, rather than deferring discovery to management action.

### 294. ISMS-IA · D3 · task 3.1 · `12b13dd2`

> Determine what degree of verification collected information carries, and what reliance a finding can therefore place on it.

**An internal auditor reviewing asset management controls finds a manager's email asserting that all assets are inventoried annually. The email is relevant to the audit criteria but the auditor has no other evidence to confirm or contradict the claim. Which analysis of this information's status is most accurate under ISO 19011?**

- a) The email qualifies as objective evidence under clause 3.9 and automatically as audit evidence under clause 3.10, because relevance to audit criteria is the sole decisive criterion for both definitions.
- b) The email is fully reliable audit evidence because written management records are inherently more verifiable than verbal statements and therefore require no further professional judgement before reliance.
- **`KEY` c) The email satisfies relevance and the statement-of-fact element of clause 3.10, but low verifiability means the auditor must apply professional judgement before relying on it as audit evidence.**
- d) The email cannot be accepted in any form because clause 6.4.7 requires verification before acceptance, and a single uncorroborated managerial assertion provides no degree of verification whatsoever.

*explanation:* Clause 3.10 of ISO 19011:2026 defines audit evidence as records, statements of fact, or other information that are relevant to the audit criteria and verifiable. The email satisfies relevance and the statement-of-fact element, but verifiability is low rather than absent, so clause 6.4.7 calls for professional judgement about the degree of reliance - not automatic acceptance or outright exclusion. Treating objective evidence (clause 3.9) and audit evidence (clause 3.10) as synonymous conflates two distinct defined terms: audit evidence is a subset of objective evidence that additionally satisfies the verifiability criterion, so relevance alone is insufficient. Excluding the email entirely overstates the exclusion rule: low verifiability triggers calibrated reliance, not rejection. Treating written records as inherently fully reliable introduces a hierarchy not found in ISO 19011 and would eliminate the professional-judgement step that clause 6.4.7 requires. The calibrated-reliance answer is best because it is the only one that correctly applies both defined terms and the professional-judgement instruction without overstating or understating either requirement.

### 295. ISMS-IA · D3 · task 3.2 · `06be2961`

> Determine a sampling approach and judge whether a sample supports the conclusion drawn from it.

**During an ISO/IEC 27001:2022 internal audit of supplier security reviews (Annex A 5.19), an auditor uses a random number table to select 20 contracts from a register of 200 and checks whether each has a completed security assessment. The auditor then states: 'With 95% confidence, security assessments are completed for all suppliers.' Which analysis of that conclusion is most accurate?**

- a) The conclusion is valid provided the auditor documents the sampling methodology in full, because ISO 19011 Annex A.6 states that following its sampling guidance is sufficient to ensure any conclusion drawn from the sample is defensible.
- b) The conclusion is weakened only by the sample size; a sufficiently large random sample would allow the auditor to assert with genuine certainty that all 200 suppliers have completed assessments, removing any need for a confidence-interval qualification.
- **`KEY` c) The conclusion is overstated: a probability-based sample supports a confidence-interval claim about assessment completion rates across the population, but asserting that all suppliers are assessed misrepresents what a sample of 20 from 200 can establish statistically.**
- d) The conclusion is valid because the auditor used a probability-based selection method; statistical sampling is the approach ISO 19011 endorses for attaching a numerical confidence level, and the method was applied correctly to a well-defined population.

*explanation:* Statistical sampling allows a confidence-interval statement about a population parameter — for example, that the completion rate lies within a specified range at a given confidence level — but it cannot support a claim that all members of a population comply, because unsampled members remain unexamined. The conclusion as stated ('all suppliers') is a universal claim that no sample, statistical or otherwise, can establish. The option endorsing the conclusion because a probability model was used correctly conflates a valid sampling method with an unlimited licence to draw any conclusion from it; the method governs the confidence attached to a rate estimate, not to an absolute universal claim. The option invoking full documentation of methodology misattributes to ISO 19011:2026 Annex A.6 a guarantee it does not provide: the guidance shapes how sampling is conducted, not what any resulting conclusion may assert. The option suggesting that a larger sample removes the need for qualification mistakes precision for certainty — even a census of 199 leaves one supplier unexamined, and no sample size converts a probabilistic inference into a universal guarantee.

### 296. ISMS-IA · D3 · task 3.3 · `00ae33a8`

> Assess the reliability of evidence obtained through remote auditing methods.

**During a remote internal audit of access control, the auditee shares their screen and the auditor directs them to open the user-provisioning log, navigate to a specific date range, and display individual records. The auditor observes each step in real time. A colleague argues this is equivalent to witnessed access because the auditor is controlling the path. Which analysis of the evidence obtained is most accurate?**

- **`KEY` a) The session approximates witnessed access but does not fully equal it, because the auditor cannot rule out that the display layer was pre-configured to filter certain records before they reach the screen — a limitation absent when the auditor is physically at the terminal.**
- b) The session constitutes full witnessed access equivalent to physical presence, because the auditor directed every navigation step and observed each result in real time, leaving no opportunity for the auditee to substitute pre-prepared content.
- c) The session provides weaker evidence than a digitally signed export from the same system, because a signed file carries a verifiable timestamp whereas a screen-sharing session produces no artefact the auditor can independently inspect after the call.
- d) The session provides no usable evidence unless supplemented by a screen recording retained by the auditor, because without a durable artefact the evidence cannot satisfy the verifiability considerations set out for remote audit methods in ISO 19011.

*explanation:* Directing navigation reduces but does not eliminate the risk that the display layer, a middleware filter, or a pre-configured view conceals records before they reach the auditor's screen — a risk that does not exist when the auditor is physically at the terminal. The option claiming full equivalence to physical presence overstates what screen-sharing establishes: the auditor still cannot observe the system below the presentation layer, so the colleague's argument does not hold. The option favouring a signed export misapplies the comparison: a signed file has its own provenance gap, because completeness and selection criteria are not verified by the signature alone, so it is not straightforwardly stronger than directed live navigation. The option requiring a retained screen recording overstates what ISO 19011 mandates for remote sessions; the absence of a recording does not render the evidence unusable.

### 297. ISMS-IA · D3 · task 3.3 · `1c6caa16`

> Assess the reliability of evidence obtained through remote auditing methods.

**During a remote internal audit of access control, the auditee shares their screen and the auditor verbally directs which user accounts to open and which access logs to display. The auditee navigates each step while the auditor observes. A colleague argues this is equivalent to witnessed access on-site because the auditor controlled the path. Which analysis best characterises what this method actually establishes?**

- a) It is insufficient for access-control conclusions, because directing navigation through a remote interface gives the auditor no visibility into system configuration or permission structures that are not surfaced in the shared display.
- b) It constitutes witnessed access equivalent to on-site observation, because the auditor directed every navigation step and observed the system responding, removing any meaningful distinction from physical presence.
- c) It provides stronger assurance than on-site access, because the screen-sharing session creates an automatic digital record of what was observed, giving the auditor a retrievable audit trail the auditee cannot later alter.
- **`KEY` d) It establishes more than a pre-exported file, because the auditor controlled what was retrieved; however, it falls short of full on-site witnessed access, since the auditor cannot rule out filtering or pre-staging between the source system and the shared display.**

*explanation:* Auditor-directed screen navigation establishes more than a passively received artefact because the auditor controls what is retrieved in real time. However, the auditor cannot observe what lies between the source system and the shared display, so pre-staged or filtered content remains a residual risk that on-site presence would reduce — making this the most accurate characterisation of the method's actual evidentiary standing. The claim that directing navigation makes it fully equivalent to physical presence is the core misconception: control of the path does not eliminate the possibility that displayed output has been filtered before reaching the auditor's view. The option asserting an automatic tamper-proof record rests on a further misconception about what screen-sharing software guarantees. The option that denies any conclusion can be drawn overstates the limitation: the method does yield genuine, if bounded, evidence about what was displayed.

### 298. ISMS-IA · D3 · task 3.4 · `9f158132`

> Select the evidence-gathering method that fits the evidence sought.

**An auditor has confirmed that the key-rotation procedure is documented and that staff can describe it accurately. What limitation must the auditor recognise before concluding on operating effectiveness?**

- a) The procedure's approval status is unverified, so document review must be repeated before any conclusion can be drawn.
- **`KEY` b) Documentation and interviews confirm design intent only; neither establishes that the control operates as described.**
- c) Documentation and interviews confirm design intent only; a single observed rotation event is then sufficient to conclude effectiveness.
- d) Staff testimony corroborates the documented procedure, so both together are sufficient evidence of operating effectiveness.

*explanation:* Reviewed documentation confirms what the organisation has decided and recorded; interviews confirm what staff believe they do. Neither method establishes that the control actually operates as described — that requires observation or re-performance of the control. The misconception that a well-documented, clearly articulated control has been sufficiently audited without operational testing is exactly what this item targets. Observing a single event does not represent the full audit period and is not sufficient on its own. Staff testimony corroborating a document addresses design, not operation. Approval status of the document is a separate concern and is not the core limitation identified here.

### 299. ISMS-IA · D3 · task 3.4 · `cf485caf`

> Select the evidence-gathering method that fits the evidence sought.

**During an ISMS audit, an auditor wants to establish what the IT security team understands about the organisation's patch-management policy. Which audit method is most appropriate?**

- a) Review the approved patch-management procedure to capture the team's operational understanding.
- b) Re-perform a patch cycle to confirm that team members apply the policy steps correctly.
- c) Observe a patching session, because direct observation reveals understanding more reliably than self-reporting.
- **`KEY` d) Interview team members to elicit what they understand and believe they do regarding the policy.**

*explanation:* ISO 19011:2026 identifies interviews as the method suited to establishing what people understand and believe they do — precisely the evidence sought here. Re-performance verifies whether a control produces the correct result, not what team members comprehend. Reviewing the procedure shows what is documented, not what staff understand. Observation shows what happens at the moment observed, which is not the same as eliciting understanding.

### 300. ISMS-IA · D3 · task 3.5 · `767def2f`

> Select the question form that elicits evidence rather than confirmation in a given interview situation.

**Two technicians from the same team, interviewed separately, both say patches are applied within 48 hours. An auditor concludes this is corroboration. What is wrong with that conclusion?**

- a) Separate interviews satisfy evidential independence, so the conclusion is sound and no further verification is needed.
- b) Verbal statements cannot corroborate claims about technical controls; only system-generated logs are acceptable evidence.
- c) Corroboration requires at least three independent sources; two witnesses are insufficient regardless of their relationship.
- **`KEY` d) Both sources share the same training and assumptions, so their agreement reflects common bias, not independent confirmation.**

*explanation:* Corroboration requires a second source that could independently have disagreed. Two people from the same team, trained identically and working under the same management, share a common frame of reference; their agreement reflects that shared frame rather than independent verification. Conducting interviews separately addresses procedural fairness, not evidential independence. There is no rule requiring three sources, and verbal accounts can legitimately contribute to an evidence base alongside documentary or technical evidence.

### 301. ISMS-IA · D3 · task 3.8 · `3d342ad8`

> Determine what an AI-assisted evidence process establishes and what it leaves unverified.

**Before fieldwork begins, an AI tool scans the organisation's incident-management system and selects 30 records for the auditor to examine, filtering out records it classifies as low-risk. The auditor reviews only those 30 records and finds no nonconformities. What does this process establish, and what does it leave unverified?**

- a) The process establishes conformity without any sampling caveat, because the tool's classification was a technical pre-filtering step rather than a sampling decision; sampling principles apply only to records the auditor personally selects.
- b) The process establishes conformity with the auditor bearing no accountability for gaps introduced by the tool's exclusion logic, because the tool — not the auditor — decided which records were examined, limiting professional responsibility to the 30 records actually reviewed.
- c) The process establishes high-confidence conformity, because AI tools process far more records in the classification step than a human auditor could, so tool-driven selection inherently provides broader coverage than traditional auditor-directed sampling.
- **`KEY` d) The process establishes that no nonconformities were found in the 30 tool-selected records; it leaves unverified whether excluded records contain nonconformities, because the tool's classification logic made a sampling decision that directly limits the confidence attributable to the audit conclusion.**

*explanation:* Audit sampling principles in ISO 19011 tie sampling decisions directly to the confidence that can be placed in audit conclusions. When the tool decided which 30 records to surface and which to exclude, it made exactly that sampling decision, so the conclusion is bounded by — and must be qualified against — the tool's selection logic. The option claiming AI coverage is inherently broader conflates volume of processing with representativeness of selection: processing more records in a classification step does not guarantee the selected subset is representative. The option treating classification as a pre-filter rather than a sampling decision is the core misconception that sampling principles address: any mechanism that determines which records are examined is a sampling decision, regardless of whether a human or tool applies it. The option limiting auditor accountability to the 30 reviewed records misapplies professional responsibility: the auditor is accountable for the conclusion drawn, including for any bias or gap introduced by the tool's exclusion logic.

### 302. ISMS-IA · D3 · task 3.9 · `afeedbda`

> Maintain traceability from an evidence source through to the finding it supports.

**A working paper links a sampled access-log extract labelled 'CONFIDENTIAL — HR system' to a nonconformity finding. When sharing the draft report with a wider management group, what should the auditor do with this extract?**

- a) Share it freely; the confidentiality principle covers only commercially sensitive data, not process observations.
- **`KEY` b) Restrict access to those with a legitimate need, applying the confidentiality obligations of the audit programme.**
- c) Remove it from the working paper; only the final report is an official record requiring retention.
- d) Transfer protection responsibility to the auditee's security team; the auditor's duty ends when the report is issued.

*explanation:* ISO 19011:2026 clause 4.5 (confidentiality principle) requires auditors to exercise discretion in the use and protection of information acquired during the audit. This obligation is not limited to commercially sensitive content and continues beyond report issue. Discarding the extract abandons the auditor's retention duty, and transferring responsibility entirely to the auditee abandons the auditor's ongoing confidentiality obligation.

### 303. ISMS-IA · D3 · task 3.9 · `cb4f299b`

> Maintain traceability from an evidence source through to the finding it supports.

**After issuing the audit report, the audit programme manager asks how long to keep working papers and checklists. According to ISO 19011:2026 clause 5.5.7, who determines the retention period for these records?**

- a) The organisation's general document control policy, as ISO 19011 imposes no specific provisions for audit records.
- **`KEY` b) The audit programme manager, applying programme rules and any applicable legal or contractual requirements.**
- c) The auditee, who owns all audit outputs once the report is issued and controls their confidentiality.
- d) The lead auditor, using personal professional discretion, as ISO 19011 leaves retention to individual judgement.

*explanation:* ISO 19011:2026 clause 5.5.7 places responsibility for managing audit-related records — including retention period and handling — with the audit programme manager, within requirements set by the programme and any applicable legal or contractual obligations. Leaving retention to the lead auditor's personal discretion, treating the auditee as the owner post-report, or deferring entirely to a generic document control policy all misrepresent that specific clause.

### 304. ISMS-IA · D4 · task 4.1 · `1f2e40ef`

> Determine whether a declared ISMS scope is complete and defensible against clause 4.

**During an internal audit, the auditor finds that the organization's ISMS scope excludes its disaster-recovery data centre, located in a different city, on the grounds that the site is managed by a facilities team outside the ISMS programme. The auditor is assessing whether this exclusion creates a conformity problem. Which conclusion is best supported by the standard?**

- a) The exclusion is permissible because physical locations can legitimately fall outside the ISMS boundary; provided the scope document clearly states the exclusion, the organization retains full conformity with Clauses 4 to 10 for the in-scope portion of its operations.
- b) The exclusion creates a conformity problem only if the data centre hosts assets listed in the Statement of Applicability; if no SoA controls reference that site, excluding the location does not affect conformity with any Clause 4–10 requirement.
- **`KEY` c) The exclusion is a scope gap because Clause 4.3 requires the scope to consider interfaces and dependencies, and a disaster-recovery site on which the ISMS depends represents an undeclared dependency; the location exclusion does not automatically exclude the clause requirements that govern that dependency.**
- d) The exclusion creates a conformity problem because Clause 4.3 itself prohibits removing any location from scope once the ISMS has been established; the organization must either bring the site in-scope or withdraw its conformity claim entirely.

*explanation:* Clause 1 of ISO/IEC 27001:2022 states that excluding any requirement in Clauses 4 to 10 is not acceptable when conformity is claimed. Activities and locations can fall outside a scope boundary, but the clause requirements governing dependencies on those activities cannot be excluded by that boundary decision. The best answer is therefore the one identifying the undeclared dependency as the gap: a disaster-recovery site on which the ISMS relies must be addressed as an interface under Clause 4.3(c), regardless of where the site sits geographically or organizationally. The answer asserting that a clearly documented exclusion preserves full conformity is the strongest second-best — it is correct that locations may be excluded, but it conflates documenting a boundary with satisfying the substantive dependency requirement, which the scenario undercuts. The answer conditioning the problem on whether SoA controls reference the site is defensible because SoA linkage is a real indicator of dependency, but it is narrower than what Clause 4.3(c) requires and would miss dependencies not yet reflected in the SoA. The answer attributing the prohibition to Clause 4.3 rather than Clause 1 misidentifies the source of the conformity rule; Clause 4.3 governs scope definition, not the non-excludability of clause requirements, making that conclusion overstated even though its practical outcome resembles the correct one.

### 305. ISMS-IA · D4 · task 4.10 · `07d2434c`

> Distinguish ISMS conformity from AI management system conformity where the two scopes overlap.

**An internal auditor reviewing an ISO/IEC 42001 management review finds the agenda includes fulfilment of AI policy objectives and feedback from AI system users. The agenda omits risk assessment results and treatment plan status, and the auditor drafts a finding. Which analysis of that draft finding is most accurate?**

- a) The finding is premature pending further evidence: ISO/IEC 42001 requires the review to address AI-related risks, and the auditor should first verify whether risk assessment results were presented orally or in supporting documents before concluding they were omitted.
- **`KEY` b) The finding is premature: risk assessment results and treatment plan status are ISO/IEC 27001 clause 9.3.2 inputs, not ISO/IEC 42001 requirements, so their absence does not constitute an AIMS nonconformity.**
- c) The finding is valid because ISO/IEC 42001 Annex D.2 normatively requires ISO/IEC 27001 management review inputs when both standards are implemented simultaneously by one organization.
- d) The finding is valid because the harmonized structure makes management review input lists identical across all ISO management system standards, including the requirement for risk treatment plan status.

*explanation:* ISO/IEC 27001 clause 9.3.2 explicitly lists risk assessment results and treatment plan status as required inputs; ISO/IEC 42001 does not carry these same inputs. Raising their absence as an ISO/IEC 42001 finding applies the wrong standard's requirements, making the draft finding premature. The harmonized structure provides a common high-level framework but does not make clause-level input lists identical across standards, so the argument that all ISO management system standards share identical review inputs is incorrect. ISO/IEC 42001 Annex D.2 is explicitly informative and imposes no binding requirements, so treating it as normative is a misattribution. The argument that the auditor should seek further evidence before concluding is procedurally reasonable but does not change the underlying analysis: even if risk assessment results were absent, their omission would not be an ISO/IEC 42001 nonconformity.

### 306. ISMS-IA · D4 · task 4.10 · `1d72ac82`

> Distinguish ISMS conformity from AI management system conformity where the two scopes overlap.

**An internal auditor reviews the management review records for an organization certified to both ISO/IEC 27001 and ISO/IEC 42001. The AIMS management review minutes contain no reference to information security objectives fulfilment, interested-party feedback, or risk treatment plan status. The auditor is deciding whether to raise a finding against the AIMS review. Which analysis is most defensible?**

- a) A finding is warranted under ISO/IEC 42001, because the harmonized structure shared with ISO/IEC 27001 means clause 9.3 of both standards carries identical management review input requirements, including objectives fulfilment and risk treatment status.
- b) A finding is warranted under both standards simultaneously, because implementing them together creates an obligation to satisfy the more demanding standard's review inputs across all management review records, regardless of which system is being reviewed.
- **`KEY` c) A finding is warranted under ISO/IEC 27001, because those three inputs are required by clause 9.3.2, but no finding is warranted under ISO/IEC 42001 alone, because that standard does not require those specific inputs in its management review clause.**
- d) No finding is warranted under either standard, because management review input lists in harmonized-structure standards are illustrative rather than exhaustive, leaving organizations free to omit any input category without creating a nonconformity.

*explanation:* ISO/IEC 27001 clause 9.3.2 explicitly lists information security objectives fulfilment, feedback from interested parties, and risk assessment and treatment plan status as required management review inputs. ISO/IEC 42001 does not carry these three items in its equivalent clause; its clause 9.3.2 specifies different inputs tailored to AI management. Raising a finding against the AIMS review for their absence would attribute a 27001 requirement to a 42001 audit scope, which is precisely the error an auditor must avoid when two scopes overlap. This makes the conclusion that a finding is warranted only under 27001 the best answer. The option asserting that the harmonized structure makes the input lists identical confuses shared clause numbering with shared clause text — the standards diverge at exactly this point. The option treating the input lists as merely illustrative misreads both standards; the listed inputs are normative requirements, not examples. The option applying a ratchet obligation based on joint implementation invents a requirement that exists in neither standard.

### 307. ISMS-IA · D4 · task 4.2 · `4554efb4`

> Determine whether evidence shows top management has demonstrated the leadership, policy and role assignments clause 5 requires.

**An internal auditor reviews evidence for Clause 5.1 leadership demonstration. Top management signed the information security policy two years ago, approved last year's security budget in a single line item, and has not attended any management review meeting in 18 months. The CISO presents quarterly dashboards to a deputy. Which conclusion is best supported by this evidence?**

- a) Leadership demonstration is sufficient: a signed policy establishes documented commitment and the approved budget satisfies the resource obligation, making additional behavioural evidence unnecessary for an internal audit conclusion.
- b) Leadership demonstration is insufficient only on performance reporting: routing dashboards through a deputy violates Clause 5.3 authority assignment, while the signed policy and budget approval adequately cover the remaining Clause 5.1 elements.
- c) Leadership demonstration is partially compliant: budget approval fully satisfies the resource obligation, but the 18-month absence from management reviews is a minor gap that need not be raised as a finding before the next external surveillance visit.
- **`KEY` d) Leadership demonstration is insufficient: a signed policy and budget approval are documented statements, not observable behaviour; 18 months of non-attendance and no direct receipt of performance reporting leave multiple Clause 5.1 elements unsubstantiated.**

*explanation:* Clause 5.1 uses the verb 'demonstrate', requiring observable behaviour, not documentation alone. A signed policy is a statement of intent; a single-line budget approval does not itself show resources are made available when needed; and 18 months of non-attendance at management reviews provides no evidence of active engagement — leaving multiple elements unsubstantiated. The option that restricts the gap to performance reporting is weaker because it treats the policy and budget as adequate for the remaining elements, which the same analysis shows they are not. The option asserting sufficiency conflates documentation with demonstrated commitment. The option deferring the attendance gap to a future visit applies a materiality judgement unsupported by the clause text.

### 308. ISMS-IA · D4 · task 4.3 · `1b990908`

> Determine whether an organization's risk assessment, risk treatment, information security objectives and planning of changes conform to clause 6.

**During a clause 6.1.3 audit, you find that the organization determined all necessary controls through its risk treatment process, compared them against Annex A, and included three NIST SP 800-53 controls not in Annex A in its SoA. The information security manager argues these controls need not appear in the SoA. Which analysis is most defensible?**

- a) The SoA is valid as presented because once the Annex A completeness check confirms no gaps, the SoA's content is governed by what was determined necessary — which already includes the NIST controls listed.
- **`KEY` b) The SoA must include all controls determined as necessary regardless of source, because clause 6.1.3 d) requires the SoA to contain the necessary controls — not only those drawn from Annex A.**
- c) Including non-Annex A controls is itself a nonconformity, because NOTE 3 states the Annex A list is exhaustive for ISO/IEC 27001 and controls outside it fall outside the standard's scope.
- d) The SoA need only list Annex A controls with applicability and justification; controls from external frameworks are supplementary and belong in the risk treatment plan, not the SoA.

*explanation:* Clause 6.1.3 d) requires the SoA to contain the controls determined as necessary through the risk treatment process; the source framework is irrelevant to that obligation. The 'valid as presented' option is the closest second-best: it correctly notes that the SoA is governed by what was determined necessary, but it wrongly implies the current SoA already satisfies this — it does not address the manager's argument that the NIST controls need not be listed at all, which is the live dispute. The 'treatment plan, not SoA' option reflects a genuine practitioner misconception about where non-Annex A controls are documented. The 'exhaustive list' option inverts NOTE 3, which explicitly states the Annex A list is not exhaustive, making that claim a direct misreading of the standard.

### 309. ISMS-IA · D4 · task 4.4 · `5bdac5e4`

> Determine whether a Statement of Applicability is consistent with the risk treatment decisions behind it.

**An internal auditor reviews the SoA and finds that Annex A control 5.19 (Information security in supplier relationships) is marked 'Not applicable.' The exclusion justification reads: 'This control was not discussed during the risk assessment workshops; therefore no exclusion rationale is required.' The risk treatment plan is silent on 5.19. Which assessment is most defensible?**

- a) This is not a finding: silence in both the SoA justification column and the risk treatment plan is mutually consistent, so no additional documented rationale is needed when both documents agree the control is out of scope.
- b) This is not a finding: clause 6.1.3 d) only requires justification when a control was explicitly evaluated and rejected; controls never discussed fall outside the exclusion-justification obligation.
- c) This is a finding, but its scope is limited to the justification wording: because an applicability decision does appear in the SoA, the underlying risk assessment must be revisited before the exclusion can stand, not merely the wording corrected.
- **`KEY` d) This is a finding: clause 6.1.3 d) requires a documented exclusion rationale for every excluded Annex A control, regardless of whether the control was actively discussed during risk assessment workshops.**

*explanation:* Clause 6.1.3 d) requires justification for excluding any Annex A control, with no exception for controls that were overlooked or never discussed; the obligation is triggered by the exclusion decision itself, not by the depth of prior deliberation. This makes the answer identifying a finding against every excluded control — regardless of workshop discussion — the best answer. The answer asserting that justification is only required for actively considered controls is the strongest second-best: it reflects a genuine and common misconception that the clause is triggered by conscious rejection rather than by the act of exclusion, and a practitioner holding that view would make a coherent, if mistaken, argument. The answer treating mutual silence as sufficient confuses the absence of contradiction with the presence of the required justification; both documents being silent does not satisfy the documented-rationale requirement. The answer limiting the finding to justification wording while requiring the risk assessment to be revisited before the exclusion can stand goes further than the evidence supports: the standard requires a documented rationale traceable to the risk assessment, but does not automatically invalidate the exclusion decision itself pending reassessment.

### 310. ISMS-IA · D4 · task 4.4 · `05107b49`

> Determine whether a Statement of Applicability is consistent with the risk treatment decisions behind it.

**An internal auditor compares the SoA with the risk treatment plan and finds that Annex A control 8.12 (data leakage prevention) is marked 'applicable and implemented' in the SoA, but the treatment plan records the corresponding risk as 'accepted – no control selected'. Both documents are signed by the same risk owner. Which conclusion is best supported by this evidence?**

- a) The implementation status entry in the SoA is informational only, so marking 8.12 as implemented without a corresponding treatment decision is a documentation gap but not an auditable nonconformity under clause 6.1.3.
- b) The SoA takes precedence over the treatment plan because clause 6.1.3 d) formally requires the SoA, making the discrepancy a finding only against the treatment plan, which must be updated to match the SoA's inclusion of 8.12.
- c) No finding arises because the same risk owner signed both documents, demonstrating that the inconsistency was a deliberate, approved decision rather than an oversight, satisfying clause 6.1.3 f) approval requirements.
- **`KEY` d) A finding exists because the two documents diverge: the SoA claims the control is applied while the treatment plan records risk acceptance instead, and clause 6.1.3 requires the SoA to reflect the actual treatment decisions, not override them.**

*explanation:* Clause 6.1.3 requires the SoA to contain justification for inclusion traceable to risk treatment decisions; the treatment plan and SoA must describe the same decisions. A divergence — one document saying 'accepted, no control' and the other saying 'applicable and implemented' — is a finding regardless of which document is formally required. The position that the SoA takes precedence and the treatment plan must be updated to match is a misconception: neither document overrides the other; both must be consistent with the underlying risk assessment and treatment decisions. The same risk owner's signature on both documents does not resolve the logical contradiction between acceptance and implementation, because a signature cannot simultaneously authorise two mutually exclusive treatment decisions for the same risk.

### 311. ISMS-IA · D4 · task 4.4 · `886924aa`

> Determine whether a Statement of Applicability is consistent with the risk treatment decisions behind it.

**During an internal audit, you compare the SoA with the risk treatment plan. The SoA marks control 8.12 (Data leakage prevention) as 'Not applicable – excluded' with justification 'no personal data processed.' The risk treatment plan, signed three months earlier, includes 8.12 as a selected control assigned to the IT manager with a target implementation date. Which conclusion is most defensible?**

- a) The divergence is a finding only against the risk treatment plan: the SoA is the formally required document under clause 6.1.3 and therefore takes precedence, so the treatment plan must be updated to align with the exclusion the SoA records.
- b) No finding is raised at this stage: 'no personal data processed' is a plausible business reason for exclusion, and clause 6.1.3 d) requires only that a justification be stated, not that it be traced back to the risk treatment plan.
- **`KEY` c) The divergence is a finding against both documents: clause 6.1.3 d) requires the SoA to reflect the risk treatment decisions, and a control in the treatment plan cannot simultaneously be excluded from the SoA without a documented decision reversing the original selection.**
- d) The divergence is a finding only against the SoA: the risk treatment plan reflects the risk owners' decisions under clause 6.1.3 and those decisions govern, so the SoA must be corrected to reinstate 8.12 as applicable before further audit work proceeds.

*explanation:* Clause 6.1.3 d) requires the SoA to contain the necessary controls with justification traceable to the risk treatment decisions. The SoA and the risk treatment plan describe the same decisions from different angles, so a contradiction between them is a finding against both — not a precedence question. The answer asserting that the SoA takes precedence rests on a common misconception that the SoA is the senior document; clause 6.1.3 assigns neither document precedence over the other, making that answer the strongest second-best but still wrong on the precedence reasoning. The answer accepting the stated justification at face value ignores the auditor's obligation to trace an exclusion back to the treatment decision, not merely to confirm that words appear in the justification column. The answer directing the finding solely at the SoA errs in the opposite direction, treating the treatment plan as automatically authoritative without evidence of a formal reversal decision.

### 312. ISMS-IA · D4 · task 4.5 · `789555ac`

> Select the evidence that would establish conformity with a given clause 7 requirement for competence, awareness or documented information.

**During a clause 7.3 audit, an auditor finds the organization emailed the information security policy to all staff, including on-site contractors. What additional evidence is needed to establish conformity?**

- a) Proof that contractors were excluded, because clause 7.3 covers only the organization's payroll employees.
- b) Confirmation that each person was briefed on the specific ISMS objectives assigned to their individual role.
- c) No additional evidence; distributing the policy to all staff satisfies the clause 7.3 awareness requirement.
- **`KEY` d) Evidence that persons are aware of their contribution to ISMS effectiveness and the implications of not conforming.**

*explanation:* Clause 7.3 requires persons doing work under the organization's control — including contractors — to be aware of the policy, their contribution to ISMS effectiveness, and the implications of not conforming. Distributing the policy shows only that it was sent, not that awareness exists. The auditor must seek evidence such as quizzes or acknowledgement records covering all three awareness elements. Excluding contractors contradicts the clause's scope, and distributing the policy alone does not satisfy the requirement. Awareness of individual ISMS objectives is not a clause 7.3 requirement.

### 313. ISMS-IA · D4 · task 4.7 · `324e7cbc`

> Determine whether the organization has addressed the climate change consideration Amendment 1:2024 adds to clause 4.1.

**An internal auditor reviews clause 4.1 documentation updated after Amendment 1:2024. It lists economic, regulatory, and technological issues but contains no reference to climate change. What should the auditor conclude?**

- **`KEY` a) Nonconformity: no evidence exists that the required climate change determination was made.**
- b) Conformity: the amendment applies only to organizations with significant environmental impact.
- c) Nonconformity: the organization must record climate change as relevant and document controls for it.
- d) Conformity: climate change is implicitly covered under the existing environmental issues entry.

*explanation:* Amendment 1:2024 adds one normative sentence to clause 4.1 requiring every organization to determine whether climate change is a relevant issue. The determination itself is mandatory regardless of its conclusion. Because the documentation shows no evidence that this determination was made, a nonconformity exists. A general environmental issues entry does not satisfy the specific requirement, and the amendment applies to all organizations, not only those with significant environmental impact.

### 314. ISMS-IA · D5 · task 5.1 · `809cfdb7`

> Classify a finding against the audit programme's declared classification scheme.

**An internal audit programme uses two categories: nonconformity and opportunity for improvement. Auditors review a national data-protection regulation cited as an audit criterion and find a gap. Which term should appear in the finding?**

- a) Non-compliance, but only when auditing Annex A controls, since compliance language is restricted to that scope.
- **`KEY` b) Non-compliance, because ISO 19011 notes that legal or regulatory criteria often use compliance rather than conformity language.**
- c) Nonconformity, because compliance and conformity are synonymous in all audit contexts under ISO 19011.
- d) Opportunity for improvement, because regulatory gaps carry no corrective-action obligation under ISO 19011.

*explanation:* ISO 19011:2026 notes that where audit criteria are legal, statutory, or regulatory requirements, compliance and non-compliance are often used in findings rather than conformity language. Using 'nonconformity' treats compliance and conformity as synonymous, which they are not—the distinction is context-dependent and ISO 19011 notes it explicitly. Classifying the gap as an opportunity for improvement is wrong because regulatory gaps carry corrective-action obligations, not discretionary ones. Restricting compliance language to Annex A controls has no basis in ISO 19011; the language applies whenever the criteria are legal or regulatory in nature.

### 315. ISMS-IA · D5 · task 5.2 · `16e874c1`

> Determine whether the evidence constitutes a nonconformity, and whether a set of findings indicates a systemic rather than an isolated failure.

**During an internal audit of ISO/IEC 27001:2022 clause 7.2, the auditor asks for competence records for three recently onboarded cloud engineers. The team leader says records exist but are stored in an HR system inaccessible from the audit room. The auditor cannot view the records during the session. Which analysis best fits this situation?**

- **`KEY` a) First confirm that clause 7.2 requires these records to be retrievable in this context, then request access or schedule a follow-up; without that step, the finding describes the search, not whether the requirement is fulfilled.**
- b) Treat the finding as an observation; the team leader's explanation that records exist elsewhere is a credible statement of intent that offsets the lack of immediate evidence during the session.
- c) Record a nonconformity against clause 7.2; absence of evidence during the session is evidence of absence, and auditing standards require all findings to be raised in the session in which the gap is identified.
- d) Record a nonconformity immediately; an inability to retrieve records during the session shows the control is not operating effectively, regardless of where the records are stored.

*explanation:* Before treating missing evidence as a control failure, the auditor must confirm that the requirement calls for the evidence to exist and that it was reasonably retrievable — otherwise the finding describes a search difficulty, not a system failure. Raising a nonconformity immediately because records were inaccessible from one workstation conflates retrieval difficulty with non-fulfilment of clause 7.2. Accepting a verbal explanation as a substitute for evidence is equally flawed: ISO 19011:2026 clause 6.4.8 requires evaluating objective evidence against audit criteria, not stated intent against criteria. Claiming that auditing standards prohibit deferring findings to a follow-up rests on a false premise; deferral to obtain evidence is a standard audit practice.

### 316. ISMS-IA · D5 · task 5.3 · `a068c9c2`

> Select the nonconformity statement that correctly links the evidence to the requirement it fails.

**An auditor finds three terminated employees still have active system accounts 45 days after departure. Which nonconformity statement is correctly structured?**

- **`KEY` a) Three terminated employees have active accounts 45 days post-departure, failing Annex A 5.18's requirement to remove access rights on termination.**
- b) Three terminated employees have active accounts 45 days post-departure; the organisation must immediately disable them and automate deprovisioning.
- c) Access rights were not removed promptly, breaching both clause 6.1.2 and Annex A 5.18, as both address the user access lifecycle.
- d) Three terminated employees have active accounts, showing the IT team misunderstood the revocation procedure, contrary to Annex A 5.18.

*explanation:* A correctly structured nonconformity statement names the breached requirement (Annex A 5.18), cites specific evidence (three accounts active 45 days post-departure), and describes the gap — without prescribing a remedy or characterising the auditee. Prescribing automated deprovisioning tells the auditee what to do, which a nonconformity statement must not do. Bundling clause 6.1.2 and Annex A 5.18 against a single piece of evidence conflates separate requirements. Attributing the failure to the team's understanding infers intent, which compromises objectivity per ISO 19011:2026 clause 4.3.

### 317. ISMS-IA · D5 · task 5.4 · `33570616`

> Determine what an audit report must disclose about AI-assisted evidence processing so that a reader can judge the reliability of the evidence.

**An internal auditor used an AI tool to rank 4 000 access-log entries by anomaly score and then examined only the top 200. The audit report states conclusions about access-control effectiveness but does not mention the ranking method. A colleague argues the omission is acceptable because the auditor personally verified every selected entry. Which analysis of the draft report is most defensible?**

- a) The draft is deficient, but the remedy is to list the AI application in a software-inventory appendix; naming the tool satisfies any completeness obligation without requiring an explanation of how the ranking shaped evidence selection.
- **`KEY` b) The draft is deficient, because the AI ranking determined which evidence was examined; a reader who knew this might reach a different view of the conclusions, and that method therefore belongs in the report under the reader-judgement test.**
- c) The draft is acceptable, because the auditor's personal verification of each selected entry means human judgement was the operative step, making the upstream AI ranking an incidental tool that need not be disclosed.
- d) The draft is acceptable, because disclosure is only necessary when the AI method produced an incorrect output; a ranking the auditor found reliable does not trigger any reporting obligation.

*explanation:* The AI ranking determined which 200 of 4 000 entries were ever examined. A reader who knew the selection was AI-driven might question whether the anomaly-score threshold excluded relevant evidence and therefore reach a different view of the conclusions — that is the reader-judgement test, and it makes the ranking method part of what a complete, accurate audit record must capture. The personal-verification argument (the basis for finding the draft acceptable because the auditor checked each selected entry) confuses validating selected items with independently choosing them: the auditor never saw the 3 800 excluded entries, so human review did not occur at the selection stage. Listing the tool in a software appendix without explaining how it shaped evidence selection is an improvement but still fails the reader-judgement test, because knowing the tool's name does not tell a reader that half the population was excluded by its output. The reliability argument (disclosure only when AI output is incorrect) is wrong in principle: the obligation arises from the method's influence on scope, not from whether the output was later found accurate.

### 318. ISMS-IA · D5 · task 5.5 · `f500242f`

> Determine whether a proposed correction, root cause analysis and corrective action adequately address a nonconformity.

**A corrective action plan states: root cause — supplier onboarding checklist not updated after a control requirement changed; corrective action — checklist updated and reissued; effectiveness review — programme manager confirmed the updated checklist was distributed to all relevant staff. Does this effectiveness review satisfy clause 10.2?**

- a) Yes: the corrective action targeted the outdated checklist directly, and confirming reissuance demonstrates that the specific condition that produced the nonconformity no longer exists at the time of review.
- b) Yes: clause 10.2 requires only confirmation that the corrective action was implemented as planned; whether the root cause is permanently eliminated is a separate judgement made before the action is formally closed.
- **`KEY` c) No: confirming distribution verifies implementation but not elimination of the root cause — nothing ensures the checklist stays current when requirements change in future, so the failure mode remains available.**
- d) No: clause 10.2 requires the risk register and risk treatment plan to be updated whenever a corrective action is taken; without those documented changes, the effectiveness review cannot be accepted and the action cannot be closed.

*explanation:* Clause 10.2 e) requires reviewing the effectiveness of any corrective action taken, meaning the auditor must confirm that the cause has been eliminated, not merely that the planned action was carried out. The stated root cause is the absence of a mechanism to keep the checklist aligned with changing requirements; distributing an updated checklist does not demonstrate that such a mechanism now exists, so the same failure mode remains. The option accepting reissuance as sufficient is the strongest alternative — a competent practitioner could argue the specific condition (the outdated checklist) no longer exists — but this reading conflates the symptom with the cause: the nonconformity will recur whenever requirements change again unless a maintenance process is in place. The option treating implementation confirmation as all that clause 10.2 demands conflates clause 10.2 a) (taking action) with clause 10.2 e) (reviewing effectiveness). The option requiring risk register updates misreads clause 10.2, which refers to any necessary changes to the ISMS broadly and does not mandate risk register amendments as a precondition for closure.

### 319. ISMS-IA · D5 · task 5.5 · `40e07225`

> Determine whether a proposed correction, root cause analysis and corrective action adequately address a nonconformity.

**An internal audit finds that privileged access reviews for cloud administrators have not been performed for eight months, violating a documented quarterly schedule. The process owner responds by completing the overdue review immediately and retraining the team lead on the schedule requirement. The auditor must determine whether this response adequately addresses clause 10.2.**

- **`KEY` a) The response is incomplete: the overdue review corrects the instance, but retraining the team lead assumes human error is the root cause without determining why the schedule was missed for eight months, leaving any systemic cause unaddressed.**
- b) The response is adequate for a first occurrence: clause 10.2 only mandates full root cause analysis when the same nonconformity recurs, so completing the review and documenting the retraining is sufficient to close the finding at this stage.
- c) The response is incomplete because no evidence shows whether similar schedule failures exist for other privileged access populations; clause 10.2 b) explicitly requires determining whether similar nonconformities exist or could occur elsewhere.
- d) The response is adequate: clause 10.2 a) requires controlling and correcting the nonconformity; completing the overdue review satisfies that, and retraining is a recognised corrective action addressing the human element of the failure.

*explanation:* Clause 10.2 b) requires determining the causes of the nonconformity — not merely identifying who failed to act. Eight months of missed reviews indicates a systemic breakdown in reminders, oversight, or resource allocation that retraining alone does not reach. The response calling retraining adequate conflates the person who erred with the cause of the error. The response focusing on other privileged populations raises a real clause 10.2 b) obligation but is secondary: the more fundamental deficiency is that no cause determination has been performed at all, making the lateral-exposure question premature. The first-occurrence threshold misreads clause 10.2, which applies to every nonconformity without a recurrence condition.

### 320. ISMS-IA · D5 · task 5.7 · `afcfa762`

> Determine which audit results clause 9.3 requires to reach management review.

**An internal auditor has completed an ISMS audit. Under ISO/IEC 27001:2022 clause 9.2.2 c), what must the organization do with the audit results?**

- a) Report them to relevant management only after the full audit programme cycle ends.
- b) Report them only to top management, as the clause implies a single escalation path.
- **`KEY` c) Report them to relevant management, regardless of hierarchical level.**
- d) Report them in real time during fieldwork as a live notification obligation.

*explanation:* Clause 9.2.2 c) requires audit results to be reported to 'relevant management', which is not restricted to top management — any management level responsible for the audited area qualifies. Reporting only to top management adds a restriction the clause does not contain. Waiting until the full audit programme cycle ends confuses programme-level reporting with individual audit reporting. Real-time notification during fieldwork confuses on-site communication with the formal reporting obligation.

---

# SD-AI-I — Scrum Developer I — AI

**Source this certification cites:** The 2020 Scrum Guide.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 321. SD-AI-I · D1 · task 1.1 · `e6f24a8e`

> Articulate the Agile Manifesto's values and principles from a Developer's perspective

**According to the Agile Manifesto, what is the primary measure of progress on a software project?**

- a) Customer satisfaction scores collected at the end of each sprint review.
- **`KEY` b) Working software, because functioning software is the concrete evidence of real progress.**
- c) Percentage of planned backlog items delivered against the original release schedule.
- d) Story points completed per sprint, reflecting the team's sustainable delivery velocity.

*explanation:* The Manifesto's sixth principle states that working software is the primary measure of progress. Story points, schedule adherence, and satisfaction scores may be useful indicators, but none is the primary measure the Manifesto names.

### 322. SD-AI-I · D1 · task 1.5 · `b20540df`

> Classify who is and is not a Developer under the 2020 Scrum Guide

**A UX designer creates wireframes and prototypes each Sprint so the team can deliver a usable Increment. Under the 2020 Scrum Guide, how should this designer be classified?**

- a) Not a Developer, because Developers are software engineers and design is a pre-Sprint activity outside the Sprint.
- b) Not a Developer, because UX work belongs to a separate department and is provided by an external specialist.
- **`KEY` c) As a Developer, because anyone who creates any aspect of a usable Increment each Sprint holds that accountability.**
- d) As a Developer only if they also write code, since coding is the primary contribution to a usable Increment.

*explanation:* The 2020 Scrum Guide defines Developers as anyone who creates any aspect of a usable Increment each Sprint, explicitly covering all build skills including design. Limiting the Developer accountability to code-writers is a named misconception; UX design that contributes to the Increment qualifies fully.

### 323. SD-AI-I · D1 · task 1.6 · `01cf5859`

> Match AI assistance to the complexity of the work

**A Scrum team is designing a product for a market that has never existed before. Customer needs are unknown and the solution space is unpredictable. What is the most appropriate AI-use posture?**

- **`KEY` a) Use AI to generate lightweight hypotheses while humans lead sense-making and direction decisions.**
- b) Delegate pattern recognition to AI, since its training data covers analogous emergent situations.
- c) Use AI as the primary designer, because it can invent novel solutions humans would not produce alone.
- d) Automate solution selection with AI, because it processes more variables than any human team can.

*explanation:* In novel, unpredictable domains, cause and effect are unclear and no established answer exists. Humans must lead sense-making, experimentation, and direction-setting. AI can accelerate hypothesis generation and low-cost probing, but cannot reliably recommend actions where no prior pattern applies. Delegating pattern recognition misapplies AI because training data from past situations does not transfer reliably to genuinely emergent contexts. Using AI as the primary designer or automating solution selection overestimates AI reliability when the problem space itself is undefined.

### 324. SD-AI-I · D1 · task 1.6 · `24c372c1`

> Match AI assistance to the complexity of the work

**A team wants to use AI to refine acceptance criteria for a well-understood CRUD feature. A teammate argues this wastes AI on routine work. What should the team do?**

- **`KEY` a) Use AI to draft and check the criteria; clear, routine work is a primary high-leverage zone for AI.**
- b) Avoid AI on acceptance criteria regardless of feature type; that work requires stakeholder language, not generation.
- c) Agree with the teammate; AI should be reserved for complex problems where no established answer exists.
- d) Use AI only after the team manually drafts criteria first, to avoid over-reliance on generated output.

*explanation:* Clear, routine work is a primary high-leverage zone for AI: predictable outputs and established patterns mean AI can draft reliably and free human attention for harder problems. Reserving AI for complex unknowns inverts the correct posture—complex domains are precisely where AI reliability is lowest. Requiring a manual draft first or excluding AI from acceptance criteria entirely are unfounded constraints that forfeit the efficiency gain.

### 325. SD-AI-I · D1 · task 1.9 · `3962009b`

> Recall who the Developers are under the 2020 Scrum Guide

**Which statement about skills and the Developer accountability is consistent with the 2020 Scrum Guide?**

- a) Each Developer must hold one dedicated specialist role so the team achieves full coverage.
- b) Operations and deployment skills belong to an external DevOps team, not to Developers.
- c) Developers should focus solely on their primary specialization to maximize individual efficiency.
- **`KEY` d) The Scrum Team collectively holds all delivery skills, which may include ops, test, and design.**

*explanation:* The 2020 Scrum Guide requires the Scrum Team to be cross-functional, meaning the team collectively holds all needed skills — including operations, testing, and design. It does not mandate narrow specialization, external DevOps teams, or a one-specialist-per-discipline structure.

### 326. SD-AI-I · D2 · task 2.5 · `e7b74555`

> Explain the Developers' part in the Sprint Review: showing a Done Increment and absorbing feedback

**Which statement accurately describes who may attend the Sprint Review?**

- a) The Scrum Team and direct business sponsors only, to prevent uncontrolled scope changes.
- **`KEY` b) The Scrum Team and any stakeholders the Product Owner considers relevant.**
- c) The Scrum Team only; stakeholders receive a written summary to avoid disrupting the inspection.
- d) Any stakeholder who submitted feedback at the previous Sprint Review, ensuring continuity of input.

*explanation:* The Sprint Review is open to any stakeholders the Product Owner considers relevant — there is no prescribed restriction to sponsors or prior attendees. Limiting attendance to guard against 'too many voices' contradicts the transparency and collaboration the event is designed to foster. Excluding stakeholders entirely defeats the event's purpose.

### 327. SD-AI-I · D2 · task 2.6 · `7ef2c22c`

> Engage in the Sprint Retrospective and commit to improvement

**During a Retrospective, a developer stays silent while the Scrum Master presents all observations. What best reflects correct participation?**

- a) The developer should wait for the Sprint Review, which includes the full team's input on quality.
- b) The developer should submit written feedback afterward for the Scrum Master to use next time.
- **`KEY` c) The developer should share their perspective; all team members are expected to contribute.**
- d) Silence is appropriate; the Scrum Master is responsible for surfacing all process concerns.

*explanation:* The Retrospective is a collaborative event; all Scrum Team members are expected to inspect and contribute observations and improvement ideas. Treating silence as appropriate misplaces responsibility on the Scrum Master alone. Submitting post-event written feedback bypasses real-time candid discussion. Waiting for the Sprint Review sends process concerns to the wrong event.

### 328. SD-AI-I · D2 · task 2.7 · `1125e1c0`

> Apply estimation and forecasting, treating AI estimates as input not authority

**A team completed 8, 9, 7, and 10 items in the last four sprints. Their backlog holds 36 items. Using throughput, what is the most defensible forecast?**

- a) Exactly 3.6 sprints; precise division of backlog by average throughput gives the most accurate forecast.
- b) Exactly 4 sprints; dividing 36 by the average throughput of 9 gives a precise single-point answer.
- c) At least 6 sprints; throughput ignores complexity, so effort is routinely underestimated.
- **`KEY` d) Approximately 4–5 sprints, using the observed throughput range of 7–10 items per sprint.**

*explanation:* Forecasting with throughput should express a range that reflects observed variability, not a single precise number. Using the min–max band of 7–10 items per sprint yields roughly 4–5 sprints, honestly communicating uncertainty. Single-point forecasts imply false precision, and throughput does not systematically underestimate complexity across a sufficient sample.

### 329. SD-AI-I · D2 · task 2.7 · `a4fd4f55`

> Apply estimation and forecasting, treating AI estimates as input not authority

**An AI tool suggests 8 points for a feature. Two Developers argue it resembles a completed 13-point story. What should the team do?**

- a) Escalate the disagreement to the Product Owner, who holds final authority over story point assignments when Developers cannot agree.
- b) Discard the AI estimate entirely, since only unaided human judgment can produce valid relative size comparisons between stories.
- c) Accept the AI estimate without discussion, treating it as an objective baseline that removes human bias from the sizing conversation.
- **`KEY` d) Use the AI estimate as a conversation starter, then calibrate it against the 13-point reference story to reach a team-owned size.**

*explanation:* Developers own the forecast; AI output is an input, not an authority. Using the AI suggestion as a conversation starter and adjusting it against a known reference story keeps ownership with the team. Accepting the AI estimate without discussion surrenders that ownership to the tool. Escalating to the Product Owner is also wrong—story sizing belongs to the Developers, not the Product Owner.

### 330. SD-AI-I · D2 · task 2.8 · `7691342d`

> Self-manage: decide who does what, when, and how

**No Developer volunteers to take the next high-priority item at the Daily Scrum. The Scrum Master assigns it to the most available Developer. What should have happened instead?**

- a) Developers should have reached unanimous agreement before anyone could pick up the item.
- b) The item should have been returned to the Product Backlog since it was unassigned.
- c) The Scrum Master should have asked the Product Owner to formally assign the item.
- **`KEY` d) Developers should have coordinated among themselves to determine who takes the item.**

*explanation:* The Scrum Master assigning work replaces self-management with facilitated command-and-control. Developers coordinate task pickup themselves; unanimous consent is not required — collective decision-making is. Returning the item to the Product Backlog would be an unnecessary scope change.

### 331. SD-AI-I · D2 · task 2.8 · `1ff94d2d`

> Self-manage: decide who does what, when, and how

**On Day 3, the PMO reassigns two Developers to another project and tells remaining Developers which items to prioritize. What should happen?**

- a) Self-management is satisfied because the original Sprint Backlog was agreed collectively.
- b) The Scrum Master should approve the new priorities and update the Sprint Backlog for the team.
- c) The remaining Developers must comply; the PMO's reprioritization is valid given the team change.
- **`KEY` d) The Scrum Team surfaces the impediment; remaining Developers retain authority over the Sprint Backlog.**

*explanation:* Post-Sprint-Planning external reprioritization by the PMO is command-and-control, even if the original backlog was agreed collaboratively. The Developers retain self-management throughout the Sprint. The Scrum Master should help remove the organizational impediment rather than relay the PMO's directives.

### 332. SD-AI-I · D3 · task 3.10 · `defcba6e`

> Analyze whether a test suite actually constrains behavior, including AI-generated tests

**Management argues that adding two more QA reviewers to each sprint review will achieve built-in quality. Which analysis correctly identifies the flaw in this reasoning?**

- a) Built-in quality is owned by a dedicated quality engineer, so adding general QA reviewers to sprint review misassigns responsibility.
- **`KEY` b) More reviewers increase inspection capacity but do not change how developers construct code, so defects are created at the same rate.**
- c) Sprint review is the wrong ceremony; QA reviewers must attend sprint planning to influence quality outcomes.
- d) Built-in quality requires zero defects at every stage, so any story failing review cannot be accepted regardless of reviewer count.

*explanation:* Built-in quality means every developer applies quality practices during construction, not that more inspectors are added downstream. Inspection can catch defects but cannot prevent them from being introduced; only changing how code is written achieves that. Relocating reviewers to sprint planning does not address the construction problem. Imposing a zero-defect absolutism misrepresents the principle. Assigning built-in quality to a single dedicated role contradicts the whole-team ownership the principle requires.

### 333. SD-AI-I · D3 · task 3.10 · `bdc2dd4d`

> Analyze whether a test suite actually constrains behavior, including AI-generated tests

**A team uses the same AI model to generate both a microservice and its unit tests. Tests pass at 94% coverage. A senior developer claims the suite is insufficient. Which analysis best supports that claim?**

- a) AI-generated tests are always weaker than human-written tests because AI cannot enumerate edge cases.
- b) 94% coverage is insufficient; only 100% coverage confirms AI-generated tests catch all important defects.
- c) Tests are unreliable because running them in the same CI pipeline couples execution environments and invalidates results.
- **`KEY` d) The model may encode the same assumptions in both code and tests, leaving shared blind spots untested despite high coverage.**

*explanation:* When one model generates both code and tests, it tends to operationalize the same assumptions in both artifacts, so the tests exercise the implementation the model intended rather than the behavior the system must guarantee. High coverage cannot compensate for shared blind spots. Coupling CI execution environments does not create logical dependency between code and tests. Claiming AI always produces weaker tests is an unsupported absolute. Requiring 100% coverage as a correctness guarantee is also unsupported.

### 334. SD-AI-I · D3 · task 3.10 · `d794d2cc`

> Analyze whether a test suite actually constrains behavior, including AI-generated tests

**During a retrospective, a team debates whether shift-left testing and built-in quality are the same practice. Which analysis correctly distinguishes them?**

- a) Shift-left reduces tester headcount; built-in quality adds QA reviewers at each stage, so the two practices trade off against each other.
- **`KEY` b) Shift-left is a scheduling tactic for when testing occurs; built-in quality is a broader principle about how work is constructed.**
- c) Shift-left applies only to automated tests; built-in quality applies only to manual inspections, making them non-overlapping.
- d) They are synonyms; both describe moving the test suite earlier in the CI/CD pipeline to reduce late-stage defect costs.

*explanation:* Shift-left describes moving testing activities earlier in the development timeline, while built-in quality is the broader principle that every team member constructs work with quality practices embedded throughout, not just tested for afterward. They are related but not identical. Treating them as synonyms conflates a scheduling tactic with a construction philosophy. Restricting each practice to only automated or only manual work misrepresents both. Framing them as a headcount trade-off mischaracterizes both concepts.

### 335. SD-AI-I · D3 · task 3.2 · `7e788175`

> Distinguish Done from looks-done

**A team merges all sprint stories to the main branch after peer review, but dependent services have not been updated. All sprint backlog tasks are checked off. Which analysis best explains the team's actual Done status?**

- **`KEY` a) The increment is not Done; stale dependent services mean integration is incomplete and the debt is hidden.**
- b) The increment is Done because all planned tasks are checked off and code review confirms quality.
- c) The increment is Done for velocity tracking because partial Definition of Done compliance is acceptable.
- d) The increment is Done because merging to main branch constitutes integration and satisfies that criterion.

*explanation:* Merging code while dependent services remain stale means integration is only superficially complete; the increment cannot be verified end-to-end. Task completion and code review do not substitute for actual integration. Counting this as Done for velocity hides the real debt from stakeholders.

### 336. SD-AI-I · D3 · task 3.4 · `02db86a4`

> Keep the Increment releasable with continuous integration and delivery

**The main branch pipeline has been red for three days. Two Developers say it is a DevOps team problem. What is the correct stance?**

- a) Escalate to the DevOps team and wait; pipeline ownership belongs to infrastructure.
- b) Notify the Product Owner, who must approve a pause before the team can address the broken build.
- c) Continue feature work on branches; a red main does not affect releasability until Sprint Review.
- **`KEY` d) The Scrum Team collectively owns pipeline health and must treat a red main as an immediate blocker.**

*explanation:* Collective responsibility for the build means the Scrum Team — not a separate DevOps group — owns pipeline health. A red main branch breaks the precondition of Done and must be fixed immediately, not deferred to Sprint Review or delegated to another team.

### 337. SD-AI-I · D3 · task 3.8 · `2d9241f5`

> Conduct effective code review as a team practice

**A method is correct but names a variable 'x' with no context. The team's working agreement includes a naming convention. What should the reviewer do?**

- a) Rewrite the variable name directly in the PR to demonstrate the correct approach and keep the review cycle short.
- b) Block the PR and mark it as a defect, because flagging every deviation proves the reviewer examined the code thoroughly.
- **`KEY` c) Comment citing the team's naming convention, suggest a descriptive name as a concrete example, and leave the actual fix to the author.**
- d) Skip it, because naming choices reflect personal coding style and have no bearing on whether the method functions correctly.

*explanation:* Actionable feedback identifies the problem, cites the agreed standard, and proposes a direction while letting the author implement the fix — spreading ownership without the reviewer taking over. Skipping it conflates personal style with team standards, ignoring that the working agreement makes naming a shared commitment. Rewriting the variable directly oversteps the reviewer's role and removes the author's learning opportunity. Framing every finding as a blocker conflates thoroughness with defect count, undermining the collaborative spirit of code review.

### 338. SD-AI-I · D3 · task 3.9 · `eb24992e`

> Collaborate through pairing and mobbing; situate AI pair-programming within them

**A developer proposes replacing human pairing with an AI coding assistant to cut costs. How should the team respond?**

- a) Agree; AI assistants provide the same knowledge-sharing and collective ownership that human pairing delivers.
- b) Replace pairing with rigorous automated testing, which addresses the quality goal more scalably.
- **`KEY` c) Use AI to augment pairing but keep human pairing for the shared understanding it uniquely produces.**
- d) Agree only for junior developers; seniors already possess the knowledge pairing would transfer.

*explanation:* An AI assistant is a powerful supplement but cannot replicate the mutual accountability, tacit knowledge transfer, and team cohesion built through human pairing. Using AI to replace human pairing confuses output generation with shared understanding.

### 339. SD-AI-I · D3 · task 3.9 · `eccacbff`

> Collaborate through pairing and mobbing; situate AI pair-programming within them

**A developer proposes skipping code review because their AI coding assistant produces production-ready code. What should the team do?**

- a) Replace code review with increased automated test coverage, which catches AI errors more reliably than humans.
- **`KEY` b) Maintain full review and testing; AI-generated code requires the same human verification as any other code.**
- c) Skip review entirely; AI assistants are trained on high-quality code and generate fewer defects than humans.
- d) Skip review only for AI-generated boilerplate; apply full review to AI-generated business logic.

*explanation:* AI assistants can produce plausible but incorrect, insecure, or context-inappropriate code. Human review and testing remain essential. Treating AI output as production-ready without verification is a dangerous misconception regardless of the code's apparent quality.

### 340. SD-AI-I · D4 · task 4.1 · `1c30607b`

> Implement against a PBI as an executable specification, with AI assistance

**AI-generated code passes all acceptance criteria in a test run. A developer proposes skipping exploratory testing because the spec is fully satisfied. What should the team do?**

- a) Reject; the team should first expand the acceptance criteria to cover edge cases before closing the PBI.
- b) Accept; passing all criteria means the implementation is correct and further testing adds no value.
- c) Accept; skip exploratory testing only if the DoD does not explicitly require it.
- **`KEY` d) Reject; criteria verify specified behavior, but exploratory testing can surface defects outside the spec.**

*explanation:* Acceptance criteria confirm that specified behaviors are present, but they cannot cover every possible interaction or edge case — exploratory and regression testing remain valuable for finding defects outside the spec. Treating a passing criteria run as proof of total correctness confuses contractual compliance with comprehensive quality assurance. Expanding criteria retroactively also reverses the correct spec-first order.

### 341. SD-AI-I · D4 · task 4.1 · `0a37670f`

> Implement against a PBI as an executable specification, with AI assistance

**A developer receives a PBI with five acceptance criteria. The AI produces code satisfying four but leaves one unaddressed. What should the developer do?**

- a) Let the AI infer the missing behavior from context, then ship without further verification.
- **`KEY` b) Treat the gap as unfinished work and keep prompting the AI until all five criteria are satisfied.**
- c) Ship the code; four of five criteria passing shows the feature works as intended.
- d) Ask the Product Owner to decide whether the fifth criterion is still needed before continuing.

*explanation:* All acceptance criteria form the binding contract the implementation must fully satisfy; a PBI is not done until every criterion is met. Shipping with four of five satisfied confuses developer confidence with spec compliance. Delegating the decision entirely to the Product Owner, or letting the AI infer unspecified behavior, both bypass the spec-first discipline required.

### 342. SD-AI-I · D4 · task 4.1 · `db319e17`

> Implement against a PBI as an executable specification, with AI assistance

**Before prompting an AI agent to implement a PBI, a developer notices the acceptance criteria are intentionally vague. What is the correct action?**

- a) Let the AI generate the code first, then write the acceptance criteria afterward so the specification accurately reflects what was actually built.
- b) Proceed with prompting the AI, since vague criteria give it flexibility to explore the solution space and produce a higher-quality implementation.
- c) Convert the criteria into Gherkin Given-When-Then syntax before prompting, because plain-language criteria cannot drive AI-assisted execution reliably.
- **`KEY` d) Refine the criteria with the Product Owner until each one describes a verifiable, observable behavior, then use those criteria to prompt the AI.**

*explanation:* Spec-first discipline requires clear, verifiable acceptance criteria before implementation begins; vague criteria cannot serve as a binding contract for the AI or the team. Formal syntax such as Gherkin is not required — plain language with observable outcomes is sufficient, so converting to a specific format is an unnecessary constraint. Proceeding with vague criteria delegates scope decisions to the AI rather than the Product Owner. Writing criteria after implementation reverses the correct order, documenting output rather than driving it.

### 343. SD-AI-I · D4 · task 4.10 · `c55258bb`

> Keep accountability for the Increment human and collective

**Management mandated a specific AI coding tool. That tool introduced a security vulnerability now found in the shipped Increment. How should the Scrum Team treat accountability?**

- a) Accountability is split proportionally between management, who chose the tool, and the Developers, who used it.
- **`KEY` b) The Developers remain fully accountable; a mandated tool is still a tool, and accountability cannot be transferred upward.**
- c) Accountability shifts to management, because they imposed the tool and the team had no discretion.
- d) Accountability is shared among the AI model's trainers, the vendor, and the Developers, since all contributed.

*explanation:* Accountability for the Increment is human and collective and cannot be reassigned because a tool was mandated. The Developers accepted and shipped the output; that decision keeps accountability with them. Distributing it across trainers, vendors, or managers confuses legal liability with Scrum accountability.

### 344. SD-AI-I · D4 · task 4.10 · `87069027`

> Keep accountability for the Increment human and collective

**The team is pressured to ship immediately because the AI tool flagged the Increment as meeting all quality criteria. What should the Developers do?**

- **`KEY` a) Ship only after human verification confirms the Definition of Done is met; the AI's verdict does not discharge their accountability.**
- b) Ask the Scrum Master to approve shipment, since overseeing tool use makes the Scrum Master accountable for this decision.
- c) Ship immediately — an AI quality check satisfies the team's accountability obligation just as a human review would.
- d) Document the AI's approval; this disclosure transfers quality accountability to the vendor if defects emerge later.

*explanation:* The Developers must apply their own judgment to confirm the Definition of Done is met; an AI tool's output is an input to that decision, not a substitute for it. Accountability for the Increment is human and cannot be discharged by a tool's verdict, a Scrum Master's approval, or a disclosure document.

### 345. SD-AI-I · D4 · task 4.10 · `42248e2b`

> Keep accountability for the Increment human and collective

**An AI tool generated 80% of a Sprint's code. A Developer argues their personal accountability is proportionally lower since they wrote only 20%. How should the team respond?**

- **`KEY` a) Reject it — each Developer is fully accountable for the whole Increment regardless of authorship share.**
- b) Escalate to the Product Owner to decide accountability distribution when AI contribution exceeds human contribution.
- c) Accept it partially — Developers who only reviewed AI output bear reduced accountability compared to those who wrote code.
- d) Accept it — accountability is reasonably scaled to the share of work each Developer personally authored.

*explanation:* Collective accountability is not divided by contribution percentage; each Developer is accountable for the entire Increment. Scaling accountability to authorship share treats the AI as a partial accountability-holder, which it cannot be. The Product Owner has no role in distributing Developer accountability.

### 346. SD-AI-I · D4 · task 4.4 · `87f8df97`

> Apply the generate-then-verify loop and own the verification

**A Developer includes the full DoD in a prompt. The AI output references each DoD item. The Developer concludes no further verification is needed. What should the Developer do?**

- a) Integrate the output; the AI referencing each DoD item confirms internal validation.
- b) Integrate the output; a DoD-aware prompt means verification is built into generation.
- **`KEY` c) Independently verify the output satisfies each DoD criterion before integrating.**
- d) Have the Scrum Master verify DoD compliance whenever AI tooling is involved.

*explanation:* A prompt that includes the DoD guides generation but does not perform verification. The AI referencing DoD items in its output is not evidence those items are satisfied. The Developer must execute an independent verification step; prompt engineering and verification are separate activities.

### 347. SD-AI-I · D4 · task 4.4 · `e5102d70`

> Apply the generate-then-verify loop and own the verification

**A Developer argues the DoD applies only to the final increment, not to AI-generated refinement notes. What should the Developer do?**

- **`KEY` a) Verify the notes against applicable DoD criteria before using them as input.**
- b) Have the Product Owner review the notes, since they own the DoD's scope.
- c) Ask the AI to cross-check its notes against the DoD and proceed if it finds no gaps.
- d) Skip verification; the DoD targets shippable increments, not intermediate artifacts.

*explanation:* DoD criteria relevant to an artifact apply when that artifact is used to build the increment. Unverified intermediate work introduces unverified risk into the final product. The Developer must verify each AI-generated artifact rather than defer to the Product Owner or the AI itself.

### 348. SD-AI-I · D4 · task 4.6 · `8edc38b8`

> Operate agentic, multi-step AI dev workflows with a human in the loop

**An AI agent completes the Implement stage and all automated tests pass. The Review stage is next. What should the human developer do?**

- a) Skip Review, because passing automated tests already confirm correctness.
- b) Defer Review until the full workflow ends, since checkpoints only apply at completion.
- **`KEY` c) Apply AI tools and human judgment to validate decisions at accountability boundaries.**
- d) Rewrite the AI's code, since the Review checkpoint means replacing the agent's work.

*explanation:* Human checkpoints at accountability boundaries exist to validate decisions and risks beyond what automated tests cover. Tests verify behavior against specified cases but cannot assess scope alignment, security posture, or unintended side effects. Skipping Review assumes tests are sufficient, which they are not. Rewriting the agent's code misunderstands the reviewer's role, which is to approve, redirect, or escalate. Deferring until workflow completion ignores the purpose of staged checkpoints.

### 349. SD-AI-I · D4 · task 4.7 · `57eb5129`

> Recognize and mitigate risks specific to AI-generated code

**An AI generates Go code referencing ioutil.ReadAll, removed in Go 1.16. The project targets Go 1.20. What should the developer do?**

- a) Keep it; deprecated Go functions remain available indefinitely even after removal from the documentation.
- **`KEY` b) Replace it with io.ReadAll; AI training data includes pre-deprecation examples that no longer compile.**
- c) Keep it; the AI would not reference a removed API because its training reflects the latest stable release.
- d) Keep it; the Go compiler automatically redirects removed ioutil calls to their io package equivalents.

*explanation:* AI models are trained on large corpora that include code written before deprecations and removals, so they reproduce outdated patterns confidently. ioutil.ReadAll was removed in Go 1.16, meaning the generated code will fail to compile on Go 1.20. The Go compiler does not automatically redirect removed calls; the developer must substitute io.ReadAll. AI training data does not reliably reflect the most recent stable release of any language or library.

### 350. SD-AI-I · D4 · task 4.7 · `9bf98f8d`

> Recognize and mitigate risks specific to AI-generated code

**A developer confirms AI-generated SQL logic is correct, then ships without a security review. Which risk is left unmitigated?**

- a) The AI may have referenced a hallucinated database driver that does not exist in the registry.
- b) The AI may have used an ORM method that silently ignores query parameters at runtime.
- c) A subtle off-by-one error could act as both a logic flaw and a security vulnerability simultaneously.
- **`KEY` d) String concatenation in the query could allow SQL injection even though the logic is functionally correct.**

*explanation:* Security flaws such as SQL injection via string concatenation are not logical errors—the query can return correct results while still being injectable. A correctness review therefore misses this class of vulnerability. AI models trained on older examples frequently produce string-concatenated queries rather than parameterized ones, making this a predictable failure mode. A hallucinated driver would likely surface as an install error, not a security gap missed by logic review.

### 351. SD-AI-I · D4 · task 4.9 · `ba366ca7`

> Explain provenance, attribution, and licensing obligations for AI-assisted work

**An AI assistant reproduces code structurally similar to GPL-licensed code but not verbatim. A developer concludes no copyleft concern applies. Why is that conclusion incorrect?**

- a) Developer review transfers authorship and removes the original license chain regardless of structural similarity.
- **`KEY` b) Copyleft analysis uses a substantial-similarity standard, so structurally similar output can still trigger GPL obligations.**
- c) GPL applies only to verbatim copies; structurally similar output is outside the license's scope by definition.
- d) The concern is moot because commercial AI subscriptions include indemnification covering all derivative-work claims.

*explanation:* Copyright infringement analysis uses a substantial-similarity standard, not a verbatim-copy standard. AI-paraphrased or structurally similar output can still reproduce protectable expression and trigger copyleft obligations. Relying on non-verbatim form as a safe harbor misunderstands how copyright law evaluates derivative works.

### 352. SD-AI-I · D5 · task 5.2 · `68cbe3da`

> Determine how to clarify criteria, surface constraints, and negotiate scope with the Product Owner

**A developer must explain to the PO that a requested caching approach will create a data-consistency risk. How should the developer frame this?**

- a) Present it as a veto: the feature cannot be built with the requested approach.
- b) Raise the concern only if the team cannot find any workaround, to avoid overwhelming the PO.
- **`KEY` c) Describe the user impact and offer the PO two viable alternatives to choose from.**
- d) Resolve the caching design internally and implement without disclosing the tradeoff.

*explanation:* Surfacing a constraint means translating technical risk into terms the PO can act on — user impact and decision options — not blocking the feature outright. Framing it as a veto oversteps the developer's role; the PO decides. Resolving it internally withholds a value-affecting tradeoff. Withholding the risk until no workaround exists delays a decision the PO may need to make early.

### 353. SD-AI-I · D5 · task 5.3 · `72294f43`

> Explain how Developers work with the Scrum Master: surfacing impediments early and engaging in improvement

**How does engaging the Scrum Master's service differ from requesting managerial oversight?**

- a) Engaging the Scrum Master means reporting progress daily so the Scrum Master can identify impediments on the team's behalf.
- **`KEY` b) Engaging the Scrum Master means surfacing blockers so the Scrum Master can coach or remove obstacles, not direct work.**
- c) Engaging the Scrum Master means asking the Scrum Master to attend Developer meetings and approve decisions.
- d) Engaging the Scrum Master means escalating all technical and process decisions, since Developers own only the Sprint Goal.

*explanation:* The Scrum Master serves Developers by coaching, facilitating, and removing impediments — not by directing work, approving decisions, or monitoring progress as a manager would. Developers engage the Scrum Master by transparently surfacing what they need help with, while retaining self-management over how work is done.

### 354. SD-AI-I · D5 · task 5.5 · `f2646282`

> Uphold professional responsibility, including for AI-assisted work

**An AI tool auto-completes a user-authentication feature. A security researcher later finds an injection vulnerability in that code. Who bears professional responsibility?**

- **`KEY` a) The developer fully, because responsibility for merged code belongs to the developer regardless of how it was produced.**
- b) The AI vendor, because the vendor supplied defective code the developer incorporated in good faith.
- c) The security team, because vulnerability assessment falls within their specialized role, not the developer's.
- d) The developer, but with reduced culpability because the flaw was generated by the AI, not written intentionally.

*explanation:* Responsibility for code quality and security rests with the developer who reviewed, accepted, and merged it. AI authorship does not transfer or reduce that accountability. Claiming reduced culpability for AI-generated flaws and delegating responsibility to a security team both misrepresent where professional duty lies.

### 355. SD-AI-I · D5 · task 5.6 · `bf23e98a`

> Explain how over-reliance on AI erodes the fundamentals that make AI safe to use

**A Scrum team has used AI for backlog refinement for six months and now struggles to write user stories without it. Which concept best explains this?**

- **`KEY` a) Skill atrophy, because reduced independent practice has eroded the team's ability to perform the task unaided.**
- b) Normal learning progression, because tool dependence is an expected and harmless stage of skill development.
- c) Expertise consolidation, because senior practitioners internalize fundamentals permanently and AI reliance cannot erode that knowledge.
- d) Productivity gain, because completing more refinement sessions with AI also builds deeper story-writing expertise.

*explanation:* When practitioners stop exercising a skill independently, that skill degrades over time — this is skill atrophy. The team's difficulty writing stories without AI is a direct sign that the underlying competence has eroded from disuse. Completing more tasks with AI substitutes for the skill rather than building it, which is precisely the atrophy mechanism. The idea that expertise is permanently consolidated ignores that disuse causes erosion at all experience levels.

### 356. SD-AI-I · D5 · task 5.6 · `276213ab`

> Explain how over-reliance on AI erodes the fundamentals that make AI safe to use

**What is the primary reason 'AI-off' work sessions are recommended for practitioners who regularly use AI tools?**

- a) They demonstrate to stakeholders that the team can meet deadlines without technology, satisfying governance expectations.
- b) They allow teams to benchmark AI accuracy by comparing AI outputs against manually produced outputs on identical tasks.
- c) They reduce licensing costs by limiting AI usage to periods when productivity gains clearly justify the expense.
- **`KEY` d) They force practitioners to exercise independent judgment, preserving the evaluative capacity that makes AI-assisted work safe.**

*explanation:* AI-off sessions are not primarily about cost, compliance, or benchmarking — they exist to prevent skill atrophy by requiring practitioners to engage their own reasoning without AI support. That independent judgment is the foundation on which safe AI use rests; without it, practitioners lose the ability to catch AI errors. The other rationales describe secondary or incidental benefits, not the primary purpose.

### 357. SD-AI-I · D5 · task 5.6 · `44d20993`

> Explain how over-reliance on AI erodes the fundamentals that make AI safe to use

**Which statement accurately describes the relationship between deep mental models and safe AI use in product development?**

- a) Deep mental models develop naturally from frequent exposure to AI-generated solutions, so AI use gradually builds the models practitioners need.
- b) Deep mental models matter only in creative domains; in analytical product work, AI accuracy metrics substitute for practitioner understanding.
- c) Deep mental models were necessary before AI existed; rapid AI-enabled iteration makes them unnecessary for modern practitioners.
- **`KEY` d) Deep mental models let practitioners detect when AI output is plausible but wrong — a judgment that cannot be outsourced to AI.**

*explanation:* AI tools can produce confident, fluent, and wrong answers. Only a practitioner with a well-maintained mental model of the domain can recognize such errors. The claim that easy iteration removes the need for deep understanding ignores that iteration guided by flawed judgment compounds rather than corrects mistakes. The idea that mental models grow passively from observing AI output mistakes how expertise is actually built.

### 358. SD-AI-I · D5 · task 5.8 · `cd4a96cf`

> Translate legacy Scrum terminology to the 2020 Guide's canonical terms

**A job posting requires experience with the 'Development Team sub-team.' A candidate familiar with the 2020 Scrum Guide would recognize this as referring to which current concept?**

- **`KEY` a) Developers—the 2020 Guide eliminated the sub-team structure; those accountabilities now belong to Developers within one Scrum Team.**
- b) Developers—the 2020 Guide transferred the sub-team's self-managing responsibilities to the Scrum Master as a facilitation duty.
- c) The Scrum Team—the 2020 Guide merged the Development Team, Product Owner, and Scrum Master into a single flat role.
- d) Developers—the 2020 Guide kept the sub-team structure but renamed the group to reflect inclusive, non-technical membership.

*explanation:* The 2020 Scrum Guide removed the Development Team as a named sub-team. The people doing the work are now called Developers and are accountable members of one Scrum Team, with no nested sub-team layer remaining. The Scrum Master did not inherit those responsibilities.

### 359. SD-AI-I · D5 · task 5.8 · `288ebb29`

> Translate legacy Scrum terminology to the 2020 Guide's canonical terms

**A legacy document states 'the Development Team commits to the Sprint Backlog.' What does the 2020 Scrum Guide actually say about this?**

- **`KEY` a) The Sprint Backlog is a forecast; the Sprint Goal is its commitment, owned by the Developers.**
- b) The Sprint Goal is the Product Owner's commitment to stakeholders; the Sprint Backlog is a forecast.
- c) The Sprint Backlog is a forecast, so Developers are accountable only for effort, not selected items.
- d) The Sprint Backlog is the commitment because it contains the Sprint Goal and selected items.

*explanation:* The 2020 Scrum Guide states that the Sprint Backlog is a forecast of work planned to achieve the Sprint Goal, and the Sprint Goal is the Sprint Backlog's commitment — made by the Developers. Saying the Sprint Backlog itself is the commitment conflates the artifact with its associated commitment. Treating the Sprint Goal as a Product Owner promise to stakeholders misattributes who makes that commitment. Claiming Developers are accountable only for effort misrepresents the Guide's intent.

### 360. SD-AI-I · D5 · task 5.8 · `ce153e80`

> Translate legacy Scrum terminology to the 2020 Guide's canonical terms

**The 2020 Scrum Guide classifies the Sprint Backlog as a 'forecast.' What does that classification mean for Developer accountability?**

- a) Developers may swap Sprint Backlog items mid-Sprint without consulting the Product Owner, because a forecast is flexible.
- b) The change is cosmetic; a forecast and a commitment meant essentially the same thing in the 2017 Guide.
- **`KEY` c) Developers are accountable for the Sprint Goal; selected items are their best plan, not a binding delivery list.**
- d) Developers bear reduced accountability because a forecast implies estimation rather than commitment to specific items.

*explanation:* Labeling the Sprint Backlog a forecast clarifies that Developers commit to the Sprint Goal, not to a fixed item list. They remain fully accountable for that goal. 'Forecast' does not mean loose or optional, nor does it grant unilateral authority to swap items mid-Sprint.

---

# SM-AI-I — Scrum Master I — AI

**Source this certification cites:** The 2020 Scrum Guide.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 361. SM-AI-I · D1 · task 1.1 · `6a65726c`

> Articulate the Agile Manifesto's four values and twelve principles

**A project manager requires formal change control for any requirement arriving after the design phase. Which Agile Manifesto principle does this policy most directly contradict?**

- a) Sustainable pace — teams must limit late-arriving changes to protect delivery capacity.
- **`KEY` b) Welcoming change — Agile harnesses changing requirements for competitive advantage, even late in development.**
- c) Simplicity — formal change gates add overhead that maximizing work not done prohibits.
- d) Technical excellence — rigid change gates block the continuous design improvements good architecture requires.

*explanation:* The Manifesto principle on welcoming change explicitly covers requirements arriving even late in development, framing responsiveness as a competitive advantage for the customer. A policy that freezes requirements after design directly contradicts this. Sustainable pace and technical excellence are genuine principles but neither specifically addresses the timing of requirement changes.

### 362. SM-AI-I · D1 · task 1.5 · `b8c82f34`

> Explain lean thinking principles as they apply to Scrum

**A Product Owner delays finalizing a feature's technical architecture until the team learns more from early Sprints. Which Lean principle does this illustrate?**

- a) Waste reduction, because unneeded architecture documents are a form of over-production.
- b) Small batches, because splitting architecture decisions across Sprints limits work-in-progress.
- c) Flow, because removing architecture gates keeps work moving through the Sprint.
- **`KEY` d) Deferred commitment, because the decision is held open until the last responsible moment.**

*explanation:* Deferred commitment means preserving flexibility by delaying irreversible decisions until enough information exists — the last responsible moment. Avoiding architecture documents is waste reduction, not deferred commitment. Splitting decisions across Sprints describes small batches, and removing gates describes flow; neither captures the deliberate preservation of options that defines deferred commitment.

### 363. SM-AI-I · D1 · task 1.6 · `6ac08824`

> Recognize when transparency is compromised and trace consequences

**During Sprint Review, the team reports all items 'Done.' The Product Owner later finds several items lack passing acceptance tests. Which root cause best explains the transparency failure?**

- **`KEY` a) The Definition of Done was absent, inconsistently applied, or hidden from the Product Owner.**
- b) The Sprint Goal was not re-communicated after Sprint Planning, leaving stakeholders without updated visibility.
- c) The Product Backlog was too vague for developers to identify which acceptance criteria applied.
- d) The team lacked psychological safety to admit problems, making this an interpersonal rather than an artifact issue.

*explanation:* The Definition of Done is a transparency artifact that makes the meaning of 'Done' visible to everyone, including the Product Owner. When it is absent or not shared, status reports become unreliable and inspection is compromised. Psychological safety and backlog detail may contribute in some contexts, but the direct cause of hidden completion status is a compromised or invisible Definition of Done.

### 364. SM-AI-I · D1 · task 1.7 · `1f29816e`

> Analyze how AI-accelerated output can threaten empiricism, and how the Scrum Master safeguards inspection and adaptation

**A team adopts an AI tool that triples user stories completed per Sprint. Sprint Reviews become rushed and stakeholder feedback is superficial. Which root cause best explains the empirical risk?**

- a) Sprint Review cadence is misaligned with Sprint length, compressing feedback loops independently of AI output volume.
- **`KEY` b) Output volume exceeds inspection capacity, so adaptation decisions rest on work the team never genuinely examined.**
- c) The Product Owner has not re-ordered the backlog for faster delivery, creating a sequencing mismatch rather than an empirical one.
- d) AI-generated stories lack sufficient documentation, so artifacts fail the transparency pillar before inspection begins.

*explanation:* Empiricism requires that inspection is meaningful and informs adaptation. When output volume outpaces inspection capacity, reviews become superficial and adaptation lags—the empirical pillars degrade even if artifacts are visible. Poor documentation does not explain rushed reviews caused by volume, and cadence misalignment or backlog ordering are separate concerns that do not capture the output-velocity threat the Scrum Master observed.

### 365. SM-AI-I · D1 · task 1.7 · `41099eea`

> Analyze how AI-accelerated output can threaten empiricism, and how the Scrum Master safeguards inspection and adaptation

**An AI tool produces a complete prototype in two days. The team spends the remaining eight days adding AI-generated features without stakeholder review. The Scrum Master intervenes. Which empirical failure is most directly addressed?**

- a) Transparency failure, because the prototype was never shared in a repository accessible to stakeholders during the Sprint.
- b) Sprint Goal failure, because adding unrequested features deviated from the agreed goal and original scope.
- c) Definition of Done failure, because post-prototype features were never validated against acceptance criteria.
- **`KEY` d) Inspection and adaptation failure, because eight days of output accumulated without feedback that could have redirected the work.**

*explanation:* The core empirical failure is that the team continued producing output for eight days without inspecting the prototype with stakeholders and adapting based on their feedback. This is a direct breakdown of inspection and adaptation: work accumulated without the feedback loop empiricism depends on. Transparency, Sprint Goal alignment, and Definition of Done are separate concerns that do not capture the missed inspect-and-adapt cycle the Scrum Master is protecting.

### 366. SM-AI-I · D2 · task 2.1 · `24168c9a`

> Define the Scrum Team's composition and size constraints

**According to the Scrum Guide, which statement about internal Scrum Team structure is correct?**

- a) Large Scrum Teams may form a dedicated testing sub-team to maintain quality
- b) Developers may elect a team lead sub-role to represent them in Scrum events
- **`KEY` c) Scrum Teams are self-managing with no sub-teams or hierarchies among Developers**
- d) The Scrum Master leads a coordination sub-team managing Developer dependencies

*explanation:* The Scrum Guide explicitly prohibits sub-teams and hierarchies within the Scrum Team; the team is self-managing. Creating testing sub-teams, coordination sub-teams, or elected leads all contradict this structural principle.

### 367. SM-AI-I · D2 · task 2.10 · `bf059170`

> Explain how AI agents participate in a Scrum Team as tools, and which accountabilities must remain human

**A Scrum Team uses an AI agent each Sprint to write code, run tests, and flag failing builds. A stakeholder asks whether the AI qualifies as a Developer. Which statement is correct?**

- a) The AI shares Developer accountability because Scrum defines accountabilities by outcomes, not by who produces them.
- b) The AI becomes a de facto Developer once the team depends on it continuously, even if the Scrum Guide is silent on this.
- c) The AI qualifies as a Developer because it performs Developer tasks and contributes to the Increment each Sprint.
- **`KEY` d) The AI is a tool; Developer accountability and commitment to the Sprint Goal remain with the human Developers.**

*explanation:* Scrum accountabilities — Product Owner, Scrum Master, Developer — are held by people. An AI performing coding or testing is a tool, not a team member, regardless of how capably it contributes. Saying consistent task performance confers accountability confuses role behavior with human responsibility for outcomes. Saying accountability follows outcomes rather than identity has no basis in the Scrum Guide. Treating continuous dependency as conferring de facto status likewise has no grounding in Scrum.

### 368. SM-AI-I · D2 · task 2.11 · `42a917b3`

> Distinguish work a team may delegate to AI from the accountabilities it must retain

**The team asks an AI tool to summarize customer feedback from the Sprint Review. Which statement best describes this use of AI?**

- a) Permissible — after the organization formally validates the AI tool, human inspection of its summaries becomes discretionary rather than required.
- **`KEY` b) Permissible — summarization is delegable work AI may perform, but the team must inspect the output; accountability for the Increment always remains with the team.**
- c) Permissible — once stakeholders review and approve the published AI summary, that review substitutes for the team's own inspection of the output.
- d) Impermissible — summarizing Sprint Review feedback is a retained human accountability tied directly to the Increment, so AI may not perform it under any circumstances.

*explanation:* Summarization is delegable work and AI may perform it. However, accountability for the Increment remains with the team regardless of who summarizes the feedback. Human inspection of AI output is always required — organizational tool validation does not make inspection optional, and stakeholder approval of a published summary does not substitute for the team's own review.

### 369. SM-AI-I · D2 · task 2.2 · `f7c16d3d`

> Explain the Scrum Master's accountability for the Scrum Team's effectiveness

**A Scrum Master is coaching the broader organisation on Scrum while the team is still maturing. A colleague argues this is premature. Which statement best explains why the colleague is wrong?**

- a) The Scrum Master must enforce Scrum rules within the team exclusively before addressing the wider organisation.
- b) Organisational coaching belongs to the Product Owner, so the Scrum Master is overstepping boundaries.
- **`KEY` c) Organisational Scrum coaching is part of the Scrum Master's accountability from the start, not a later phase.**
- d) External coaching is only valid once the team reaches a stable velocity proving their effectiveness.

*explanation:* The 2020 Scrum Guide describes the Scrum Master as serving the organisation by leading, training, and coaching Scrum adoption — this is concurrent with serving the team, not sequential. Treating organisational coaching as a later-stage activity misreads the scope of the effectiveness accountability.

### 370. SM-AI-I · D2 · task 2.5 · `cba4b229`

> Explain the Developers' four accountabilities

**Mid-Sprint, Developers realize the Sprint Goal cannot be met in the remaining time. How should this be classified?**

- a) A process failure; the Scrum Master holds direct accountability for resolving the situation as a formal impediment blocking the Sprint's progress.
- b) A Sprint Goal violation; Developers are permitted to revise the Sprint Goal mid-Sprint to realign it with what is realistically achievable in the time remaining.
- c) Expected variance; Developers should document the issue and wait until the Sprint Retrospective to formally surface and discuss it with the full Scrum Team.
- **`KEY` d) A daily adaptation trigger; Developers must collaborate with the Product Owner immediately rather than waiting for the Retrospective to address the risk.**

*explanation:* When the Sprint Goal is at risk, Developers must adapt their plan and collaborate with the Product Owner immediately. Waiting for the Retrospective delays a necessary response. Revising the Sprint Goal mid-Sprint is not permitted by the Scrum Guide. Treating it as a Scrum Master impediment misplaces the accountability, which belongs to the Developers.

### 371. SM-AI-I · D2 · task 2.7 · `59c4cd39`

> Identify accountability boundary violations

**The Scrum Master creates a project plan with milestones, resource allocations, and a critical path, then presents it to management as the team's delivery commitment. Which dysfunction does this represent?**

- a) The SM is violating the Developers' boundary because resource allocation belongs exclusively to the self-managing team.
- b) No boundary is violated because the SM is accountable for organizational transparency and a plan achieves that.
- **`KEY` c) The SM is substituting a project-manager artifact for empirical planning, violating the SM's own accountability boundaries.**
- d) The SM is exceeding the PO's boundary because only the PO may communicate delivery forecasts to management.

*explanation:* Creating a project plan with milestones and resource allocations is a classic Scrum Master-as-project-manager anti-pattern. The SM's accountability is to enable empirical process and Scrum adoption, not to produce command-and-control planning artifacts or make delivery commitments on the team's behalf. Organizational transparency is achieved through Scrum artifacts, not traditional project plans.

### 372. SM-AI-I · D2 · task 2.8 · `19402b7a`

> Explain cross-functionality as a property of the whole Scrum Team

**A Scrum Team has a UX designer, two developers, a tester, and a DevOps engineer. No single member can perform all roles. Which statement best describes this team's cross-functionality?**

- **`KEY` a) The team is cross-functional because it collectively holds all skills needed to deliver an Increment without external dependency.**
- b) The team is not cross-functional because true cross-functionality requires every member to perform every role.
- c) The team is cross-functional only if each specialist's skill area is unique and no overlap exists between members.
- d) The team is not cross-functional because each member specializes in only one discipline and cannot perform the others' tasks.

*explanation:* Cross-functionality is a property of the team as a whole: the team collectively possesses all skills required to create value, not each individual separately. The misconception that every member must perform every role confuses individual versatility with team-level capability coverage. Unique specialization per member and zero overlap are not requirements of cross-functionality.

### 373. SM-AI-I · D2 · task 2.9 · `0908734a`

> Recognize that "Developer" applies to any team member, not just software engineers

**The 2020 Scrum Guide uses 'Developer' rather than 'team member' or 'specialist.' What does this term signal?**

- **`KEY` a) That the accountability is for creating the Increment, applicable across any discipline or domain.**
- b) That the accountability belongs only to contributors with a formally defined technical skill set.
- c) That Scrum is primarily a software framework and extends to other domains only with adaptation.
- d) That non-coding specialists such as designers hold a different, unlisted accountability.

*explanation:* The 2020 Scrum Guide uses 'Developer' to name an accountability — commitment to creating the Increment — not to restrict it to software or technical disciplines. The guide removed prior software-specific language to make clear the term applies across all domains and skill sets, with no separate unlisted accountability for non-coding contributors.

### 374. SM-AI-I · D2 · task 2.9 · `5cc15507`

> Recognize that "Developer" applies to any team member, not just software engineers

**The 2020 Scrum Guide removed software-specific language from the Developer definition. What was the primary purpose of that change?**

- **`KEY` a) To make Scrum applicable in any domain by allowing any Increment-contributing member to hold the Developer accountability.**
- b) To signal that Scrum applies only to digital products, expanding Developer beyond programmers to all tech roles.
- c) To clarify that Scrum Masters may also act as Developers when facilitation duties leave capacity available.
- d) To confirm testers and QA specialists as Developers while keeping writers and marketers outside that accountability.

*explanation:* The 2020 Scrum Guide removed software-centric language precisely to make Scrum usable in any domain — marketing, hardware, research, and beyond — by defining Developer as anyone contributing to the Increment, with no restriction by discipline. Limiting the change to digital products or to specific roles such as testers still imposes boundaries the Guide intentionally eliminated. The change also has no bearing on whether Scrum Masters may simultaneously hold the Developer accountability.

### 375. SM-AI-I · D3 · task 3.1 · `7d8e2f57`

> State the maximum timebox for each event

**Which Scrum event has a fixed 15-minute timebox that does not scale with Sprint length?**

- **`KEY` a) Daily Scrum, whose timebox is flat and independent of Sprint length**
- b) Sprint Retrospective, the shortest collaborative Scrum event
- c) Sprint Review, because stakeholder availability limits its duration
- d) Sprint Planning, because teams always need the same preparation time

*explanation:* The Daily Scrum is the only Scrum event with a non-scaling, flat timebox of 15 minutes. Sprint Planning, Sprint Review, and Sprint Retrospective all have maximum durations anchored to a one-month Sprint and scale proportionally for shorter Sprints. The Sprint Retrospective is not the shortest event by its maximum timebox.

### 376. SM-AI-I · D3 · task 3.11 · `de78b5f3`

> Use AI-generated signal as input to inspection without ceding the team's decision-making

**An AI tool flags a high risk of missing the next Sprint Goal. What is the team's appropriate next step?**

- **`KEY` a) Discuss the metric at the next Scrum event, assess whether the risk is real, and decide on a response together.**
- b) Defer action until sprint end, since leading indicators are predictive and only final outcomes should drive decisions.
- c) Let the AI tool trigger an automatic scope-reduction rule until the risk indicator clears.
- d) Treat the flag as a confirmed impediment and escalate it to the Product Owner and management immediately.

*explanation:* A leading-indicator flag is a signal to inspect, not a confirmed fact. The team discusses it, applies its own judgment about whether the risk is real, and decides on a response together. Treating it as a confirmed impediment skips interpretation, automating a scope change transfers decisions to the tool, and waiting until sprint end ignores a potentially actionable signal.

### 377. SM-AI-I · D3 · task 3.4 · `b3cf23ec`

> Explain the Daily Scrum's purpose and rules

**Which statement best describes the primary purpose of the Daily Scrum?**

- a) To surface any team topics that need group discussion during the Sprint.
- b) To report each Developer's individual progress to the Scrum Master and Product Owner.
- **`KEY` c) To inspect progress toward the Sprint Goal and adapt the next day's plan.**
- d) To assign tasks among Developers and plan the full day's work in detail.

*explanation:* The Daily Scrum's defined purpose is to inspect progress toward the Sprint Goal and adapt the next day's plan. It is not a reporting mechanism for the Scrum Master or Product Owner, a general communication forum, or a task-assignment session.

### 378. SM-AI-I · D3 · task 3.4 · `fc76c765`

> Explain the Daily Scrum's purpose and rules

**A Scrum team's Daily Scrum consistently runs 25 minutes because Developers resolve technical impediments during it. What does this pattern reveal about the team's understanding?**

- a) The timebox is a guideline; teams may extend it when the impediments being discussed directly threaten the Sprint Goal.
- b) The Scrum Master should enforce the timebox by cutting off discussion and closing the meeting at 15 minutes.
- c) The Daily Scrum timebox resets each day, so occasional overruns average out and do not violate Scrum rules.
- **`KEY` d) The Daily Scrum is timeboxed at 15 minutes; detailed problem-solving belongs in follow-on conversations outside the event.**

*explanation:* The Daily Scrum is a fixed 15-minute timebox regardless of discussion importance or Sprint pressure. Detailed impediment resolution belongs in separate follow-on conversations, not inside the event itself. Placing enforcement authority with the Scrum Master confuses facilitation with Developer self-management. Treating the timebox as a flexible guideline or as something that resets daily are common but incorrect mental models; the Scrum Guide makes no provision for extending or averaging the timebox.

### 379. SM-AI-I · D3 · task 3.4 · `457bfb49`

> Explain the Daily Scrum's purpose and rules

**During a Daily Scrum, the team begins a detailed technical debate about a complex impediment. How does the Scrum framework characterize this?**

- **`KEY` a) It is an anti-pattern; note the impediment and defer detailed discussion until after the event.**
- b) It is appropriate because resolving impediments immediately is the Daily Scrum's core function.
- c) It is expected; the Product Owner should join to reprioritize the backlog based on the outcome.
- d) It is acceptable if the Scrum Master extends the timebox to allow full resolution.

*explanation:* The Daily Scrum is an inspection and planning event, not a problem-solving session. Impediments identified there are noted and addressed in a separate conversation after the event, keeping the 15-minute timebox intact.

### 380. SM-AI-I · D3 · task 3.5 · `b15f9217`

> Describe the Sprint Review as a working session, not a status report

**How does the Sprint Review differ most fundamentally from a product demonstration?**

- a) The Sprint Review requires stakeholder sign-off on the Increment; a demo only shows work without approval.
- **`KEY` b) The Sprint Review is a collaborative session that produces backlog changes; a demo is a one-way showcase.**
- c) The Sprint Review is attended only by the Scrum Team; a demo is open to any external stakeholder.
- d) The Sprint Review is time-boxed to one hour; a demo has no time constraint and can run indefinitely.

*explanation:* A demo is a one-way presentation; the Sprint Review is an interactive working session where stakeholders and the Scrum Team inspect the Increment and adapt the Product Backlog together. The Sprint Review does not require sign-off, is not limited to one hour for all Sprint lengths, and stakeholders are invited participants, not excluded.

### 381. SM-AI-I · D3 · task 3.6 · `b33f6f7b`

> Facilitate the Sprint Retrospective with a focus on team process

**At the Sprint Retrospective, the team wants to focus only on incomplete product features. As Scrum Master, what should you do?**

- **`KEY` a) Redirect the team: incomplete features belong in the Sprint Review; the retrospective should inspect how the team worked and followed its process.**
- b) Allow the discussion, since any topic that affected the Sprint outcome is valid retrospective content and the team should set its own agenda.
- c) Note the incomplete features as process failures and include them as improvement items in the next Sprint Backlog.
- d) Broaden the discussion to include both incomplete features and process observations, balancing product and team concerns in one session.

*explanation:* The Sprint Retrospective's defined purpose is to inspect the team itself — people, interactions, processes, and tools — not to re-examine product scope. Incomplete features belong in the Sprint Review and the Product Backlog. Allowing an unredirected product discussion displaces the process inspection the event is designed to produce. Blending both topics dilutes the retrospective's focused purpose. Logging incomplete features as process failures conflates delivery outcomes with process improvement.

### 382. SM-AI-I · D3 · task 3.7 · `66de9c82`

> Identify when a Sprint can be canceled and by whom

**How does the Scrum Guide characterize Sprint cancellation?**

- a) A standard corrective action when the team cannot meet the Sprint Goal.
- b) A normal event expected whenever business circumstances change.
- **`KEY` c) A rare event that is traumatic for the Scrum Team.**
- d) A routine scope-adjustment tool when requirements shift mid-Sprint.

*explanation:* The Scrum Guide explicitly calls Sprint cancellation rare and traumatic. It is not a routine or expected adjustment mechanism, and it is not triggered simply because the team struggles to meet the Sprint Goal.

### 383. SM-AI-I · D3 · task 3.7 · `c30d713c`

> Identify when a Sprint can be canceled and by whom

**Which statement about Sprint cancellation is TRUE according to the Scrum Guide?**

- **`KEY` a) Only the Product Owner can cancel, and only when the Sprint Goal is obsolete.**
- b) The Scrum Master can cancel when impediments make the Sprint Goal unachievable.
- c) Cancellations are common whenever significant new requirements emerge mid-Sprint.
- d) Any organizational leader can cancel by directing the Developers to stop work.

*explanation:* The Scrum Guide is unambiguous: the Product Owner alone holds cancellation authority, and the sole trigger is an obsolete Sprint Goal. Cancellations are rare, not routine, and no other role — including the Scrum Master — shares this authority.

### 384. SM-AI-I · D3 · task 3.9 · `d199b366`

> Select a Sprint Goal that is coherent and outcome-focused, and distinguish it from the Product Backlog items selected for the Sprint

**Mid-Sprint, Developers find one selected item is technically infeasible, but a different unplanned item would still achieve the Sprint Goal. What should the Developers do?**

- a) Cancel the Sprint, because one infeasible item means the Sprint Goal can no longer be achieved.
- b) Wait for next Sprint Planning, because the Sprint Backlog cannot be changed once the Sprint begins.
- c) Finish all originally selected items first, since completing every item automatically fulfills the Sprint Goal.
- **`KEY` d) Swap in the new item, because the Sprint Goal is the commitment and selected items are flexible means.**

*explanation:* The Sprint Goal is the singular committed objective; selected Product Backlog items are the means to reach it and can change during the Sprint when doing so better serves that Goal. Cancelling the Sprint is only warranted when the Sprint Goal itself becomes obsolete, not when a single item proves infeasible. Treating the Sprint Backlog as frozen confuses the immutability of the Goal with the intentional flexibility of the items. Completing all original items regardless of feasibility mistakes the items for the Goal itself.

### 385. SM-AI-I · D4 · task 4.1 · `bece4ebf`

> Identify each artifact's commitment

**The 2020 Scrum Guide introduced artifact commitments as a formal addition. Which statement about that change is correct?**

- a) The Product Goal was the sole new addition in 2020; Sprint Goal and Definition of Done were already named commitments.
- b) Commitments were always in the Scrum Guide; 2020 only reorganized existing language.
- c) Only the Definition of Done was added in 2020; Product Goal and Sprint Goal already existed as commitments.
- **`KEY` d) All three commitments — Product Goal, Sprint Goal, Definition of Done — were formally introduced as a structure in 2020.**

*explanation:* The 2020 Scrum Guide formally introduced the concept of commitments for each artifact, pairing the Product Goal with the Product Backlog, the Sprint Goal with the Sprint Backlog, and the Definition of Done with the Increment. This three-part structure was new in 2020, not a rewording of prior text. The other options each misattribute which elements were truly new.

### 386. SM-AI-I · D4 · task 4.11 · `4002b96f`

> Apply the Definition of Done and artifact transparency to work generated or assisted by AI

**A team's DoD requires peer code review. A Developer proposes skipping it for an AI-generated module, citing fewer AI errors. What should the team decide?**

- a) Apply a reduced review checklist to the AI module, reserving the full checklist for human-authored modules.
- b) Skip peer review; the DoD's review criterion was designed for error-prone human-authored code only.
- c) Ask the Product Owner to waive the review criterion for this Sprint given the AI tool's track record.
- **`KEY` d) Conduct peer review as required; AI consistency claims do not justify relaxing shared DoD criteria.**

*explanation:* The Definition of Done is a shared standard that applies uniformly to all Increment work. Perceived AI consistency does not authorize relaxing it. The Product Owner cannot unilaterally waive DoD criteria, and a reduced checklist for AI work would create an inconsistent, non-transparent standard.

### 387. SM-AI-I · D4 · task 4.2 · `815e16c0`

> Explain the Product Backlog as an emergent, ordered list owned by the PO

**A stakeholder insists that high-ranked backlog items are committed and cannot be moved. A Product Owner disagrees. Who is correct?**

- **`KEY` a) The Product Owner — any item can be reordered, added, or removed at any time based on new information.**
- b) The stakeholder — top-ranked items are implicitly committed and require a Sprint Review decision to move.
- c) The Scrum Master — who must decide whether new feedback justifies overriding the current order.
- d) Both — the item can move, but only after formal stakeholder approval is documented.

*explanation:* No Product Backlog item is ever committed simply by its position. The Product Owner may reorder, add, or remove items whenever new information warrants it. Requiring stakeholder approval or treating high-ranked items as locked contradicts the emergent, adaptive nature of the backlog.

### 388. SM-AI-I · D4 · task 4.3 · `80ed1834`

> Explain that the Sprint Backlog is created by and for the Developers

**Which statement correctly describes the three components of the Sprint Backlog?**

- a) The Sprint Goal, the selected Product Backlog items, and the high-level release roadmap showing upcoming feature delivery.
- b) The Sprint Goal, the Definition of Done, and the selected Product Backlog items, since Done criteria govern how work is completed each Sprint.
- c) The selected Product Backlog items and the Developers' delivery plan, with the Sprint Goal maintained as a separate, standalone artifact.
- **`KEY` d) The Sprint Goal, the selected Product Backlog items, and the Developers' plan for delivering the Increment.**

*explanation:* The Sprint Backlog has exactly three parts: the Sprint Goal (the why), the selected Product Backlog items (the what), and the Developers' plan for delivering the Increment (the how). The release roadmap is a product-level tool, not a Sprint Backlog component. The Sprint Goal is an integral part of the Sprint Backlog, not a separate artifact. The Definition of Done is a Scrum artifact in its own right, not a Sprint Backlog component.

### 389. SM-AI-I · D4 · task 4.7 · `3c30a35e`

> Distinguish artifact transparency from artifact perfection

**The team's Definition of Done is weak — it omits several quality checks. What is the correct action regarding transparency?**

- a) Adopt a stronger template from another team to look credible.
- b) Keep it internal until the team strengthens it.
- c) Share it only with the Scrum Master until stakeholders formally request it.
- **`KEY` d) Publish it as-is so the gap is visible and can drive improvement.**

*explanation:* A weak Definition of Done that is visible enables inspection and targeted improvement. Hiding it to protect appearances is the opposite of transparency. Adopting another team's template misrepresents the team's actual standard. Restricting access to the Scrum Master adds an unnecessary gate with no Scrum basis.

### 390. SM-AI-I · D4 · task 4.8 · `ccf9d14d`

> Explain refinement as an ongoing activity (NOT a formal event)

**Which statement best describes refinement in the Scrum framework?**

- a) The sixth Scrum event, distinct from the five official events, with no mandatory timebox.
- b) An optional add-on used only when the backlog lacks sufficient items for the next Sprint.
- **`KEY` c) An ongoing activity where the Product Backlog is broken down and detailed throughout the Sprint.**
- d) A one-time mid-Sprint session held to prepare backlog items before the next Sprint Planning.

*explanation:* The Scrum Guide describes refinement as an ongoing activity — not one of the five Scrum events — in which backlog items are decomposed and progressively detailed. It is neither a sixth event nor a single scheduled session, and it is a recognized part of the framework, not an optional add-on.

### 391. SM-AI-I · D4 · task 4.8 · `a5e99117`

> Explain refinement as an ongoing activity (NOT a formal event)

**A team schedules one 'Refinement Meeting' per Sprint and treats it as a required Scrum event. How should this practice be classified?**

- a) Correct Scrum, provided the Scrum Master facilitates it the same way as official events.
- **`KEY` b) An anti-pattern, because refinement is an ongoing activity, not a formal once-per-Sprint event.**
- c) Correct Scrum, because refinement is a sixth event the team may timebox as they choose.
- d) Acceptable Scrum, because the 10% capacity guideline implies one focused session per Sprint.

*explanation:* Treating refinement as a single formal meeting each Sprint is a recognized anti-pattern. The Scrum Guide explicitly states refinement is an ongoing activity, not one of the five Scrum events. The 10% capacity guidance describes a ceiling on effort, not a scheduling format.

### 392. SM-AI-I · D5 · task 5.10 · `23a48d5f`

> Identify the new impediments that arise in AI-augmented teams

**A developer used AI to implement a complex algorithm. The reviewer approves it quickly because it matches familiar codebase patterns. A week later, a subtle correctness defect is found. Which impediment was present?**

- **`KEY` a) Automation over-trust, because pattern familiarity was mistaken for verified correctness of the AI output.**
- b) A review bottleneck, because the reviewer lacked enough Sprint time to inspect the algorithm thoroughly.
- c) Eroded shared understanding, because the algorithm's logic was never discussed collectively before merging.
- d) A Definition of Done gap, because the DoD did not require deep inspection of pattern-consistent AI code.

*explanation:* Approving AI-generated output because it looks familiar is a form of automation over-trust — surface similarity to known patterns does not verify correctness. The impediment is accepting unverified AI output into the Increment. Calling it a DoD gap misidentifies the root cause as a missing rule rather than a cognitive bias toward trusting familiar-looking output. A review bottleneck requires evidence of time pressure, which is absent here.

### 393. SM-AI-I · D5 · task 5.10 · `38c5d513`

> Identify the new impediments that arise in AI-augmented teams

**A Scrum Team using AI code generation completes coding tasks in half the usual time, but the Sprint Goal is still missed. Reviewing AI output now consumes most of the Sprint. What impediment should the Scrum Master surface?**

- **`KEY` a) A review bottleneck where AI generation speed has made review, not creation, the constraint on flow.**
- b) A tooling mismatch requiring reduced AI usage so generation speed aligns with review speed.
- c) A temporary growing pain that will resolve itself as the team gains familiarity with the AI tool.
- d) A capacity problem solvable by assigning more reviewers until review time matches coding time.

*explanation:* When AI output is produced faster than the team can inspect it, review becomes the flow constraint — a structural review bottleneck. Adding more reviewers misdiagnoses the constraint as a headcount problem rather than a process design problem. Reducing AI usage treats the tool as the problem rather than redesigning the workflow. Calling it a growing pain defers a structural change that must be made explicitly.

### 394. SM-AI-I · D5 · task 5.2 · `08766949`

> Distinguish impediments from problems the team should resolve themselves

**During a Sprint, the team has debated a technical approach for two days with no resolution. What should the Scrum Master do?**

- a) Notify the Product Owner and transfer ownership, since delivery risk overrides team autonomy.
- b) Choose the technical approach for the team to restore Sprint momentum.
- **`KEY` c) Coach the team to reach their own decision, preserving their self-managing capability.**
- d) Formally escalate it as an impediment, since any unresolved debate exceeds normal team scope.

*explanation:* A technical disagreement is a team-owned problem. Self-managing teams are expected to resolve their own internal decisions, and the Scrum Master's role is to coach rather than intervene directly. Choosing the approach for the team undermines self-management. Escalating based solely on duration, or transferring ownership to the Product Owner, misrepresents what constitutes an impediment and contradicts the team's accountability for technical decisions.

### 395. SM-AI-I · D5 · task 5.2 · `4ba360d9`

> Distinguish impediments from problems the team should resolve themselves

**During a Sprint, the team disagrees on which coding standard to follow. They have the skills and authority to decide internally. What should the Scrum Master do?**

- a) Log it as an impediment; any disagreement that slows the team requires Scrum Master intervention.
- b) Select the standard directly; the Scrum Master must act decisively rather than defaulting to coaching.
- **`KEY` c) Coach the team to reach their own decision; this is a team-owned problem they can resolve.**
- d) Escalate it to the Product Owner, who is accountable for resolving issues that affect delivery.

*explanation:* A self-managing team with the skills and authority to decide internally owns this problem; the Scrum Master supports by coaching, not by intervening. Logging it as an impediment misapplies the impediment definition to a team-resolvable issue. The Product Owner has no accountability for internal working agreements. Selecting the standard directly undermines the team's self-management.

### 396. SM-AI-I · D5 · task 5.4 · `5535addc`

> Apply servant leadership behaviors

**A Scrum Master notices the team repeatedly skips the Sprint Retrospective, claiming it wastes time. Applying servant leadership, what should the Scrum Master do?**

- a) Take over all ceremony facilitation and enforce attendance as a managerial authority.
- b) Wait for an explicit team request before acting, since the Scrum Master needs an invitation to intervene.
- c) Defer to the team and cancel future Retrospectives, since servant leaders follow team decisions.
- **`KEY` d) Challenge the team's reasoning, explain the event's value, and help them improve how they use it.**

*explanation:* Servant leadership does not mean passive deference. The Scrum Master is accountable for Scrum's health and must proactively coach the team when they abandon valuable practices. Deferring unconditionally to team preferences confuses serving with compliance. Taking a managerial, enforcement role contradicts servant leadership. Waiting for an explicit invitation misrepresents the Scrum Master's proactive responsibility for the team's continuous improvement.

### 397. SM-AI-I · D5 · task 5.5 · `950475a6`

> Recognize psychological safety and how SM behavior affects it

**After a production incident, team members blame one colleague rather than examining the system. Which sign of low psychological safety does this most clearly illustrate?**

- a) Low morale, because job dissatisfaction causes teams to scapegoat rather than collaborate on root-cause analysis.
- b) Consensus-seeking, because the team converges on one explanation to avoid further conflict.
- **`KEY` c) Blame and defensiveness, because members deflect interpersonal risk by externalizing fault onto one individual.**
- d) Distrust of the Scrum Master, because members would share systemic causes if they trusted the facilitator.

*explanation:* Edmondson identifies blame and defensiveness as direct behavioral indicators of low psychological safety — members redirect interpersonal risk by scapegoating rather than exposing their own uncertainty or mistakes. This is distinct from low morale, which is a satisfaction construct, and distinct from distrust of the facilitator, which is a dyadic relationship rather than a team-level belief.

### 398. SM-AI-I · D5 · task 5.6 · `e207be67`

> Coach the Product Owner

**A new PO with strong domain knowledge repeatedly micromanages the Developers's technical approach. The Scrum Master should:**

- a) Validate the PO's involvement, since deep domain knowledge makes their technical guidance valuable.
- b) Tell the Developers to ignore the PO's technical instructions until coaching is complete.
- **`KEY` c) Ask the PO to reflect on which decisions belong to them versus the Developers in Scrum.**
- d) Escalate the boundary violation to management so formal role limits can be enforced externally.

*explanation:* Asking the PO to reflect on accountability boundaries is a coaching intervention that builds self-awareness without removing ownership. Telling the team to ignore the PO or escalating to management bypasses coaching entirely. Validating the behavior reinforces the anti-pattern regardless of the PO's domain expertise.

### 399. SM-AI-I · D5 · task 5.7 · `c9016aeb`

> Translate between legacy training terminology and the 2020 Scrum Guide

**A candidate's legacy workbook uses 'ceremonies.' On a current Scrum exam, can that term be used interchangeably with 'events'?**

- **`KEY` a) No; 'events' is the only term the 2020 guide uses, making 'ceremonies' legacy language.**
- b) Yes; the 2020 Scrum Guide accepts both terms as equivalent official labels.
- c) No; 'events' replaced 'ceremonies' because the 2020 guide reduced the number of formal occurrences.
- d) Yes; 'ceremonies' covers the four time-boxed meetings while 'events' refers only to the Sprint itself.

*explanation:* The 2020 Scrum Guide uses only 'events'; 'ceremonies' does not appear there. The number of events did not decrease — the terminology was standardized deliberately, not as a consequence of removing occurrences.

### 400. SM-AI-I · D5 · task 5.7 · `c10b3203`

> Translate between legacy training terminology and the 2020 Scrum Guide

**A legacy manual calls Developers 'self-organizing.' The 2020 Scrum Guide replaced that term with 'self-managing.' What does this shift primarily signal?**

- **`KEY` a) Developers decide who does what, how, and when — sharpening autonomy over task execution.**
- b) The change is cosmetic; both terms describe identical expectations for Developers.
- c) The whole Scrum Team collectively decides who performs each task each Sprint.
- d) The Scrum Master no longer facilitates Developer coordination since Developers now self-direct entirely.

*explanation:* The 2020 Scrum Guide replaced 'self-organizing' with 'self-managing' to explicitly extend Developer autonomy to deciding who does what, how, and when — not merely how the team forms. The change is not cosmetic; it sharpens the scope of that autonomy. The Scrum Master still serves the Developers, so removing facilitation is incorrect. 'Self-managing' applies specifically to Developers, not to the entire Scrum Team collectively assigning tasks.

---

# SM-AI-II — Scrum Master II — AI

**Source this certification cites:** The 2020 Scrum Guide.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 401. SM-AI-II · D1 · task 1.4 · `24ab3b5e`

> Analyze a Sprint in which the Sprint Goal was met and the scope selected at Sprint Planning was not all delivered

**Three Sprints in a row, a team has met its Sprint Goal while leaving one or two lower-priority Sprint Backlog items incomplete each time. The Scrum Master is preparing for a retrospective conversation about what this pattern reveals. Which interpretation of the pattern is most analytically accurate?**

- a) The pattern confirms underperformance: a well-calibrated team completes all selected items, so the fix is improving estimation accuracy until forecasts reliably match actual throughput each Sprint.
- **`KEY` b) The pattern is a planning signal: the team consistently over-selects scope relative to capacity, and Sprint Planning should focus on tighter scope selection rather than treating the recurring gap as a performance deficiency.**
- c) The pattern suggests sandbagging: the team may be deliberately selecting more work than it intends to finish so that leaving items behind appears normal rather than reflecting genuine capacity limits.
- d) The pattern is worth noting but not diagnosing: since the Sprint Goal was met each time, the appropriate retrospective focus is on collaboration and process, not on Sprint Backlog item completion rates.

*explanation:* Recurring undelivered items when the Sprint Goal is met is a planning signal — the team's scope selection at Sprint Planning is slightly exceeding actual capacity — not evidence of underperformance. The Scrum Guide describes the Sprint Backlog as a plan that evolves and as a forecast, so the gap informs future Sprint Planning rather than triggering an estimation-accuracy remediation. The framing that treats consistent incompletion as underperformance mistakes the forecast for a commitment, which is the core misconception this item tests. The sandbagging interpretation is a defensible hypothesis a practitioner might raise, but it requires evidence beyond the pattern described and cannot be the primary analytical conclusion. Redirecting the retrospective away from the completion pattern entirely is defensible — Sprint Goal achievement is paramount — but the pattern carries genuine planning information that a retrospective should surface.

### 402. SM-AI-II · D1 · task 1.5 · `aee87f49`

> Diagnose a self-management decision that conflicts with an organizational constraint

**A Scrum Team's senior Developer argues that, because the team decides 'who does what,' they can reassign a mandatory penetration-testing task—required by the company's information-security standard—to an external consultant without notifying the security office, since task assignment is purely internal. Is this within the team's self-management authority?**

- a) No: the Scrum Master should reject the reassignment because the Scrum Master is responsible for ensuring compliance with organizational standards and holds veto authority over team resourcing decisions that touch regulated activities.
- b) Yes: assigning work is within 'who does what,' and the security office has no standing to dictate the team's internal resourcing decisions once the team commits to delivering the required output.
- **`KEY` c) No: deciding who performs work is internal self-management, but the information-security standard specifies conditions for how testing must be conducted and reported—conditions the team cannot waive by reassigning the task without the security office's involvement.**
- d) Yes: because the team owns its Definition of Done, it owns all quality and compliance activities relevant to the Increment, including how penetration testing is sourced and executed, making security office involvement optional.

*explanation:* Self-management over task assignment operates within the constraints the organization sets on how that work must be performed. Declining the reassignment on the grounds that the security standard governs conditions of conduct—not merely who performs the task—is best because it correctly locates the boundary: the team may decide internally who does work, but it cannot silently waive the oversight, accreditation, and reporting requirements the security standard attaches to that work. Treating task assignment as purely internal once the team commits to delivering the output conflates the team's authority over coordination with authority over the standard's conditions. Inferring that owning the Definition of Done transfers ownership of the security standard repeats the same error in a different form. Declining the reassignment on the grounds that the Scrum Master holds veto authority over regulated resourcing decisions reaches the right outcome for the wrong reason: the boundary here is organizational, not a Scrum Master gatekeeping function the Scrum Guide does not describe.

### 403. SM-AI-II · D1 · task 1.6 · `01cfee34`

> Analyze pressure to cancel a Sprint while the Sprint Goal remains attainable

**Three days into a two-week Sprint, the company's largest customer cancels a contract the current Sprint Goal was built to support. The VP of Sales tells the Scrum Master the Sprint is now pointless and asks them to shut it down. The Product Owner, when reached, says the remaining backlog items still have value for other customers and that the Sprint Goal is worth pursuing. What is the most accurate analysis of this situation?**

- a) The Scrum Master should convene an emergency session with the VP, the Product Owner, and the Developers so all parties reach a shared decision before the Sprint continues or is cancelled.
- **`KEY` b) The Sprint Goal is not obsolete because the Product Owner judges it still delivers value; only the Product Owner may cancel a Sprint, and the VP's instruction alone cannot exercise that authority.**
- c) The contract loss makes the Sprint Goal obsolete by definition; the Product Owner should cancel immediately to avoid spending remaining capacity on work whose primary justification has disappeared.
- d) The Developers should assess whether the Sprint Goal is still worth completing and, if a majority disagrees, inform the Product Owner that the Sprint should be cancelled to protect the team's focus.

*explanation:* The 2020 Scrum Guide gives cancellation authority exclusively to the Product Owner and limits it to one condition: the Sprint Goal has become obsolete — meaning it no longer makes sense to pursue. The Product Owner has assessed the situation and concluded the goal retains value for other customers, so the obsolescence condition is not met. The VP of Sales holds no cancellation authority under Scrum regardless of the business significance of the event. The option proposing immediate cancellation conflates a significant market shift with genuine obsolescence. A contract loss is relevant context for the Product Owner's judgment, but it does not automatically render the Sprint Goal meaningless — especially when the Product Owner explicitly disagrees. The option proposing an emergency collective decision is defensible as a facilitation instinct, but it mislocates the authority: the Product Owner does not need collective agreement to decide whether the Sprint Goal is obsolete. Facilitating a conversation is appropriate; making cancellation contingent on shared consensus is not. The option giving Developers a majority-vote path to cancellation rests on a genuine misconception — that the team can initiate cancellation when they judge the goal unworthy. The Guide assigns that authority to the Product Owner alone; Developer sentiment informs the Product Owner's judgment but does not transfer the authority.

### 404. SM-AI-II · D1 · task 1.6 · `4d6e1c5e`

> Analyze pressure to cancel a Sprint while the Sprint Goal remains attainable

**With four days left in a Sprint, the Product Owner is traveling internationally and unreachable for 72 hours. The Developers have discovered that the Sprint Goal cannot be met due to a data-migration issue that surfaced yesterday. The Scrum Master and Developers agree the goal is now obsolete. A senior developer suggests the Scrum Master cancel the Sprint so the team can begin re-planning. What is the most accurate analysis of this situation?**

- a) The Scrum Master may cancel the Sprint because the team has collectively determined the goal is obsolete, and waiting 72 hours for the Product Owner would waste the remaining Sprint capacity on unachievable work.
- **`KEY` b) The Sprint cannot be cancelled without the Product Owner, regardless of the team's assessment or the Product Owner's availability — the Scrum Master should continue the Sprint and surface the situation the moment the Product Owner is reachable.**
- c) The Developers may vote to cancel since they are closest to the work, and the Product Owner's unavailability effectively delegates that authority to the people accountable for Sprint Backlog execution.
- d) The Scrum Master should cancel the Sprint as a temporary measure to protect the team, with the understanding that the Product Owner can ratify or reverse the decision upon return, preserving the spirit of the authority rule.

*explanation:* The 2020 Scrum Guide assigns Sprint cancellation authority exclusively to the Product Owner — there is no provision for delegation to the Scrum Master or the Developers under any circumstance, including unavailability. The team's agreement that the goal is obsolete is relevant input, but it does not transfer the decision. The 'temporary cancellation' framing in the second option is particularly tempting because it sounds pragmatic and reversible, but the Guide does not describe a provisional or ratifiable cancellation — the authority either belongs to the Product Owner or it does not. The Scrum Master's correct move is to continue the Sprint, make the situation fully transparent in writing, and engage the Product Owner at the earliest opportunity.

### 405. SM-AI-II · D1 · task 1.7 · `8313061d`

> Determine whether an item incomplete at Sprint end is a Definition of Done failure or a forecasting failure

**A team's throughput has been stable for six Sprints. This Sprint they completed every item they started, all meeting the Definition of Done, yet delivered only half their usual volume because two members were unexpectedly absent. How should the Scrum Master report this?**

- a) Neither failure; absences are external, so the Sprint outcome should not be classified or reported as either type.
- **`KEY` b) A forecasting failure; the capacity assumption was wrong, but no quality standard was breached because all completed work is Done.**
- c) A Done failure; reduced throughput signals that quality steps were skipped to compensate for the smaller team.
- d) Both failures; lower output always implies some items were rushed and did not truly meet the Definition of Done.

*explanation:* When all attempted items meet the Definition of Done and only the volume forecast was wrong, the failure is a forecasting failure, not a Done failure. Reduced throughput caused by capacity loss does not imply quality shortcuts; that inference is unsupported by the evidence given. Inferring a Done failure from lower output conflates two distinct failure modes. Refusing to classify the outcome at all leaves the team without the honest retrospective input they need.

### 406. SM-AI-II · D1 · task 1.8 · `f00c4919`

> Diagnose divergence between the Developers' daily plan and the Sprint Backlog

**A Scrum Master observes that the Daily Scrum consistently ends with Developers agreeing on the next day's tasks verbally, but those agreements are never reflected in the Sprint Backlog. The Sprint Goal is still achievable. What is the most accurate diagnosis?**

- a) The Product Owner should attend the Daily Scrum temporarily to enforce artifact discipline, since backlog accuracy affects stakeholder visibility into Sprint progress.
- b) The Daily Scrum is functioning as a status report rather than a planning session, so the Scrum Master should change the meeting format to prompt artifact updates before the event closes.
- c) The situation is acceptable: the Sprint Goal is still achievable, and the Sprint Backlog's purpose is to track commitment to the Product Owner rather than to document every intra-team planning conversation.
- **`KEY` d) The team's planning is happening but not being recorded: the Sprint Backlog has become a historical snapshot rather than a live plan, degrading its value as a transparency artifact for the team itself.**

*explanation:* The Sprint Backlog is the Developers' plan, and a plan that exists only verbally cannot be inspected by the team or anyone else — this is a transparency degradation regardless of Sprint Goal health. Changing the meeting format addresses a symptom rather than the underlying artifact-currency problem; the issue is not how the Daily Scrum is structured but that agreed plans are not recorded. Invoking Sprint Goal health to excuse the gap mistakes outcome for process integrity. Product Owner attendance at the Daily Scrum is not warranted here, and the Sprint Backlog's purpose is not to satisfy the Product Owner — it is the Developers' own plan for achieving the Sprint Goal.

### 407. SM-AI-II · D1 · task 1.9 · `0659a1b0`

> Analyze a Retrospective improvement that would require the team to depart from Scrum

**Midway through a Sprint, the team's Retrospective action from last Sprint — reducing meeting interruptions — has stalled because a department head keeps scheduling ad hoc calls with individual Developers. The team now proposes, in the current Retrospective, to skip Daily Scrums on days when the department head's calls are scheduled, to avoid overloading Developers. How should the Scrum Master analyze this proposal?**

- a) It is a reasonable adaptation: the Daily Scrum's purpose is to inspect progress and adapt the plan, and if that purpose is served through the department head's calls, skipping some Daily Scrums preserves the spirit of Scrum without violating it.
- **`KEY` b) It is an omission of an immutable Scrum element — the Daily Scrum is a prescribed event — and the underlying impediment (external interruptions by the department head) should be addressed directly rather than by removing a Scrum event.**
- c) It is a valid Retrospective improvement because the team is self-managing and therefore holds authority to modify or suspend any event they collectively agree is not serving them in a given Sprint.
- d) It is acceptable provided the team documents each skipped Daily Scrum and compensates with an equivalent synchronization activity, ensuring the total inspection time across the Sprint remains unchanged.

*explanation:* The Daily Scrum is one of Scrum's five prescribed events and cannot be omitted without departing from Scrum. The proposal to skip it on certain days is not an adaptation within Scrum — it is a partial removal of a defined element. The spirit-of-Scrum reasoning is the strongest distractor because it correctly names the Daily Scrum's purpose; what it gets wrong is the conclusion: serving a purpose through a substitute does not make removing the event legitimate, any more than a staging environment makes removing the Sprint Review legitimate. Self-management gives the Scrum Team authority over how they work within Scrum's structure, not authority to dismantle that structure by consensus. Compensating with equivalent synchronization time treats the event as a quantity of minutes rather than a defined element, which the Guide does not support. The correct response is to treat the department head's interruptions as an impediment and address it at the appropriate level — which is the Scrum Master's responsibility to pursue directly.

### 408. SM-AI-II · D1 · task 1.9 · `70f3d16e`

> Analyze a Retrospective improvement that would require the team to depart from Scrum

**A Scrum Team has practiced Scrum for eight months. Their latest Retrospective proposes renaming all five events to less formal terms — 'kickoff,' 'sync,' 'checkpoint,' 'demo,' and 'rewind' — arguing that the official names create psychological distance with new team members. No event is removed or shortened. The team asks the Scrum Master whether this is compatible with Scrum. What is the most defensible analysis?**

- **`KEY` a) It is compatible: Scrum's immutability protects its defined elements — events, accountabilities, artifacts, and their commitments — not the labels used for them; retaining all five events in full preserves Scrum regardless of what the team calls them internally.**
- b) It is incompatible: the Scrum Guide's terminology is part of its immutable definition, so renaming the events means the team is no longer practicing Scrum even if every event is conducted identically in purpose, duration, and participants.
- c) It is compatible only for internal use; the team must use official Scrum terminology in any external communication with stakeholders or the organization to avoid misrepresenting their process and creating transparency problems.
- d) It is incompatible because renaming events signals to the organization that the team has customized Scrum, which undermines the Scrum Master's responsibility to help the organization understand and enact Scrum correctly.

*explanation:* Scrum's immutability protects its structural elements — the five events, three accountabilities, three artifacts, and their commitments — not the vocabulary used to reference them internally. Retaining all five events with their full purpose and timeboxes intact means the team is practicing Scrum. The claim that terminology is itself immutable is a real and testable misconception: the Guide defines what each event must accomplish, not what a team may call it in conversation. The internal-use-only position is the strongest distractor because it sounds prudent and transparency-conscious, but the Guide draws no such distinction between internal and external vocabulary, and the Scrum Master's transparency responsibility concerns artifacts and their commitments, not event labels. The signals-customization argument rests on a premise the scenario undercuts: the team has not customized Scrum's structure, only its naming convention.

### 409. SM-AI-II · D2 · task 2.2 · `466b4336`

> Diagnose why a Retrospective produces actions that are never completed

**With three days left in the Sprint, the Scrum Master reviews the Sprint Backlog and notices the improvement item from last Retrospective — 'reduce handoff delays between front-end and back-end work' — has not been touched. The team says they planned to address it 'after the current features are done.' What does this most directly indicate about the Retrospective's follow-through?**

- a) The improvement is a process change rather than a deliverable, so it correctly sits outside Sprint work; the team's plan to address it after features are done reflects appropriate sequencing rather than a follow-through failure.
- b) The Scrum Master should escalate to the Product Owner to re-order the Sprint Backlog so the improvement item receives higher priority — backlog ordering is the Product Owner's accountability and this situation requires their intervention.
- **`KEY` c) The improvement was added to the Sprint Backlog but treated as lower priority than feature work — without a committed owner and explicit capacity allocation at Sprint Planning, improvement items are routinely crowded out by delivery pressure.**
- d) The situation confirms that improvements identified at Sprint end cannot realistically be completed within the following Sprint; a two-Sprint implementation lag is normal and the team's deferral is a rational response to delivery constraints.

*explanation:* The structural step happened — the improvement reached the Sprint Backlog — but no one owned it and Sprint Planning did not allocate capacity for it, so feature pressure displaced it exactly as it would any unsponsored item. This is the capacity-and-ownership gap the Scrum Master must surface: the Retrospective produced a Sprint Backlog entry, but without a named owner and explicit planning commitment the entry was nominal. Escalating to the Product Owner to reorder the Sprint Backlog misreads both the situation and the framework: the Scrum Team is self-managing and decides who does what within the Sprint; this is not an ordering decision but a planning and ownership failure the team must address itself.

### 410. SM-AI-II · D2 · task 2.4 · `9835ba0d`

> Determine whether a self-managing team's decision should be allowed to run to its consequence

**The team has let a junior developer lead integration, a task they have never done. Five days remain and early signals suggest they may not finish in time to meet the Sprint Goal. What should the Scrum Master do?**

- **`KEY` a) Raise the risk explicitly with the team now, so they can adapt their plan while enough time remains to protect the Sprint Goal.**
- b) Stay silent and let the Sprint play out; coaching self-management means the Scrum Master should never act on a risk unasked.
- c) Escalate to the Product Owner to adjust the Sprint Goal, since the team's decision has created an organizational impediment.
- d) Reassign integration to a senior developer immediately, because the Scrum Master must prevent any outcome that risks the Sprint Goal.

*explanation:* Early signals make Sprint Goal loss foreseeable, which crosses the consequence threshold — but the right action is to surface the risk transparently so the team can adapt, not to reassign work or escalate prematurely. Reassigning integration overrides the team's self-managing authority; the Scrum Team internally decides who does what, when, and how. Staying silent ignores a genuine threshold risk. Escalating to adjust the Sprint Goal treats a solvable execution risk as an organizational impediment, skipping the step of engaging the team directly while time remains.

### 411. SM-AI-II · D2 · task 2.4 · `49fca896`

> Determine whether a self-managing team's decision should be allowed to run to its consequence

**A developer mentions that a build tool is slow, adding roughly 20 minutes per day. The team has already identified a workaround and plans to apply it. What should the Scrum Master do?**

- a) Resolve the tool issue personally, because impediment removal is the Scrum Master's highest-priority duty.
- b) Decline to assist at all, since a team that raises issues without needing help is demonstrating healthy self-management.
- **`KEY` c) Acknowledge the workaround, confirm the team can apply it, and monitor whether the Sprint Goal is affected.**
- d) Raise the slow build tool with the infrastructure team immediately, since any impediment the Scrum Master hears must be escalated.

*explanation:* The team already has a workable resolution, so the Scrum Master's role is to confirm it is sufficient and watch for Sprint Goal impact — not to absorb the work or escalate unnecessarily. Personally resolving an obstacle the team can handle itself, or immediately escalating it, undermines self-management without adding value. Declining all assistance ignores the Scrum Master's responsibility to monitor progress toward the Sprint Goal.

### 412. SM-AI-II · D2 · task 2.6 · `71a019b6`

> Determine a proportionate response to a Developer consistently excluded from the Developers' planning

**During Sprint Planning, a Developer named Rafi proposes a technical approach. Two senior Developers dismiss it without discussion and the group moves forward. The Scrum Master suspects Rafi is being excluded but is not certain. What is the right first step?**

- **`KEY` a) Check with Rafi privately after the event to understand whether he experienced the dismissal as exclusion before acting further.**
- b) Log the observation and bring it to the Sprint Retrospective, where the whole Scrum Team including the Product Owner can address it together.
- c) Take accountability for the Sprint plan yourself this Sprint so Rafi's exclusion does not compromise the team's commitment.
- d) Immediately name the exclusion pattern to the full team so it is on the table before the plan is finalized and committed.

*explanation:* When the Scrum Master is uncertain whether an exclusion is occurring, the proportionate first step is to test the inference privately with Rafi — acting on an unconfirmed pattern risks imposing a narrative that damages team dynamics. Naming the pattern publicly before confirming it is disproportionate to the level of certainty available from a single ambiguous instance. Waiting for the Retrospective is appropriate only if the pattern is not actively harming the current plan; a single ambiguous instance warrants private inquiry first, not deferral. Taking accountability for the Sprint plan as Scrum Master is never permissible — that accountability belongs to the Developers as a unit.

### 413. SM-AI-II · D2 · task 2.7 · `892aad37`

> Analyze a team whose Sprint Goals are consistently a list of unrelated items

**During Sprint Planning, the Product Owner presents eight Product Backlog items from three different business areas. The team selects six items and then crafts a Sprint Goal by listing each item's purpose as a bullet point. By the third day of the Sprint, Developers are unsure which work to prioritize when a conflict arises. Which flaw in Sprint Planning most directly explains the Developers' difficulty?**

- a) The Sprint Backlog lacks a detailed plan for the first days of work, which is what the Scrum Guide identifies as the primary output of Sprint Planning Topic Two and the primary safeguard against mid-Sprint confusion.
- b) The Product Owner did not assign a priority rank to each of the six items, so Developers lack an ordered list to consult when conflicts arise during the Sprint.
- **`KEY` c) The Sprint Goal was constructed as a summary of selected items rather than as a single objective formed first to guide selection, so it provides no basis for resolving trade-offs when capacity or circumstances change.**
- d) The team selected too many items; limiting selection to items from a single business area would have prevented the conflict without needing to change how the Sprint Goal was structured.

*explanation:* The Scrum Guide states that the Sprint Goal 'creates coherence and focus' and gives Developers flexibility to adapt their plan when hard things are encountered—but only a single objective can serve that function. A bullet-point list of item purposes is not a Sprint Goal; it is a restatement of the Sprint Backlog, and it cannot resolve trade-offs because every item appears equally obligatory. Limiting item count to one business area addresses variety but not the sequencing error: even a single-area list of bullets would leave Developers without a unifying objective to reason from. An ordered backlog and a detailed day-one plan are useful but cannot substitute for the coherence the Sprint Goal is specifically designed to provide.

### 414. SM-AI-II · D2 · task 2.8 · `c620af8d`

> Determine whether reduced delivery is an impediment, a capability gap, or a self-management failure

**During Sprint Review, the team reveals that several items were not completed because no Developer knew how to write the required database migration scripts. Pair programming with a knowledgeable colleague was available but never attempted. What does this represent?**

- a) An external impediment, because the organization did not hire Developers with database migration expertise.
- **`KEY` b) A capability gap the team had the means to close within the Sprint and chose not to, making it a self-management failure.**
- c) A capability gap requiring the Scrum Master to log it on the impediment backlog, since it prevented the team from meeting the Definition of Done.
- d) An impediment, because the missing skill blocked delivery and the Scrum Master should escalate it to secure training resources.

*explanation:* When a skill gap exists but the team had an available mechanism — pair programming with a knowledgeable colleague — to address it and chose not to use it, the cause is a self-management failure rather than a true impediment or a pure capability gap. The team had the authority and the means to act; not acting is an internal coordination and decision failure, not an external obstacle. Escalating or logging it as an impediment misclassifies a situation the team could have resolved internally.

### 415. SM-AI-II · D2 · task 2.8 · `38baf2e6`

> Determine whether reduced delivery is an impediment, a capability gap, or a self-management failure

**Three Sprints in, the team cannot integrate with a third-party payment API because the vendor has not responded to access requests despite multiple follow-ups. The team has no authority to compel the vendor. What cause does this represent?**

- a) A self-management failure, because the team should have identified the vendor dependency earlier in the Sprint.
- b) A self-management failure reclassified as a capability gap, because it has persisted for more than one Sprint without resolution.
- **`KEY` c) An impediment, because an external party is blocking progress and the team cannot resolve it through their own authority.**
- d) A capability gap, because the team lacks the technical knowledge to work around the missing API access independently.

*explanation:* An impediment is an obstacle the team cannot remove on its own. An unresponsive external vendor that the team has already followed up with, and over whom they have no authority, fits that definition precisely. Duration does not reclassify an impediment, and the team's inability to compel the vendor is not a skill gap — it is a structural constraint outside the team's boundary. Claiming the team should have identified the dependency earlier conflates planning quality with cause classification.

### 416. SM-AI-II · D2 · task 2.9 · `7fcddbee`

> Determine how to coach a team that has adopted a practice that works and is not part of Scrum

**A team has adopted pair programming, mob testing, and continuous deployment alongside full Scrum. A senior manager says the team is 'overcomplicating Scrum' by adding so many practices. What should the Scrum Master say?**

- a) The manager is right; the Guide's incompleteness is a gap the team should fill with one formal complementary framework, not ad hoc practices.
- b) The practices are sound now, but the team should consolidate them into a single methodology once they have enough data on what works.
- c) The manager is right; continuously layering practices onto Scrum signals process immaturity rather than augmentation of the framework.
- **`KEY` d) The practices are sound augmentation if no Scrum element is displaced; Scrum's incompleteness is intentional space for practices that strengthen it.**

*explanation:* Scrum is purposefully incomplete and designed to function as a container for other practices. Adding engineering practices that leave all Scrum elements intact is exactly the kind of augmentation the framework accommodates. The number of added practices is not itself a problem; displacement of a Scrum element would be. Treating multiple practices as a sign of immaturity inverts the framework's intent. Requiring one formal complementary framework is an invented constraint. Planning to consolidate into a single methodology assumes Scrum is a transitional state, which the Guide does not support.

### 417. SM-AI-II · D3 · task 3.2 · `5eec215b`

> Analyze a situation in which a functional manager assigns work directly to Developers

**A Scrum Master observes that a department head has a standing practice of assigning specific Developers to specific Sprint Backlog items at the start of every Sprint, before Sprint Planning ends. Team velocity is stable and the team raises no complaints. Which analysis best explains why this practice is still problematic?**

- **`KEY` a) Stable velocity masks the issue: because the team never exercises its own decision over who does what, it cannot develop the cross-functional judgment and collective ownership that self-management is meant to build.**
- b) The problem is mainly procedural: Sprint Planning must conclude before any work is assigned, so the timing of the department head's intervention is what makes it a Scrum violation, not the assignment itself.
- c) The Scrum Master should escalate to the Product Owner, who is best positioned to redirect the department head's attention toward backlog priorities rather than individual task assignments.
- d) The practice is acceptable for now because self-management is a maturity the team earns over time; once the team demonstrates consistent delivery, the department head's involvement can be phased out gradually.

*explanation:* Self-management is not a reward for demonstrated maturity; the Scrum Team owns who does what, when, and how from the outset, and external assignment displaces that regardless of whether delivery metrics look healthy. The 'earned autonomy' framing is a real and common misconception that makes the practice seem temporarily acceptable — it is the most defensible wrong answer because it describes a plausible developmental arc. Escalating to the Product Owner reflects a genuine but misapplied instinct: the Product Owner owns the Product Backlog and its ordering, not the team's internal work-allocation decisions, so redirecting the department head is not within that accountability. The procedural framing mistakes a symptom — when the assignment happens — for the cause, which is that any external assignment displaces self-management.

### 418. SM-AI-II · D3 · task 3.2 · `6481e78e`

> Analyze a situation in which a functional manager assigns work directly to Developers

**A functional manager defends assigning tasks to Developers during the Sprint by saying the Scrum Guide only specifies that the Scrum Team decides 'who does what' during Sprint Planning, not during the Sprint itself. How should the Scrum Master analyze this argument?**

- a) The Scrum Master should refer the argument to the Product Owner, who owns the Sprint Backlog and therefore has the authority to decide whether mid-Sprint task assignment by a manager is acceptable.
- b) The argument is wrong, but for the wrong reason: the Scrum Guide does not explicitly prohibit manager assignment at any point, so the Scrum Master should focus on the positive provision the team holds rather than asserting a ban that does not exist.
- c) The argument has partial merit because Sprint Planning is the event where work is formally allocated; once the Sprint begins, the Sprint Backlog is the team's plan and manager input on task assignment is a legitimate adaptation signal.
- **`KEY` d) The argument creates a false boundary: the Guide's provision that the Scrum Team internally decides who does what, when, and how is not confined to Sprint Planning — it describes how the Scrum Team operates throughout, and mid-Sprint assignment displaces it equally.**

*explanation:* The self-management provision — the Scrum Team internally decides who does what, when, and how — is a description of how the team operates, not a rule scoped to a single event. The manager's argument imposes an event boundary the Guide does not create, and the Scrum Master's analysis should name that false boundary directly. This beats the partial-merit option because granting partial merit accepts the false premise that Sprint Planning is the only moment the self-management provision applies, which opens the Sprint to ongoing external direction framed as 'adaptation.' The option noting that no explicit prohibition exists is technically accurate but strategically incomplete: the Scrum Master's ground is the positive provision the team holds, not the absence of a ban, and naming the provision is a stronger and more accurate analysis than merely correcting the manager's framing. The Product Owner owns the Product Backlog and its ordering, not the team's internal work-allocation decisions during the Sprint.

### 419. SM-AI-II · D3 · task 3.3 · `8ad54965`

> Diagnose which organizational structure is producing a specific empirical failure the Scrum Team cannot resolve

**A Scrum Master notices that Sprint Backlogs are consistently accurate but Increments rarely change user behavior. Post-release data shows users continue workarounds the team thought it had eliminated. The Scrum Master has coached the team on acceptance criteria and Definition of Done. No improvement after four Sprints. What should the Scrum Master investigate next?**

- a) Whether the Product Owner is selecting items that address the workarounds users actually rely on, since the gap may reflect a discovery problem rather than a deployment problem.
- b) Whether the Definition of Done is strong enough, since user-behavior change could be added as a criterion the team verifies before each Sprint Review.
- **`KEY` c) Whether a release pipeline or change-advisory board is deploying a different build than the team validated, breaking the inspect-and-adapt loop at the delivery boundary.**
- d) Whether engineering practices — automated testing, CI, code review — are mature enough to prevent regressions that invalidate the Increment before users encounter it.

*explanation:* When the Increment is internally valid but externally inert, and coaching on Done and acceptance criteria has already been tried, the most likely unexamined cause is a structural break between the team's Increment and what reaches users — a release pipeline, change board, or deployment gate the team does not control. Strengthening the Definition of Done assumes the problem is still inside the team, which four Sprints of unchanged results make unlikely. Investigating whether the Product Owner is selecting the right items is defensible because a discovery gap could produce exactly this symptom, but it is less likely than a delivery-boundary break given that Sprint Backlogs are consistently accurate. Examining engineering maturity is plausible but assumes regressions are the cause when the scenario describes a consistent pattern rather than intermittent failures.

### 420. SM-AI-II · D3 · task 3.4 · `ccf0af59`

> Determine a proportionate intervention for an impediment lying outside the Scrum Team

**A Scrum Team has been unable to access a test environment for five days because it is shared across three teams and the scheduling is managed informally by whoever claims it first. The Scrum Master has raised this in the team's shared Slack channel twice with no response. Three days remain in the Sprint. What action best matches the impediment's cost and urgency?**

- a) Document the impediment in the next Sprint Retrospective so the team can design a process improvement, because recurring shared-resource conflicts are systemic and should be addressed through the team's own inspect-and-adapt cycle rather than external escalation.
- **`KEY` b) Raise the environment-scheduling gap with the engineering manager responsible for all three teams, proposing a lightweight booking agreement, because that manager has authority over all parties and the fix is within their scope without requiring senior leadership.**
- c) Escalate to the VP of Engineering immediately, because the impediment has persisted for five days and any blocker that survives a single day of Slack messages has proven it needs executive attention.
- d) Have the Developers claim the environment aggressively during off-hours to complete testing, because the conflict involves teams in the same department and is therefore the Scrum Team's responsibility to navigate on their own.

*explanation:* The engineering manager responsible for all three teams holds authority over the shared resource and can establish a scheduling agreement — this is the minimum sufficient escalation point that matches the impediment's scope. Escalating to the VP treats time elapsed as the criterion for senior involvement, bypassing the person with direct authority over all parties. Claiming the environment off-hours absorbs the impediment through workaround and rests on the misconception that same-department blockers are the Scrum Team's own problem to navigate. Deferring to a Retrospective delays action past the Sprint's end, which is disproportionate given that three days remain and testing is blocked now.

### 421. SM-AI-II · D3 · task 3.5 · `12b1c4de`

> Analyze a Product Owner accountability being exercised by a committee

**During Sprint Review, three senior stakeholders tell the Scrum Master they want a high-value feature moved to the top of the Product Backlog. The Product Owner is present but says, 'Bring it to the steering committee — they set the strategic priorities and I implement their decisions.' The Scrum Master must identify what has gone wrong before deciding how to raise it. What is the most accurate diagnosis?**

- a) The steering committee is functioning as a legitimate strategic body; the Product Owner appropriately defers tactical ordering to stakeholders while retaining responsibility for translating strategy into Sprint-level backlog items.
- **`KEY` b) The Product Owner has ceded the ordering accountability to the steering committee; the Scrum Guide assigns that accountability to one person, and redirecting stakeholders to a committee for final decisions is the structural signature of diffusion.**
- c) The stakeholders are attempting to bypass the Product Owner, which is the real problem; the Scrum Guide's channel for backlog influence is convincing the Product Owner, and they should be redirected to do that rather than approach a committee.
- d) The arrangement is acceptable because the Product Owner remains the single named individual; the Scrum Guide does not prohibit consulting a committee before finalizing ordering decisions, provided the Product Owner signs off.

*explanation:* The Product Owner's own statement — 'they set the strategic priorities and I implement their decisions' — confirms that ordering authority has migrated to the committee. The Scrum Guide places that accountability with one person who cannot delegate it away. The stakeholder-bypass option is defensible because redirecting stakeholders to convince the Product Owner is correct practice; it falls short here because the Product Owner has already told the stakeholders to go to the committee, meaning the structural failure precedes the stakeholders' behavior and must be diagnosed first. Redirecting stakeholders without addressing the Product Owner's abdication leaves the root cause untouched.

### 422. SM-AI-II · D3 · task 3.5 · `cf225690`

> Analyze a Product Owner accountability being exercised by a committee

**A product team has been pushing a compliance feature for two Sprints. The Product Owner has heard their case twice and kept the item below the Sprint threshold each time, citing higher-value work. A senior stakeholder tells the Scrum Master: 'We have no way to influence the backlog — the Product Owner just ignores us. We need to go to the CEO.' What should the Scrum Master recognize about this situation before responding?**

- a) The Scrum Master should add the compliance item to the Sprint Backlog directly, because protecting stakeholder relationships is part of serving the organization.
- b) Two failed attempts prove the ordering decision is indefensible, so the Product Owner should be required to accept the compliance feature now.
- c) Stakeholders are right that Scrum provides no recourse once the Product Owner declines, making external escalation the only legitimate path remaining to them.
- **`KEY` d) The Product Owner is exercising the accountability correctly; the Scrum Guide offers convincing the Product Owner as a channel, not a guarantee of the desired outcome.**

*explanation:* The Scrum Guide states that those wanting to change the Product Backlog do so by trying to convince the Product Owner — it describes a channel, not a veto-proof mechanism. A Product Owner who listens and still deprioritizes is exercising the accountability, not abusing it. The 'no recourse within Scrum' option is defensible because the Guide is indeed silent on enforcement; it falls short because it conflates the channel failing to produce the desired outcome with the channel not existing — organizational escalation paths exist independently of Scrum and do not represent a failure of the framework. The Scrum Master adding items to the Sprint Backlog would absorb an accountability that belongs to the Product Owner, which the Guide does not permit.

### 423. SM-AI-II · D3 · task 3.8 · `83c163ce`

> Determine the Scrum Master's response when one team on a shared product loses Product Owner engagement

**Three days into a two-week Sprint, Team Gamma's Product Owner has not responded to two clarification requests about acceptance criteria. Team Alpha on the same product has had daily PO contact. As Scrum Master for Team Gamma, what should you do first?**

- a) Ask Team Gamma's developers to infer acceptance criteria from existing backlog items and proceed without waiting for the PO.
- b) Restructure Team Gamma's Daily Scrum to surface blocked items more visibly, so the PO can triage asynchronously from the notes.
- **`KEY` c) Raise the unequal access pattern directly with the Product Owner, naming the delivery risk it creates for Team Gamma this Sprint.**
- d) Escalate immediately to senior management, because unequal PO attention between teams is an organizational fairness violation.

*explanation:* The Scrum Master's first move is to raise the impediment with the person who can resolve it—the Product Owner—naming the concrete delivery risk, not just the fairness concern. Inferring acceptance criteria without PO input shifts an accountability the PO holds. Escalating to management before speaking to the PO skips the proportionate first step. Restructuring the Daily Scrum treats a scheduling symptom rather than the engagement gap itself, and misreads the Daily Scrum's purpose: it is for the Developers to inspect progress toward the Sprint Goal, not a triage channel for the PO.

### 424. SM-AI-II · D4 · task 4.1 · `521fbae1`

> Diagnose a Sprint Review that no longer changes the Product Backlog

**A Scrum Team's Sprint Reviews follow a consistent pattern: a developer demonstrates completed features, stakeholders applaud or ask clarifying questions, and the meeting ends. The Product Backlog has not changed after any of the last four Reviews. The Scrum Master is diagnosing why. What is the most likely root cause?**

- **`KEY` a) The Review has become a one-way demonstration, eliminating the collaborative inspection that generates the input needed to adapt the Product Backlog.**
- b) Stakeholders attend but receive no written summary afterward, so their feedback is lost before it can be incorporated into the backlog.
- c) The Product Owner is collecting stakeholder feedback during the Review but processing it in a separate refinement session, delaying backlog adaptation beyond the event.
- d) The Sprint Goals have been met each Sprint, confirming the plan is validated and reducing the need to adjust the Product Backlog at the Review.

*explanation:* The Scrum Guide describes the Sprint Review as a working session in which the Scrum Team and stakeholders collaboratively inspect the outcome and adapt the Product Backlog. A format limited to demonstration and applause removes the working-session dynamic that produces backlog changes — this is the root cause. The separate-refinement-session pattern is a real dysfunction, but it presupposes feedback was at least gathered; the scenario shows no adaptation at all, pointing to a more fundamental collapse of the collaborative structure. Meeting the Sprint Goal does not validate that the backlog needs no change — new opportunities and market learning persist regardless of whether the goal was achieved.

### 425. SM-AI-II · D4 · task 4.2 · `c0985583`

> Analyze metrics reported to management that no longer describe the team's actual progress

**A Scrum Master's organization mandates a weekly team health score reported to department leadership—an average of five self-reported survey items. Over six months the score has been stable at 4.2/5. In a candid one-on-one, a Developer tells the Scrum Master that team members rate high to avoid triggering management attention. Leadership is planning headcount decisions based on the stable score. What is the most accurate characterization of the artifact's transparency?**

- a) A consistent 4.2 over six months is itself meaningful data suggesting the team has reached a steady state; the Scrum Master should weigh the aggregate signal against a single Developer's anecdotal report before acting.
- b) The problem is a psychological safety deficit, not a metric problem; once safety is restored, team members will rate honestly and the health score will reflect actual conditions without requiring a change to the reporting structure.
- **`KEY` c) The health score has become a measure of survey-avoidance behavior rather than team health; its apparent stability actively conceals the actual state, giving leadership a low-transparency artifact for a high-stakes decision.**
- d) The Scrum Master should add qualitative questions to the survey to triangulate the quantitative score, giving leadership a richer dataset that compensates for any individual items that have lost their signal.

*explanation:* When respondents optimize their answers to avoid a consequence rather than to report truthfully, the metric measures avoidance behavior—not the named construct. The artifact's apparent stability is not evidence of a steady state; it is evidence of decoupling, and decisions built on it carry the exact risk the Scrum Guide identifies: low-transparency artifacts can lead to decisions that diminish value and increase risk. The option to weigh the aggregate against a single report is defensible practice in many situations, but here the Developer's disclosure explains the mechanism producing the stable number—it is not an outlier claim, it is a causal account that changes what the aggregate means. The option to restore psychological safety first correctly identifies a contributing cause but does not address the transparency failure that is already shaping a headcount decision; the immediate obligation is to surface the decoupling, not to wait for conditions to improve. Adding qualitative questions to a survey that respondents are already gaming compounds rather than resolves the problem, because the same avoidance incentive applies to any new items.

### 426. SM-AI-II · D4 · task 4.3 · `e49542f2`

> Determine whether an artifact's transparency has been compromised

**Three days into a two-week Sprint, the team discovers the selected items cannot achieve the Sprint Goal. They continue updating the Sprint Backlog daily with task completion. What is the transparency status of the Sprint Backlog?**

- a) Compromised, but only from the Sprint Review onward, when the Increment is inspected against the Sprint Goal.
- b) Intact — the team is actively maintaining the Sprint Backlog each day, which is what Scrum requires.
- c) Intact — stakeholders have not raised concerns about the Sprint Backlog's content or direction.
- **`KEY` d) Compromised — the backlog no longer reflects progress toward the Sprint Goal, which is its commitment.**

*explanation:* The Sprint Backlog's commitment is the Sprint Goal; the backlog must show the plan for achieving it. When the selected work can no longer deliver the Sprint Goal, the artifact no longer provides the information its commitment promises, so transparency is compromised regardless of how diligently the team updates task completion. Active maintenance does not restore transparency when the content has drifted from the commitment.

### 427. SM-AI-II · D4 · task 4.3 · `94a1d8e2`

> Determine whether an artifact's transparency has been compromised

**An Increment was built entirely from AI-generated code. Every item meets the team's Definition of Done. A Scrum Master argues the DoD should be relaxed because the generation process is inherently different. What is the correct response?**

- **`KEY` a) Apply the existing Definition of Done unchanged; it is the Increment's commitment and may not be weakened regardless of how work was produced.**
- b) Allow a temporary relaxation, then reassess at the Sprint Retrospective whether the adjusted standard should become permanent.
- c) Escalate to the Product Owner, who can authorize a modified Definition of Done for AI-generated work.
- d) Consult stakeholders; if they accept the Increment without quality concerns, the Definition of Done is effectively satisfied.

*explanation:* The Definition of Done is the commitment of the Increment, providing the quality standard against which it is measured. Where an organizational Definition of Done exists it is a minimum the Scrum Team may only strengthen, never weaken — and that rule is indifferent to what produced the work. Stakeholder acceptance and escalation to the Product Owner are not substitutes for meeting the commitment; the standard applies equally to generated and hand-written work.

### 428. SM-AI-II · D4 · task 4.4 · `a60cf588`

> Diagnose a Product Backlog whose ordering no longer reflects value

**A Product Owner tells the Scrum Master that backlog ordering is complete: every item was ordered during the initial product planning session eight months ago, and the team has been executing against that order ever since. The product has since onboarded a major enterprise customer with different needs, and the regulatory landscape has shifted. The Product Owner views reordering as a sign of poor initial planning. What is the most accurate diagnosis of this stance?**

- a) The stance is defensible if the original ordering was thorough; an eight-month-old order produced through rigorous planning retains validity longer than one produced informally, because planning quality determines ordering durability.
- b) The stance is a stakeholder management issue: the enterprise customer should be invited to a Sprint Review to reprioritize the backlog directly, which will surface the needed reordering without the Product Owner having to admit the original plan was wrong.
- **`KEY` c) The stance conflates planning stability with ordering validity; ordering is a continuous accountability that must respond to new information — a new enterprise customer and a regulatory shift are exactly the signals that should trigger reordering, not evidence of planning failure.**
- d) The stance is partially correct: the items unaffected by the new customer and regulatory change retain valid positions, so the Product Owner needs only to insert the new requirements at the appropriate rank rather than revisiting the full order.

*explanation:* The Scrum Guide lists ordering the Product Backlog as an ongoing Product Owner accountability, not a one-time planning milestone. Treating reordering as an admission of poor planning mistakes a healthy empirical response to new information for a failure of foresight. The option arguing that planning quality determines ordering durability is the most defensible second-best: rigorous initial planning does produce more durable orderings in stable environments, but the scenario supplies two concrete changes — a new enterprise customer and a regulatory shift — that undercut the stability premise. The option suggesting the enterprise customer reprioritize the backlog directly would shift the ordering accountability away from the Product Owner. The option limiting review to unaffected items cannot be executed without first reassessing the full ordering rationale to determine which items are truly unaffected.

### 429. SM-AI-II · D4 · task 4.5 · `d43baa5d`

> Analyze a Definition of Done that is satisfied while the Increment is not usable

**A Scrum Team's Definition of Done specifies: story acceptance criteria met, no critical bugs open, and code coverage above 80%. For four Sprints the DoD is fully satisfied. The Scrum Master notices the Increment is never exercised by stakeholders at Sprint Review — they only review slide summaries. The Scrum Master wants to determine whether the DoD is implicated.**

- a) The DoD is not implicated because it was satisfied; the slide-summary pattern is a Sprint Review facilitation problem, and the Scrum Master should change the review format without touching the quality standard.
- **`KEY` b) The DoD may be implicated: if the Increment is never in a state where stakeholders can exercise it directly, a criterion requiring a working, demonstrable build at Sprint end is likely missing from the current standard.**
- c) The DoD is not implicated because usability is confirmed by the Product Owner's acceptance at Sprint Review; if the Product Owner accepts the slide summary, the Increment is usable by that acceptance.
- d) The DoD is not implicated; demonstrating or releasing the Increment is the Product Owner's decision, and a Product Owner who chooses slide summaries over live demonstrations is exercising legitimate product authority.

*explanation:* When stakeholders consistently cannot exercise the Increment directly, it is worth asking whether the DoD requires the Increment to exist in a demonstrable, working state at Sprint end. A DoD limited to coverage metrics and bug counts can be satisfied by code that is never in a runnable condition for review. Changing the Sprint Review format addresses the symptom and is a defensible first move, but it leaves the quality standard unchanged — if the Increment is not demonstrable because no runnable build exists, format changes cannot fix that. The Product Owner's acceptance of a summary does not establish usability; it may reflect that no working Increment was available to inspect, which is precisely the DoD gap the scenario points toward.

### 430. SM-AI-II · D4 · task 4.6 · `4f003eb2`

> Diagnose inspection occurring too infrequently to permit adaptation

**A well-established Scrum Team has delivered consistently for eighteen months. Their Scrum Master proposes extending Sprints from two weeks to four weeks, reasoning that the team's maturity means they need less frequent course-correction and would benefit from reduced event time. Two Developers support the idea. What is the most important flaw in this reasoning?**

- a) Event overhead does scale with Sprint count, so extending to four weeks genuinely reduces ceremony time; the flaw is that the Scrum Master has not confirmed this efficiency gain exceeds the cost of longer feedback cycles.
- **`KEY` b) Team maturity reduces the cost of rework within the team's control but does not reduce the rate of change in the product's environment; inspection frequency should match context volatility, not internal team capability.**
- c) The Scrum Master lacks authority to propose Sprint length changes; that decision belongs to the Product Owner, who is accountable for the value delivered and therefore for the cadence at which it is inspected.
- d) The proposal violates Scrum because the Guide prohibits changing Sprint length after a product has been in development for more than one year, protecting established team rhythms from disruption.

*explanation:* Inspection frequency is calibrated to the rate of change in the environment, not to the team's internal maturity. A high-performing team still operates in a context where market conditions, stakeholder needs, and technical dependencies shift; extending Sprints widens the window in which those shifts go undetected regardless of how skilled the team is. The Guide contains no prohibition on changing Sprint length at any stage of a product's life, making that claim a false attribution. Sprint length is not a Product Owner decision to make unilaterally — it is agreed within the Scrum Team within the one-month maximum. The overhead calculation is real and worth examining, but it is a secondary consideration: even if the efficiency gain is confirmed, it does not address the empirical risk of a wider feedback gap in a changing environment.

### 431. SM-AI-II · D4 · task 4.8 · `1e6e87d0`

> Analyze a forecast that has become a performance target

**A team of experienced Developers uses planning poker with private simultaneous reveal. The Scrum Master argues this eliminates anchoring bias because no one sees another's number before committing. A practitioner disputes this. What is the strongest basis for the dispute?**

- a) Experienced practitioners are less susceptible to anchoring than junior members, so the technique's value depends on team seniority; for this team, private reveal is likely sufficient to produce unbiased estimates.
- b) The dispute is valid but secondary: the more important fix is to stop sharing velocity with stakeholders entirely, because external visibility is the primary source of estimation pressure regardless of elicitation technique.
- c) Planning poker requires simultaneous reveal by definition, so the Scrum Master is describing correct technique; the dispute has no merit on procedural grounds and should be dropped.
- **`KEY` d) Private simultaneous reveal removes peer anchoring at the reveal moment, but it does not remove anchoring from prior Sprint targets, management expectations, or the team's awareness of what number 'should' come out — estimation pressure survives anonymity.**

*explanation:* Anonymity during reveal addresses only one channel of social pressure — the immediate peer influence at the table. It does not address the ambient anchors that Developers carry into the room: last Sprint's velocity, a manager's stated expectations, or the team's own sense of what the number should be. The option about experienced practitioners being immune to anchoring is a named misconception; research consistently shows anchoring affects experts and novices alike, often more strongly because experts have more reference points. The option about stopping velocity sharing addresses a real lever but overstates it as the primary source and ignores the internal anchors the team generates themselves.

### 432. SM-AI-II · D5 · task 5.1 · `0d9e74c0`

> Determine what the Definition of Done must cover when implementation is AI-generated

**A team's DoD has no criterion for whether AI-generated code was reviewed by a team member. The Scrum Master raises this at the Sprint Retrospective. The team wants to add a criterion. The organization has no AI policy. What should the team do?**

- a) Record the gap as a risk item in the Sprint Backlog and revisit it once velocity data shows whether AI-generated code introduces defects.
- **`KEY` b) Add an explicit human-review criterion for AI-generated code now, strengthening their DoD above the organizational floor without waiting for a policy.**
- c) Place the AI-review requirement in the Definition of Ready so AI-generated items are flagged as an input constraint before Sprint Planning.
- d) Wait for organizational approval before adding any AI-specific criterion; the organizational DoD is the only floor the team may build on.

*explanation:* Where an organization has a Definition of Done, it is a floor the Scrum Team may only strengthen, never weaken. A team may add criteria above that floor immediately without waiting for organizational approval. Placing a quality criterion in the Definition of Ready treats an output standard as an input constraint, which is a category error. Deferring to velocity data delays a quality decision that belongs in the DoD now.

### 433. SM-AI-II · D5 · task 5.1 · `e1e7ca36`

> Determine what the Definition of Done must cover when implementation is AI-generated

**Three days into the Sprint, a Developer submits a pull request of entirely AI-generated code and marks it reviewed by the model's built-in linter. The DoD requires peer code review for all changes. What should the team do?**

- **`KEY` a) Apply the existing peer-review criterion to the AI-generated code; the DoD applies equally to all work regardless of origin.**
- b) Defer the review question to the Sprint Review so the Product Owner can decide whether the AI-generated work is acceptable.
- c) Add an AI-specific review criterion only after the organization publishes a formal AI usage policy that mandates one.
- d) Accept the linter output as satisfying peer review; the model's built-in checks are equivalent to a human reviewer's inspection.

*explanation:* The Definition of Done states the quality measures required for the product and applies to every Increment regardless of how the work was produced. A model's linter output is an artifact a team member must inspect; it does not substitute for the peer-review step the DoD already requires. Deferring to the Product Owner conflates acceptance with quality verification. Waiting for an organizational AI policy treats an existing DoD criterion as optional, which it is not.

### 434. SM-AI-II · D5 · task 5.2 · `2c7de35c`

> Diagnose a Sprint Review at which the Increment can no longer be meaningfully inspected within the event

**A senior developer argues that the Sprint Review's declining usefulness is not a volume problem but a Definition of Done problem: 'If everything truly meets Done, stakeholders can inspect it quickly.' The Scrum Master disagrees. Which reasoning best supports the Scrum Master's position?**

- **`KEY` a) The Definition of Done establishes that each Increment is usable, not that stakeholders can evaluate unlimited usable Increments in one event — quality and quantity are separate constraints on inspection.**
- b) The Definition of Done does not apply to Sprint Review inspection — it governs release decisions, and the Review is an internal feedback event that operates under different criteria.
- c) The Definition of Done is a quality standard set by the organization, not the team, so the developer is conflating two separate accountability structures that the Guide keeps distinct.
- d) The Definition of Done ensures the Increment is releasable, which means the Sprint Review is technically redundant for items that already meet Done — those items need not be demonstrated at all.

*explanation:* The developer's argument conflates two independent variables: whether each Increment is usable (a quality question the Definition of Done answers) and whether stakeholders can meaningfully examine all of them in a bounded event (a capacity question the Definition of Done does not touch). Meeting Done makes each item inspectable in principle; it does not compress the time and cognitive load required to actually inspect twenty of them. The accountability-structure argument is a real distinction — the Guide notes that where an organization has a Definition of Done, the Scrum Team must at minimum comply with it — but it does not address the developer's actual claim about inspection speed. Framing the Definition of Done as a release-governance tool that is separate from the Review misreads both; the Guide treats Done as the standard for the Increment regardless of context. The argument that Done items need no demonstration inverts the Review's purpose entirely.

### 435. SM-AI-II · D5 · task 5.2 · `75504c35`

> Diagnose a Sprint Review at which the Increment can no longer be meaningfully inspected within the event

**Over five Sprints a team's output has grown from eight to nineteen items per Sprint. The Product Owner reports that the Sprint Review now feels like a 'trade show' — items are shown but nothing is really examined. She asks the Scrum Master whether the team should track Increment volume as a metric to keep future Reviews manageable. What is the most useful response?**

- a) Rising volume signals team improvement, so the Review format should scale to match output rather than constraining it; volume works well as a proxy for productivity when trends are consistently upward.
- **`KEY` b) Scrum does not treat Increment volume as a meaningful metric; the real question is how much the team and stakeholders can meaningfully inspect in one Review, and Sprint scope should fit that limit.**
- c) Tracking volume gives a forecasting baseline, letting the team cap each Sprint at the item count that historically produced thorough, productive Reviews — turning past data into a planning guardrail.
- d) Tracking items per Sprint is a reasonable start, but the real fix is splitting the Review into two mid-Sprint sessions so stakeholders inspect work in smaller, more manageable batches.

*explanation:* The Scrum Guide does not endorse Increment volume as a measure of team performance or as a planning metric, and treating it as one would incentivize completing more items rather than completing the right ones. The productive reframe is inspection capacity: how much can this team and these stakeholders actually examine in four hours? Scope should be shaped to fit that limit, not the other way around. The forecasting option imports volume tracking as though Scrum endorsed it, and capping at a historical number still optimizes for quantity. Using volume as a productivity proxy compounds the error by making the Review format subordinate to output. Adding a mid-Sprint inspection session is not something the Guide provides for, and it would not resolve the underlying question of how much work is right for one Sprint.

### 436. SM-AI-II · D5 · task 5.3 · `f7947f4f`

> Analyze accountability for a defect in AI-authored work the Developers accepted

**A Scrum Team uses an AI tool that automatically opens pull requests for routine tasks. A Developer approves and merges one such pull request in thirty seconds without reading the diff. The resulting Increment contains a data-exposure defect. In the Sprint Retrospective, the Developer says the speed of approval was reasonable because the generation process itself is a quality step. Which element of this reasoning is the critical flaw?**

- a) The critical flaw is that pull-request approval is not the acceptance decision: acceptance occurs when the Product Owner reviews and approves the Increment at Sprint Review, so the Developer's merge carried no independent quality accountability.
- b) The critical flaw is organizational: the team should not have configured the AI tool to open pull requests autonomously, and the Developer who set up that configuration bears primary accountability rather than the Developer who approved the merge.
- **`KEY` c) The critical flaw is treating generation as a quality step: the AI tool's generation process produces an artifact to be inspected, not an act of inspection itself, so the Developer's approval remained the acceptance decision regardless of how the pull request was created.**
- d) The critical flaw is the thirty-second review duration: a review that short cannot satisfy the Definition of Done for security-sensitive work, and the team should have defined a minimum review time for AI-generated pull requests.

*explanation:* Generation produces an artifact; it is not itself the act of inspection. The Developer's approval of the pull request was the acceptance decision, and that is where accountability attaches — regardless of how the request was created or how quickly it was reviewed. Focusing on the thirty-second duration mistakes a symptom for the underlying flaw: even a longer review would not change the fact that generation is not inspection. The Product Owner does not hold acceptance authority over individual Increment items, so attributing acceptance to the Sprint Review misplaces the decision point. Tracing primary accountability to whoever configured the tool is the vendor-accountability misconception applied one step closer to the team.

### 437. SM-AI-II · D5 · task 5.5 · `c851af23`

> Diagnose a Retrospective whose inputs are model-summarised and whose actions nobody owns

**A Scrum Team uses an AI tool to scan Sprint chat logs and ticket comments, generating a structured retrospective summary with themes and suggested improvements each Sprint. The Scrum Master shares the document before the next Sprint Planning. No synchronous retrospective is held. Three Sprints in, no improvement action has been adopted. What is the primary cause of this failure?**

- a) The retrospective was run asynchronously rather than in a dedicated synchronous session; switching to a real-time format would restore the inspect-and-adapt cycle even if the AI summary step is kept.
- **`KEY` b) The generated summary replaced the team's act of collective self-inspection; without that shared examination, no one formed the understanding or commitment needed to own an improvement.**
- c) The improvements were suggested by a tool rather than the team, so they lacked credibility; a manager should have reviewed them to confirm feasibility before anyone committed.
- d) The Scrum Master did not assign each suggested improvement to a named team member after distributing the summary, so findings were never converted into owned actions.

*explanation:* The Retrospective is the Scrum Team inspecting itself together; that participation is what creates shared understanding and the motivation to own change. A generated summary preserves an artifact but removes the joint examination that gives conclusions meaning, so no one holds the insight that produces commitment. Switching to a synchronous format is a defensible move—and would help—but it does not address the deeper problem: if the team still receives a pre-built summary rather than conducting the examination themselves, the displacement persists. Assigning actions after distributing a summary treats ownership as an administrative step and misses that ownership follows from being inside the examination, not from being handed its output.

### 438. SM-AI-II · D5 · task 5.5 · `7940031c`

> Diagnose a Retrospective whose inputs are model-summarised and whose actions nobody owns

**A Scrum Team completed a strong Retrospective last Sprint, producing five action items with named owners. This Sprint is unusually compressed, and the team proposes skipping the Retrospective to protect delivery capacity, arguing the prior actions are still being implemented and a second retrospective would duplicate effort. The Scrum Master is evaluating this proposal. What is the strongest objection?**

- a) Skipping one Retrospective sets a precedent that will erode the cadence permanently; the team should hold a shortened session rather than skipping, preserving the habit even if the content is thin.
- **`KEY` b) Each Sprint generates new information about how the team works; skipping the Retrospective means that information is never jointly examined, so this Sprint's self-inspection is lost regardless of what prior actions are still running.**
- c) Skipping the Retrospective violates the Scrum Guide's requirement that each event occur every Sprint; the team cannot trade an event for delivery capacity regardless of circumstances.
- d) The five prior action items will stall without a Retrospective to review them; assessing whether previous actions succeeded is the primary purpose of each session, and skipping it breaks that review loop.

*explanation:* The Retrospective's value is the Scrum Team inspecting this Sprint's experience together; that inspection is specific to the Sprint just completed and cannot be carried forward from a prior session or substituted by active action items. Prior actions being in flight is a reason to check on them in the new session, not a reason to forgo the examination of what this Sprint revealed. Holding a shortened session rather than skipping is a defensible compromise—it preserves the cadence and the habit—but it does not name the deeper reason: even a brief session captures inspection that would otherwise be permanently lost. The timebox argument is real and grounded in the Scrum Guide, but the stronger objection is the irreplaceability of each Sprint's self-inspection, not the procedural violation alone.

### 439. SM-AI-II · D5 · task 5.5 · `63b59512`

> Diagnose a Retrospective whose inputs are model-summarised and whose actions nobody owns

**A Scrum Team consistently ends Retrospectives with a well-formatted action list, but at the following Sprint Review the Scrum Master notices none of the actions were attempted. Team members say they assumed someone else was handling each item. The Scrum Master proposes labeling future actions as 'Team' to signal shared responsibility. Why does this proposal fail to address the root cause?**

- a) The Scrum Master should present unfinished actions to stakeholders at the Sprint Review so that external visibility creates the pressure that internal accountability has not.
- b) The Scrum Master should own each action item by default, since improving team process falls within the Scrum Master's accountability for team effectiveness and the team's assumption reflects that correctly.
- c) The team should limit action items to one per Retrospective; a shorter list makes diffusion less likely even without named owners, because volume is the real driver of inaction.
- **`KEY` d) Labeling actions 'Team' diffuses rather than distributes accountability; an improvement owned by everyone is owned by no one, and the proposal formalizes the very assumption that caused the gap.**

*explanation:* When anyone may act, each person waits for another. Labeling actions 'Team' formalizes the assumption that caused the gap rather than closing it. The fix is a named person inside the team who holds each improvement. Limiting the list to one item is a defensible instinct—fewer commitments do reduce diffusion risk—but it does not resolve the underlying mechanism: a single item labeled 'Team' will stall for the same reason five items did. Assigning actions to the Scrum Master confuses the Scrum Master's accountability for the team's overall effectiveness with ownership of specific process changes, which belongs to the team member who will carry the work.

### 440. SM-AI-II · D5 · task 5.9 · `ada0be9f`

> Determine the Scrum Master's response when a Developer cannot explain work they submitted

**A teammate accepted work into the Increment on behalf of a Developer who was out sick. That Developer returns and cannot explain the work. What should the Scrum Master do?**

- a) Flag the item to the Product Owner to decide whether it should remain in the Increment, since the original Developer cannot vouch for it.
- **`KEY` b) Coach the returning Developer to understand the work, since accountability for Increment quality cannot be transferred by a teammate accepting work on someone's behalf.**
- c) Personally review the Definition of Done checklist to confirm the item meets quality standards, then close the matter.
- d) Hold the teammate who accepted the work accountable for explaining it, since they completed the acceptance and fully assumed responsibility for that item.

*explanation:* Accountability for instilling quality by adhering to the Definition of Done belongs to the Developers as a group and cannot be transferred by one teammate accepting work on another's behalf. Personally reviewing the checklist absorbs a Developer accountability the Scrum Master does not hold. The Product Owner has no authority to remove a Done Increment item because a Developer cannot explain it. Holding only the accepting teammate accountable ignores the returning Developer's own accountability for understanding what is in the Increment.

---

# SPO-AI-I — Scrum Product Owner I — AI

**Source this certification cites:** The 2020 Scrum Guide.

**The audit question for every item below:** is the key right *against that
source*, and does the explanation justify it with something the source actually
says?

### 441. SPO-AI-I · D1 · task 1.1 · `e3fd629a`

> Explain the meaning of agile and distinguish it from predictive (waterfall) delivery

**How does the predictive (Waterfall) approach differ most fundamentally from Agile delivery?**

- a) Waterfall requires documentation; Agile eliminates all documentation to maximize speed.
- **`KEY` b) Waterfall front-loads planning with fixed scope; Agile continuously adapts scope based on feedback.**
- c) Waterfall suits complex work through upfront design; Agile is limited to small, simple projects.
- d) Waterfall phases are too slow; Agile fixes this by running the same phases faster.

*explanation:* The core distinction is that Waterfall commits to a full plan before execution and resists change, while Agile treats the plan as a hypothesis and adapts it through iterative feedback. Agile does not eliminate documentation, and its difference from Waterfall is not merely speed. Waterfall does not inherently scale better to complexity, and Agile is not limited to small projects.

### 442. SPO-AI-I · D1 · task 1.2 · `ec4b2637`

> Apply the Agile Manifesto values and principles to product decisions

**A sponsor insists the team produce a full design document before any coding begins. Applying Agile values, what should the Product Owner recommend?**

- a) Produce the full document first, since comprehensive documentation ensures shared understanding across all stakeholders.
- b) Defer to the sponsor, since Agile values individuals and interactions, which includes respecting sponsor decisions.
- **`KEY` c) Deliver software incrementally with lean documentation, valuing working software over comprehensive documentation.**
- d) Eliminate documentation entirely, since the Manifesto treats documentation as waste incompatible with Agile delivery.

*explanation:* The Manifesto values working software over comprehensive documentation—meaning documentation has value but should not block delivery. Eliminating documentation entirely misreads the value; the left side is preferred in trade-offs, not the only permissible option. Deferring to the sponsor misapplies the 'individuals and interactions' value.

### 443. SPO-AI-I · D1 · task 1.4 · `99a47cdd`

> Explain lean product thinking

**In lean product thinking, what is the primary purpose of working in small batches?**

- **`KEY` a) To accelerate feedback loops so the team can learn and adjust course before investing heavily in a potentially wrong direction.**
- b) To consolidate integration and testing into fewer, larger release cycles, reducing the total overhead incurred by repeated deployment activities.
- c) To distribute workload evenly across team members, preventing burnout by deliberately capping the scope committed to in each sprint.
- d) To minimize coordination costs by allowing each developer to focus on one self-contained slice of work without depending on parallel streams.

*explanation:* Small batches in lean thinking are primarily a learning mechanism: releasing less work more frequently surfaces market feedback earlier, reducing the cost of a wrong assumption. Consolidating releases into fewer cycles inverts reality — smaller, more frequent releases repeat integration activities more often, not less. Capping sprint scope confuses small batches with capacity planning, and reducing coordination costs conflates batch size with task assignment strategy.

### 444. SPO-AI-I · D1 · task 1.5 · `ce4c3642`

> Explain why Scrum remains relevant in the AI era and how AI agents impact product development

**A team argues that an AI agent ranking backlog items by predicted business value makes the Product Owner role unnecessary. Why is this reasoning flawed?**

- a) The Product Owner's value lies in translating stakeholder requests into user stories, a task AI already performs reliably.
- b) AI ranking optimizes for measurable metrics, so the Product Owner need only validate the algorithm's output each Sprint.
- c) AI agents lack sufficient data quality today, so the role is only temporarily necessary until data improves.
- **`KEY` d) Value decisions involve ethical trade-offs and organizational accountability that cannot be delegated to an algorithm.**

*explanation:* Backlog prioritization involves value judgments, ethical trade-offs, stakeholder trust, and organizational accountability — none of which are data optimization problems. The Product Owner is accountable to the organization for those decisions, and that accountability cannot be delegated to an algorithm. Framing the limitation as a temporary data-quality problem misses the point entirely. Reducing the role to story-writing or algorithm validation similarly ignores the human judgment and accountability that Scrum explicitly requires.

### 445. SPO-AI-I · D1 · task 1.5 · `331a1dfc`

> Explain why Scrum remains relevant in the AI era and how AI agents impact product development

**When AI agents dramatically increase delivery throughput, why does empiricism become MORE important?**

- **`KEY` a) Faster output amplifies wrong-direction decisions, so inspect-and-adapt cycles are needed more urgently to limit waste.**
- b) ML models provide predictive certainty about user needs, shifting empiricism from validating direction to validating model accuracy.
- c) Higher throughput generates richer data, letting teams replace Sprint Reviews with automated dashboards that surface the same insights.
- d) AI converts uncertain work into merely complicated work, making upfront planning a reliable substitute for iteration.

*explanation:* When building is cheap and fast, wrong decisions compound quickly; empirical loops catch misdirection before waste accumulates. ML models do not provide certainty about what users value, and dashboards cannot replace the stakeholder conversation that surfaces whether the right thing was built. AI does not eliminate complexity or make upfront planning reliable.

### 446. SPO-AI-I · D2 · task 2.1 · `0246d9f1`

> Describe the Scrum framework and what a product is

**What distinguishes product-centric thinking from project-centric thinking in Scrum?**

- a) Product-centric thinking delegates backlog ownership to rotating stakeholders; project-centric thinking assigns it to one owner.
- b) Product-centric thinking requires fixed scope agreed upfront; project-centric thinking allows the backlog to evolve.
- **`KEY` c) Product-centric thinking focuses on sustained value delivery; project-centric thinking treats work as temporary with a fixed end.**
- d) Product-centric thinking ties the team's lifespan to a funding cycle; project-centric thinking treats delivery as continuous.

*explanation:* Product-centric thinking treats the product as a long-lived vehicle for continuous value delivery, whereas project-centric thinking frames work as a temporary endeavor with a defined end. The option describing funding-cycle lifespans and continuous project delivery inverts the two orientations. Fixed scope upfront is a trait of project thinking, not product thinking, and rotating backlog ownership is not a feature of either orientation.

### 447. SPO-AI-I · D2 · task 2.1 · `d182038c`

> Describe the Scrum framework and what a product is

**Which statement accurately distinguishes a product from a project in Scrum thinking?**

- a) A product has fixed scope defined at the start; a project allows scope to evolve through backlog refinement.
- **`KEY` b) A product is a long-lived value vehicle with ongoing stakeholders; a project is a temporary endeavor with a defined end.**
- c) A product must use iterative delivery; a project uses predictive planning and cannot be managed with Scrum.
- d) A product is owned collectively by the Scrum Team; a project is owned solely by a Product Owner accountable to sponsors.

*explanation:* In Scrum, a product is a long-lived vehicle with identifiable stakeholders and a value boundary that persists beyond any single initiative, while a project is traditionally a temporary endeavor with a defined end. Fixed scope belongs to project thinking, not product thinking. Product ownership is vested in one Product Owner, not the whole team. Predictive planning can coexist with Scrum in hybrid contexts, so declaring them incompatible is also inaccurate.

### 448. SPO-AI-I · D2 · task 2.2 · `e9032f24`

> Explain the Scrum Team composition and the PO's place in it

**Leadership appoints one Product Owner per domain, each managing their own backlog. Which concept does this misrepresent?**

- a) Multiple POs are allowed only when a chief PO coordinates them; this arrangement fails only due to missing oversight.
- b) The Product Owner must be full-time; part-time domain owners are invalid even if only one leads each team.
- c) Multiple POs are permitted for complex products, but they must merge into a single backlog at Sprint end.
- **`KEY` d) One Product Owner per Scrum Team is required; accountability for the backlog cannot be split across multiple POs.**

*explanation:* The Scrum Guide is unambiguous: the Product Owner is one person, not a committee or set of domain owners. Product complexity does not create an exception. A single PO may collaborate with stakeholders across domains but retains sole accountability for the Product Backlog.

### 449. SPO-AI-I · D2 · task 2.3 · `c6f35101`

> Explain the three Scrum artifacts and their commitments

**A team completes several items in a Sprint, but one does not meet the Definition of Done. The Product Owner approves releasing it anyway. How should that item be characterized?**

- **`KEY` a) It is not part of the Increment; no individual, including the Product Owner, can override the Definition of Done.**
- b) It is a valid Increment because Product Owner approval fulfills the Definition of Done commitment.
- c) It is a valid Increment for this Sprint only, because the Definition of Done is redefined at the start of each Sprint.
- d) It is a valid Increment only if the Scrum Team agreed at the Sprint Retrospective to lower the standard.

*explanation:* The Definition of Done is the commitment of the Increment; work that does not meet it cannot be included in the Increment. No individual — including the Product Owner — can override this standard. The idea that Product Owner approval substitutes for the Definition of Done confuses a non-negotiable quality commitment with an acceptance criterion. The idea that the Definition of Done resets each Sprint is also incorrect; it persists and may only grow stricter over time.

### 450. SPO-AI-I · D2 · task 2.7 · `ae9cedfd`

> Apply the Definition of Done to an Increment partly built by an AI agent

**An AI agent completes a user story in two hours. Automated tests pass and the agent logs no errors. The team considers shipping immediately. What should the team do?**

- **`KEY` a) Verify the output against every DoD criterion before shipping.**
- b) Ship immediately, since passing automated tests confirms all DoD criteria are met.
- c) Apply a lighter review standard to preserve the speed advantage AI provides.
- d) Let the Product Owner accept it at Sprint Review, since stakeholder approval overrides unmet DoD criteria.

*explanation:* The Definition of Done is a mandatory quality gate that applies equally to AI-generated output. Agent speed and clean logs do not substitute for explicit verification of every DoD criterion. Treating automated test passage as full DoD confirmation conflates one possible criterion with the entire standard. Allowing the Product Owner to accept output that has not met the DoD violates the Scrum principle that only a Done Increment may be released or presented as complete. A lighter review standard for AI output has no basis in Scrum and introduces uncontrolled quality risk.

### 451. SPO-AI-I · D2 · task 2.8 · `238f60f7`

> Recognize Scrum framework anti-patterns relevant to the PO

**A newly appointed PO cannot reorder the backlog without approval from a steering committee that meets bi-weekly. The team waits days for priority decisions. What is the PRIMARY structural problem?**

- a) The steering committee meets too infrequently; a weekly cadence would restore the PO's ability to keep the backlog current.
- b) Involving a committee in prioritization is sound governance that reduces the risk of misaligned backlog decisions.
- c) The team should self-manage around priorities during the wait, since Scrum's self-management principle covers temporary gaps.
- **`KEY` d) The PO lacks independent prioritization authority, making her a proxy rather than an empowered accountable owner.**

*explanation:* Scrum places full accountability for backlog ordering with one empowered PO. When that person must defer every decision to a committee, the PO role is structurally hollow—a classic Proxy PO anti-pattern regardless of event attendance. Increasing committee frequency treats the symptom rather than restoring authority to the PO. Framing committee involvement as sound governance misrepresents the single-accountability principle. Delegating priority decisions to the Developers violates that principle and is itself an anti-pattern, not a legitimate application of self-management.

### 452. SPO-AI-I · D3 · task 3.2 · `64ebf86f`

> Apply the one-Product-Owner rule: a single accountable person, not a committee or a proxy

**A steering committee appoints a Product Owner but insists on approving every backlog ordering decision before it takes effect. What should the Product Owner do?**

- a) Escalate to the Scrum Master to negotiate a shared approval process acceptable to both the committee and the Product Owner.
- b) Submit each ordering decision for committee approval, since the appointing body retains override rights over backlog priorities.
- **`KEY` c) Order the backlog independently, treating committee input as stakeholder feedback while retaining sole final authority.**
- d) Co-sign each ordering decision with the committee sponsor, since the Product Owner is accountable to the appointing body.

*explanation:* The Product Owner is one person who holds sole authority over backlog ordering. They may gather and represent committee desires, but the decisions are theirs alone. Submitting decisions for committee approval contradicts this rule. Co-signing decisions with a sponsor similarly dilutes the single-person accountability Scrum requires. Escalating to the Scrum Master is also incorrect because the Scrum Master has no authority to negotiate away the Product Owner's ordering authority.

### 453. SPO-AI-I · D3 · task 3.3 · `525e5dc3`

> Explain the PO's authority over the Product Backlog and the Sprint

**The PO is on leave and the Scrum Master reorders several Product Backlog items to unblock the Developers. Which concept does this action violate?**

- a) The Sprint Goal's integrity, because reordering the backlog mid-Sprint undermines the focus the team committed to at Sprint Planning.
- b) The Developers' self-management right, because backlog reordering decisions belong to the people doing the actual technical work.
- **`KEY` c) The PO's sole authority to order the Product Backlog — that authority does not transfer to the Scrum Master when the PO is absent.**
- d) The Scrum Master's facilitation role, which limits the Scrum Master to process coaching rather than any backlog-related decisions.

*explanation:* Only the PO holds authority to order the Product Backlog; that responsibility does not transfer to the Scrum Master when the PO is unavailable. The Scrum Master's role is to support and protect the process, not to assume PO authority. The organization must ensure PO coverage rather than reassign the ordering authority to another Scrum role.

### 454. SPO-AI-I · D3 · task 3.5 · `25d1158e`

> Explain the PO's collaboration with Developers on the backlog

**A new Product Owner asks why Developers, rather than the Product Owner, estimate backlog items. Which explanation is most accurate?**

- a) Developers estimate only when the Product Owner lacks domain expertise; otherwise the Product Owner sets initial figures.
- b) Developers estimate because estimates reflect implementation risk, which only emerges after the Product Owner defines value.
- c) Developers estimate so the Scrum Master can use the figures to measure team performance and report velocity to stakeholders.
- **`KEY` d) Developers estimate because they do the work and are best positioned to judge its technical effort and complexity.**

*explanation:* Developers own estimates because they execute the work and hold the technical knowledge needed to judge effort accurately. This is a matter of role accountability, not a workaround for stakeholder influence or a performance-measurement mechanism.

### 455. SPO-AI-I · D3 · task 3.7 · `bfeef7c5`

> Describe the product ecosystem and stakeholder relationships

**A hospital IT department builds a scheduling tool. Nurses use it daily, the CFO approved its budget, and a compliance officer monitors regulatory adherence. Which statement best describes these three roles?**

- **`KEY` a) All three are stakeholders; nurses are users and the CFO is the sponsor.**
- b) Only the CFO and compliance officer are stakeholders; nurses lack budget authority.
- c) Only the CFO is a stakeholder because stakeholders must hold financial responsibility.
- d) All three are users because each interacts with the product professionally.

*explanation:* Stakeholders encompass anyone affected by or having an interest in the product, so all three qualify. Users are those who directly operate the product — the nurses — while the CFO, who funds it, is the sponsor. The compliance officer is an affected stakeholder without being a user or sponsor. Restricting stakeholders to budget-holders confuses the sponsor role with the broader stakeholder category.

### 456. SPO-AI-I · D3 · task 3.7 · `c08b0309`

> Describe the product ecosystem and stakeholder relationships

**A hospital buys software for nurses to document patient care. The CFO approved the budget but never uses the system. Which statement correctly classifies these actors?**

- a) All three are stakeholders, so customer and user distinctions carry no practical meaning.
- b) The CFO is the customer because budget approval defines customer status; nurses are also customers.
- **`KEY` c) The hospital is the customer; nurses are users; the CFO is a stakeholder who is neither.**
- d) Nurses are the customers because direct daily use creates the strongest customer relationship.

*explanation:* Customer, user, and stakeholder are distinct roles. The hospital as the purchasing organization is the customer. Nurses are users because they interact with the system daily. The CFO is a stakeholder with interest in the outcome but is neither the organizational buyer nor a direct user. Collapsing all three into 'stakeholder' ignores meaningful distinctions. Equating budget approval with customer status confuses individual authority with organizational purchasing. Equating direct use with customer status misidentifies who holds the buying relationship.

### 457. SPO-AI-I · D3 · task 3.9 · `8502b174`

> Recall that the Product Owner is one accountable person, not a committee

**Which phrase from the Scrum Guide most precisely defines the structural nature of the Product Owner role?**

- **`KEY` a) One person, not a committee, accountable for product value and the Product Backlog.**
- b) A consensus-builder ensuring all stakeholder groups are represented in backlog decisions.
- c) A facilitator who surfaces committee preferences for the Scrum Team.
- d) A coordination role distributable across multiple people to reduce single-point-of-failure risk.

*explanation:* The Scrum Guide uses the exact formulation 'one person, not a committee' to define the Product Owner. Describing the role as a facilitator, consensus-builder, or distributable coordination function all misrepresent this single, undivided accountability.

### 458. SPO-AI-I · D4 · task 4.1 · `0858d045`

> Explain the Product Backlog as an emergent, ordered, single source

**Which statement best describes why the Product Backlog is considered 'never complete'?**

- a) Items are added only when the team requests them, keeping the backlog intentionally minimal.
- b) Items added after initial planning represent scope creep tracked separately from the backlog.
- c) All requirements must be fully detailed before development begins, a state never reached.
- **`KEY` d) Product, market, and stakeholder needs continuously evolve, generating new work over time.**

*explanation:* The Product Backlog is emergent: as the product evolves and the environment changes, new items arise and existing ones are refined or removed, making the backlog perpetually dynamic. Waiting for team requests before adding items contradicts proactive emergence, and treating late additions as scope creep misunderstands that ongoing change is normal, not a problem.

### 459. SPO-AI-I · D4 · task 4.12 · `839013cb`

> Recognize the feature waiter anti-pattern amplified by AI agents

**A PO defends every backlog item using stakeholder request frequency and usage rankings, explicitly avoiding personal judgment to prevent bias. Which problem does this create?**

- a) It over-indexes on quantitative data, which must be balanced with qualitative interviews to capture unarticulated needs.
- b) Usage data changes frequently, so this approach causes excessive backlog churn each refinement session.
- **`KEY` c) It mistakes demand aggregation for value discrimination, embedding the feature-waiter pattern behind apparent objectivity.**
- d) It violates the Scrum Guide, which requires the PO to set Sprint Goals independently of stakeholder input.

*explanation:* Delegating priority entirely to demand frequency is a sophisticated form of order-taking: it feels rigorous but replaces strategic judgment with a popularity contest. Value discrimination requires the PO to reason about product vision and outcomes, not merely aggregate signals. The 'bias' framing is a misconception that conflates strategic judgment with subjectivity.

### 460. SPO-AI-I · D4 · task 4.2 · `0755b213`

> Apply Product Backlog ordering to maximize value

**Midway through a Sprint, the PO learns a competitor launched a feature users have been requesting. The corresponding backlog item is currently ranked 8th. What is the correct PO action?**

- **`KEY` a) Reorder the backlog now so the item is near the top for the next Sprint Planning session.**
- b) Escalate to the most senior stakeholder to authorize the reordering before acting.
- c) Leave it at 8th until the Sprint ends; reordering mid-Sprint undermines team planning stability.
- d) Notify the team immediately so they can pull it into the current Sprint's scope.

*explanation:* The PO continuously reorders the backlog as new information emerges. The competitive launch raises the item's cost of delay, justifying immediate reordering for the next Sprint. The belief that reordering undermines planning, or that senior-stakeholder approval is required, are misconceptions this item directly tests.

### 461. SPO-AI-I · D4 · task 4.3 · `b99251fe`

> Select a well-formed user story, and an epic split that preserves value

**A team splits a large search-feature story into four equal-effort slices. The Product Owner notices one slice delivers no user-visible functionality on its own. What should the Product Owner do?**

- **`KEY` a) Reject the non-valuable slice and redefine slices so each delivers independently usable functionality.**
- b) Accept it but reclassify the non-valuable slice as a technical task outside the Product Backlog.
- c) Accept it; equal effort per slice is the primary criterion for a valid story split.
- d) Reject the entire split and keep the original story intact to avoid fragmenting its business value.

*explanation:* Valid story splitting requires each resulting slice to deliver something independently useful to a user. Equal effort is not the goal. Reclassifying a slice as a technical task sidesteps the real problem rather than fixing the split. Keeping the original story intact because splitting 'reduces value' is a misconception—well-split stories each carry real value.

### 462. SPO-AI-I · D4 · task 4.4 · `8016dfb9`

> Apply INVEST criteria to PBI quality

**A PBI reads: 'As a user, I want the system to be fast.' The team cannot agree on what 'fast' means or how to verify it. Which INVEST criterion does this most directly violate?**

- **`KEY` a) Testable — rewrite with measurable acceptance criteria, e.g., 'pages load within 2 seconds.'**
- b) Estimable — commission automated performance tests before accepting the story into the backlog.
- c) Valuable — rewrite to name the beneficiary, because unnamed beneficiaries make stories untestable.
- d) Small — split the story by technical layer into front-end, back-end, and database stories.

*explanation:* A story is Testable only when clear, objective conditions confirm it is done. 'Fast' is ambiguous without a measurable threshold, so Testable is the violated criterion. Commissioning pre-written automated tests confuses Testable with a Definition of Done practice; the criterion requires that tests can be defined, not that they already exist. Splitting by technical layer addresses Small, not Testable, and naming a beneficiary addresses Valuable.

### 463. SPO-AI-I · D4 · task 4.5 · `4c41886a`

> Select acceptance criteria that are clear and testable for a described Product Backlog item

**A Product Owner writes this acceptance criterion: 'The system should respond quickly.' A stakeholder requests a revision. What should the Product Owner do?**

- a) Ask the team to rewrite it at Sprint Planning, since they own acceptance criteria.
- **`KEY` b) Replace it with a measurable condition, such as 'Login page loads within 2 seconds.'**
- c) Keep it; the team can judge acceptable speed informally during testing.
- d) Move it to the Definition of Done so it applies to all performance stories.

*explanation:* Acceptance criteria must be verifiable by a specific, observable condition. Replacing vague language with a measurable threshold makes the criterion testable. Keeping vague wording relies on informal understanding, which is not a valid basis for done-ness. Moving it to the Definition of Done is wrong because this criterion is item-specific, not universal. Acceptance criteria are the Product Owner's responsibility, not the team's during Sprint Planning.

### 464. SPO-AI-I · D4 · task 4.5 · `21f9d683`

> Select acceptance criteria that are clear and testable for a described Product Backlog item

**During refinement, a developer suggests adding 'Use OAuth 2.0 for token exchange' as an acceptance criterion for a login story. How should the Product Owner respond?**

- a) Accept it; acceptance criteria should include implementation details for developer clarity.
- b) Accept it only if the DoD already mandates OAuth, making the criterion redundant but harmless.
- c) Defer the decision to Sprint Planning, where the team collectively authors acceptance criteria.
- **`KEY` d) Decline it and write an outcome-focused criterion, such as 'Users can log in with a third-party account.'**

*explanation:* Acceptance criteria define observable outcomes confirming done-ness for the user or business, not implementation choices. Specifying OAuth 2.0 constrains the solution unnecessarily and conflates a design decision with a verifiable condition. The Product Owner is responsible for ensuring criteria are outcome-focused, and that responsibility does not transfer to the team at Sprint Planning.

### 465. SPO-AI-I · D4 · task 4.7 · `e01b3fe2`

> Apply estimation techniques to PBIs

**A backlog item estimated at 5 points six months ago was never completed and is now back in Sprint planning. What should the team do?**

- a) Reduce the estimate because the team has had six months to learn more about the item.
- b) Accept the estimate as-is since the item was already refined and re-estimation wastes Sprint time.
- **`KEY` c) Re-estimate the item, because the team's reference scale or understanding may have changed.**
- d) Keep the 5-point estimate; story points are permanent attributes and should not change.

*explanation:* Estimates are not permanent; a team's velocity, reference stories, and understanding of a backlog item can all shift over time, making re-estimation appropriate when an item re-enters planning. Treating story points as fixed attributes ignores how relative calibration evolves. Assuming refinement history makes re-estimation unnecessary overlooks the elapsed time and potential changes in scope or context. Mechanically reducing the estimate assumes learning always simplifies work, which is not always true.

### 466. SPO-AI-I · D4 · task 4.7 · `afef2ca2`

> Apply estimation techniques to PBIs

**Team A completes 40 story points per Sprint; Team B completes 25. A manager concludes Team A is 60% more productive. What should the Product Owner explain?**

- a) Velocity can be compared after converting each team's points to equivalent hours of effort.
- b) The comparison is valid once both teams adopt the same organizational baseline for story sizing.
- **`KEY` c) Story points are team-specific relative units, so the numbers cannot be compared across teams.**
- d) Team A should recalibrate its scale downward so both teams' velocities align for fair reporting.

*explanation:* Story points are calibrated relative to a team's own reference stories, so a point value on one team's scale has no defined relationship to the same value on another team's scale. Cross-team velocity comparisons are therefore meaningless. There is no organizational baseline that makes points interchangeable across teams, and converting points to hours reintroduces the absolute time-tracking that relative estimation deliberately avoids.

### 467. SPO-AI-I · D4 · task 4.8 · `17c0ec0b`

> Apply story mapping to structure the backlog

**After two sprints, the team discovers users perform an activity not in the story map. What should the Product Owner do?**

- a) Insert the activity as a vertical column of technical tasks, then re-estimate all affected stories.
- b) Keep the backbone unchanged and log the new activity as a separate change-request document.
- **`KEY` c) Add the activity to the backbone in its narrative position and place supporting tasks beneath it.**
- d) Retire the map and use a flat backlog, since story maps are only useful before development starts.

*explanation:* Story maps are living artifacts that should be updated as the team learns more. Inserting the new activity in its correct narrative position, with tasks beneath it, keeps the map accurate and useful. Freezing the backbone because scope was agreed contradicts the inspect-and-adapt principle. Retiring the map after development begins discards a valuable communication tool. Organizing new work as a vertical technical column misapplies the map's structure.

### 468. SPO-AI-I · D4 · task 4.9 · `985ba0ee`

> Apply Spec-Driven Development: stories as agent-executable specifications

**An agent produces output that satisfies all acceptance criteria yet contradicts the product's intent. What should the Product Owner do to prevent this on the next story?**

- **`KEY` a) Align the 'so that' clause and acceptance criteria so together they make the intended business outcome verifiable.**
- b) Replace plain-language criteria with a formal BDD tool specification to give the agent an executable format.
- c) Reduce acceptance criteria so the agent has fewer constraints and more freedom to interpret intent.
- d) Add step-by-step implementation instructions so the agent follows a prescribed path and cannot deviate.

*explanation:* When an agent cannot ask clarifying questions, the 'so that' clause carries the intent and acceptance criteria must make that intent verifiable. Adding implementation steps over-constrains the solution. Reducing criteria removes necessary guardrails. A formal BDD tool is not required—well-written plain-language criteria can serve as the executable spec.

### 469. SPO-AI-I · D4 · task 4.9 · `e963cbe5`

> Apply Spec-Driven Development: stories as agent-executable specifications

**A Product Owner converts this story for an AI agent: 'As a buyer, I want to filter search results so that I find relevant products faster.' Which acceptance criterion raises precision without over-constraining implementation?**

- a) The agent must verify filter interactions pass automated Selenium tests before marking the story done.
- **`KEY` b) Applying a filter returns only items matching all selected criteria within two seconds.**
- c) The filter panel uses checkboxes in the left sidebar with a maximum of 10 visible options before scrolling.
- d) Filter behavior is acceptable once the QA team confirms it meets their test cases after development.

*explanation:* A precise, agent-executable criterion specifies an observable business outcome—matching results returned quickly—without dictating UI layout or implementation approach. Specifying checkboxes in a sidebar dictates the how, over-constraining the agent. Requiring Selenium tests shifts the acceptance mechanism to a tooling constraint rather than a business outcome. Deferring to QA after development treats acceptance criteria as a post-hoc checklist rather than an upfront specification.

### 470. SPO-AI-I · D5 · task 5.12 · `53f0f2e1`

> Diagnose why a product that is shipping steadily is still not creating value

**A Product Owner notices Ability to Innovate has declined each quarter even as Time to Market improved. Which interpretation is most consistent with EBM?**

- **`KEY` a) Growing technical debt or process overhead is limiting future value creation despite faster delivery.**
- b) Improved Time to Market offsets lower innovation scores, making the net EBM position neutral and requiring no action.
- c) Shorter sprints improve Time to Market, so the team should also shorten sprints to recover the innovation score.
- d) Ability to Innovate measures stakeholder satisfaction with feature novelty, so the team needs more creative design sessions.

*explanation:* In EBM, Ability to Innovate captures the team's capacity to deliver new value in the future — typically eroded by technical debt, manual processes, or rigid architecture. Faster delivery achieved by cutting corners can simultaneously reduce this capacity, creating a value debt that surfaces later. Ability to Innovate is not a creativity survey, and Time to Market is not determined solely by sprint length.

### 471. SPO-AI-I · D5 · task 5.12 · `39886fa8`

> Diagnose why a product that is shipping steadily is still not creating value

**An AI-assisted team reduced feature build cost by 60%. Leadership tells the Product Owner to clear the backlog faster since marginal cost per feature is now low. What is the most important flaw in this instruction?**

- a) Clearing the backlog faster reduces Unrealized Value, which is measured by backlog size, harming the team's EBM position.
- **`KEY` b) Lower build cost does not change whether backlog items solve real problems; shipping low-value items faster still produces no outcome.**
- c) The Product Owner should comply to keep the team fully utilized, since idle sprint capacity is the primary source of value loss.
- d) More features give customers more options, and AI ensures quality stays high at higher velocity, so the instruction is sound.

*explanation:* Marginal cost reduction affects the economics of building, not the value of what is built. If backlog items do not address validated user needs, shipping them cheaply and quickly accelerates the feature factory trap rather than escaping it. Unrealized Value in EBM is not backlog size, and team utilization is not a value metric — both reflect common but distinct misconceptions about what drives product value.

### 472. SPO-AI-I · D5 · task 5.2 · `cb291e64`

> Explain the Product Goal as a commitment to the Product Backlog

**Which statement correctly describes who is responsible for the Product Goal?**

- a) The Scrum Master owns the Product Goal and communicates it to developers and stakeholders.
- **`KEY` b) The Product Owner is accountable for the Product Goal and ensures it is visible to stakeholders.**
- c) The entire Scrum Team co-authors the Product Goal during Sprint Planning, sharing equal ownership.
- d) The Developers define the Product Goal based on technical feasibility and update it each Retrospective.

*explanation:* The Product Owner is accountable for the Product Goal and for ensuring it is understood and visible to stakeholders. It is not a Scrum Master responsibility, not co-authored exclusively in Sprint Planning, and not determined by Developers based on technical feasibility.

### 473. SPO-AI-I · D5 · task 5.4 · `949e36dd`

> Measure product value and outcomes

**In EBM, Time to Market is best measured by tracking which of the following on an ongoing basis?**

- a) Number of releases shipped per quarter, since more frequent releases indicate a shorter Time to Market.
- b) Elapsed calendar months from initial project approval to the product's first public launch.
- **`KEY` c) Cycle time from when a validated user need is identified to when a solution reaches users in production.**
- d) Number of sprints planned per quarter, reflecting the team's release cadence and delivery frequency.

*explanation:* In EBM, Time to Market is an ongoing measure of how quickly the organization can repeatedly deliver value — not a one-time launch milestone. Cycle time from identified need to production delivery captures this continuous capability. First-launch elapsed time is a one-off milestone. Sprint count and release frequency indicate cadence but do not measure the actual elapsed time from need identification to delivery.

### 474. SPO-AI-I · D5 · task 5.4 · `92d13981`

> Measure product value and outcomes

**A product has very high Current Value scores but near-zero Unrealized Value. What should the Product Owner do?**

- **`KEY` a) Investigate whether the market is genuinely saturated or whether the team has simply stopped discovering latent user needs that remain unaddressed.**
- b) Declare the product optimized and redirect investment toward a new product that targets clearly unmet needs in adjacent markets.
- c) Increase sprint velocity to sustain high Current Value delivery, ensuring throughput gains do not erode existing quality standards.
- d) Prioritize reducing Time to Market so that future enhancements reach users ahead of competitors who may be targeting the same value gaps.

*explanation:* Near-zero Unrealized Value could mean the market is genuinely saturated, but it may also indicate the team has stopped exploring unmet needs. The Product Owner should investigate before concluding the product has reached its ceiling. Shifting investment toward new products or optimizing velocity without that investigation is premature, as is focusing solely on Time to Market when the root cause of the low Unrealized Value score has not been established.

### 475. SPO-AI-I · D5 · task 5.5 · `a3f8c31e`

> Apply forecasting and release planning

**Team A averages 8 stories per sprint with low variance. Team B averages 12 stories with high variance. For a fixed-scope release of 48 stories, which team is more likely to finish on or before the target date?**

- a) Team B, because high variance occasionally produces very fast sprints that can offset slow ones on average.
- b) Team B, because higher average throughput reduces the expected number of sprints required.
- **`KEY` c) Team A, because low variance makes its delivery date more predictable and reduces the probability of late completion.**
- d) Both teams are equally likely, because average throughput determines delivery date regardless of variance.

*explanation:* High variance inflates the probability of late delivery even when average throughput is higher. A consistent lower throughput yields a tighter, more reliable forecast. Team A, averaging 8 stories with low variance, is more likely to finish on or before a specific target date than Team B, whose high variance makes late completion more probable despite the higher average.

### 476. SPO-AI-I · D5 · task 5.8 · `a540ca03`

> Manage stakeholders and collaborate across the ecosystem

**Midway through a Sprint, the team discovers a technical risk that will likely delay a key stakeholder's expected release. What should the Product Owner do immediately?**

- **`KEY` a) Communicate the risk and likely impact to affected stakeholders now so they can adjust their plans.**
- b) Withhold the risk until it is resolved, sharing only confirmed outcomes to maintain stakeholder confidence.
- c) Wait until the Sprint Review, since that is the designated inspection point for sharing progress updates.
- d) Ask the Scrum Master to handle stakeholder communication, since managing impediments is their responsibility.

*explanation:* Transparency with stakeholders means providing accurate, timely information about risks — not waiting for a ceremony, concealing problems until resolved, or delegating stakeholder communication to the Scrum Master. The Scrum Master removes internal impediments but does not own stakeholder relationships; that accountability belongs to the Product Owner. Proactive communication allows stakeholders to make informed decisions and preserves trust.

### 477. SPO-AI-I · D5 · task 5.8 · `bc868d1b`

> Manage stakeholders and collaborate across the ecosystem

**Two senior stakeholders demand conflicting features for the next Sprint. The executive sponsor wants a reporting dashboard; the key customer wants a checkout redesign. Both claim top priority. What should the Product Owner do?**

- a) Prioritize the executive sponsor's dashboard, because organizational hierarchy determines backlog order.
- b) Escalate the conflict to the Scrum Master, since resolving stakeholder disputes is outside the Product Owner's authority.
- c) Split Sprint capacity equally between both features to preserve both stakeholder relationships.
- **`KEY` d) Facilitate a value-based conversation with both stakeholders and order the backlog against product goals.**

*explanation:* The Product Owner owns backlog ordering and must navigate competing demands by anchoring decisions to product goals and value — not seniority or compromise. Escalating to the Scrum Master misassigns the Product Owner's core accountability. Defaulting to hierarchy ignores value. Splitting effort equally between conflicting items delivers neither fully, eroding overall value.

### 478. SPO-AI-I · D5 · task 5.8 · `d3c9aef7`

> Manage stakeholders and collaborate across the ecosystem

**During a Sprint Review, two stakeholders propose contradictory directions for the next Sprint. What is the Product Owner's correct response in that moment?**

- a) Defer the discussion and ask the Scrum Master to facilitate a separate alignment meeting afterward, keeping the Sprint Review free from conflict.
- b) Accept both directions and deliver partial solutions to each stakeholder, balancing competing demands to preserve key relationships and avoid escalation.
- **`KEY` c) Invite collaborative discussion among those present, anchoring the conversation toward a shared direction by referencing the product goal.**
- d) Log both requests without comment and later prioritize whichever stakeholder holds the larger budget allocation or organizational authority.

*explanation:* The Sprint Review is a collaborative inspection-and-adaptation event; the Product Owner should use it to surface and work through conflicting input in real time, anchoring decisions to the product goal. Splitting demands into partial solutions dilutes value. Deferring to the Scrum Master misplaces accountability for backlog decisions, and prioritizing by budget or authority substitutes organizational politics for product thinking.

### 479. SPO-AI-I · D5 · task 5.9 · `9974aabb`

> Facilitate the Sprint Review as the PO's key value-inspection event

**A stakeholder says the Sprint Review feels like a one-way presentation. What change should the Product Owner make to the next Sprint Review?**

- a) Assign a dedicated facilitator to own the agenda and keep the demo on schedule, minimizing interruptions from stakeholders.
- b) Distribute a detailed written summary of completed work beforehand so the session itself can focus on formal stakeholder sign-off and acceptance.
- c) Ensure all Sprint Backlog items are complete before the session so stakeholders have a full, reviewable increment to evaluate and approve.
- **`KEY` d) Structure the session around collaborative discussion of value and next steps, inviting stakeholder input and feedback throughout the event.**

*explanation:* The Sprint Review is designed as a working session, not a one-way demo. Structuring it around collaborative dialogue on value and next steps directly addresses the stakeholder's concern. Controlling the agenda to minimize interruptions or shifting focus to formal sign-off only reinforces the one-way presentation dynamic the stakeholder identified as the problem.

### 480. SPO-AI-I · D5 · task 5.9 · `f7fc872b`

> Facilitate the Sprint Review as the PO's key value-inspection event

**During a Sprint Review, stakeholders raise new market insights and suggest significant backlog changes. As Product Owner, what should you do?**

- a) Redirect stakeholders to a follow-up meeting so the team can finish the planned demonstration first.
- b) Ask the Scrum Master to manage the conversation so new requests do not disrupt the demonstration.
- **`KEY` c) Engage stakeholders collaboratively and use their input to adapt the Product Backlog during the session.**
- d) Log the suggestions as optional input and make backlog decisions independently after the Review.

*explanation:* The Sprint Review is a working session where the Scrum Team and stakeholders collaboratively inspect the Increment and adapt the Product Backlog — market insights raised mid-session are exactly the input this event is designed to capture. Redirecting stakeholders to a follow-up meeting misrepresents the Review's purpose. Treating suggestions as merely optional input contradicts the collaborative, value-optimizing intent of the event. Delegating conversation management to the Scrum Master removes the Product Owner from their core accountability of backlog adaptation.

