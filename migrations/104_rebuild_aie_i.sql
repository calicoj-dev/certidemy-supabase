-- ============================================================================
-- 104_rebuild_aie_i.sql
--
-- REBUILD AIE-I (AI Essentials I) AFTER A UUID COLLISION.
--
-- WHAT HAPPENED. AIE-I was created at 66666666-6666-6666-6666-666666666666.
-- Migration 090 (090_aie_i_jta_v2_cognitive_fix.sql) declares that UUID and passed its
-- own guard "AIE-I domains D1/D3 not found - wrong cert id?", so at that time the slot
-- held AIE-I. Migration 102 (seed_aism_i) later scaffolded AISM-I onto the SAME UUID,
-- because the deterministic-UUID convention numbers certs by creation order and "the
-- sixth cert" landed on a slot that was already occupied. AIE-I was OVERWRITTEN, not
-- deleted. No DELETE statement exists in any committed migration, and no orphan rows
-- survive in any of the 18 tables carrying certification_id - a complete overwrite
-- leaves no debris, which is exactly why it read as a clean cascade delete.
--
-- WHY NOTHING CAUGHT IT. verify-cert.mjs validates each certification against itself.
-- It has no invariant for "this id already belongs to another certification", so both
-- certs passed. The final check in section 7 is the one that would have caught it.
--
-- THIS MIGRATION rebuilds AIE-I at 22222222-2222-2222-2222-222222222222 - the one
-- genuinely free slot in the deterministic set (1111 SM-AI-I, 3333 SPO-AI-I,
-- 4444 SD-AI-I, 5555 AIGRM-I, 6666 AISM-I).
--
-- SOURCES. Scaffold reconstructed from AIE-I_JTA_v2_0.md (v1.1 LOCKED) with migration
-- 090's revisions applied: 1.1 statement sharpened; 1.5 and 3.4 re-declared 1_remember
-- with rewritten statements; new tasks 1.7 (1_remember) and 3.5 (3_apply). Exam facts
-- from the JTA. Duration 45 minutes per migration 100, which supersedes the JTA's 30.
--
-- COMPUTED PROFILE (domain-weighted across 18 exam-scope tasks). Recomputed from the
-- reconstructed task set and reproduces migration 090's stated post-fix figures:
--     1_remember    16.23%    (090 states 16.2)
--     2_understand  51.37%    (090 states 51.4)
--     3_apply       32.40%    (090 states 32.4)
--
-- *** ONE RECONSTRUCTED ELEMENT - READ BEFORE REGENERATING THE ITEM BANK ***
-- The JTA records concept SLUGS but not concept DESCRIPTIONS; those existed only in the
-- database. The 47 descriptions below are AUTHORED from each task's KSA lines - they are
-- not recovered. Structure (slug, name, task linkage) is exact; wording is not. Reconcile
-- them against the 16 authored lessons in content/aie-i/ BEFORE running gen-cert-secure.mjs,
-- because items are written against concept definitions.
--
-- ORDER IS INVARIANT-17-SAFE: cert (exam_blueprint NULL) -> domains -> concepts -> tasks
-- -> task_concepts -> modules -> THEN exam_blueprint computed from v_cognitive_profile.
-- Never set the blueprint before the tasks exist.
--
-- VERIFIED AGAINST THE LIVE REBUILD (2026-07-20): verify-cert.mjs --cert AIE-I
-- returned 23 pass / 0 fail / 0 warn, ALL INVARIANTS HOLD, after this migration plus
-- 16 lessons x 3 languages loaded, wired, and 432 secure + 540 practice items generated.
--
-- Idempotent and re-runnable. Aborts if the target UUID or the code AIE-I is taken.
-- ============================================================================

do $$
declare
  v_cert uuid := '22222222-2222-2222-2222-222222222222';
  v_d    uuid;
  v_t    uuid;
  n      integer;
  w      numeric;
begin
  -- ---- 0. COLLISION GUARD - the whole reason this migration exists --------
  if exists (select 1 from public.certifications where id = v_cert and code <> 'AIE-I') then
    raise exception 'UUID % is already held by another certification. Refusing to repeat the 6666 collision.', v_cert;
  end if;
  if exists (select 1 from public.certifications where code = 'AIE-I' and id <> v_cert) then
    raise exception 'Code AIE-I already exists under a different id. Resolve before running.';
  end if;

  -- ---- 1. CERT ROW (exam_blueprint deliberately NULL; set in section 6) ---
  insert into public.certifications
    (id, code, name, provider, description, price_usd, exam_duration_minutes,
     passing_score_pct, num_questions, difficulty_level, is_published, category_slug,
     tier, sort_order, status, exam_blueprint)
  values
    (v_cert, 'AIE-I', 'Certidemy AI Essentials I - AI', 'Certidemy',
     'A freemium AI-literacy credential for non-technical professionals. Proves a person can understand, evaluate, and use everyday AI tools safely, responsibly, and with sound judgment in a workplace context. The literacy floor beneath the rest of the catalog.',
     0, 45, 80.00, 25, 1, false, 'ai-workplace', 1, 5, 'draft', null)
  on conflict (id) do update set
    code = excluded.code, name = excluded.name, provider = excluded.provider,
    description = excluded.description, exam_duration_minutes = excluded.exam_duration_minutes,
    passing_score_pct = excluded.passing_score_pct, num_questions = excluded.num_questions,
    category_slug = excluded.category_slug, status = excluded.status,
    is_published = excluded.is_published, updated_at = now();

  -- ---- 2. DOMAINS (40 / 36 / 24 - sums to 100) ---------------------------
  insert into public.domains (certification_id, code, title, description, weight_pct, order_index)
  values (v_cert, 'D1', 'AI Concepts & Landscape', 'What AI is, how it works at a high level, where it shows up at work, and what it cannot reliably do.', 40.0, 1) on conflict do nothing;
  insert into public.domains (certification_id, code, title, description, weight_pct, order_index)
  values (v_cert, 'D2', 'Working with Generative AI', 'Prompting, capabilities and limits, hallucination, verification, and choosing when generative AI is the right tool.', 36.0, 2) on conflict do nothing;
  insert into public.domains (certification_id, code, title, description, weight_pct, order_index)
  values (v_cert, 'D3', 'Responsible & Safe Use at Work', 'Privacy, bias, human oversight, acceptable-use policy, and the ethical red lines of workplace AI use.', 24.0, 3) on conflict do nothing;

  -- ---- 3. CONCEPTS (47) - descriptions AUTHORED, see header warning ------
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'acceptable-use-policy', 'Acceptable-Use Policy', 'Organizational rules on approved tools, permitted data, disclosure, and prohibited uses.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'accountability', 'Accountability', 'Responsibility for an outcome stays with a person; it cannot be delegated to a tool.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'agent-vs-chatbot', 'Agent vs Chatbot', 'A chatbot responds; an agent pursues a goal and takes actions to reach it.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'agentic-ai', 'Agentic AI', 'AI that plans, uses tools, and acts across multiple steps with limited supervision.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'ai-agent', 'AI Agent', 'A single AI system that acts toward a goal - it can plan, use tools, and take steps rather than only answering.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'ai-bias', 'AI Bias', 'Systematic skew in AI output that disadvantages some people or groups.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'ai-in-the-workplace', 'AI in the Workplace', 'How AI tools show up across HR, marketing, finance, sales, service, and operations.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'ai-limitations', 'AI Limitations', 'What current AI cannot reliably do: verify facts, reason about novel situations, guarantee consistency.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'ai-use-cases', 'Common AI Use Cases', 'Where AI appears in everyday work: drafting, summarizing, analysis, support, scheduling.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'ai-vs-automation', 'AI vs Automation', 'Rule-based automation follows fixed instructions a person wrote; AI works out how to respond from patterns in data.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'ai-vs-software', 'AI vs Conventional Software', 'Conventional software executes explicit logic a person wrote; AI produces outputs from a learned model.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'bias-from-data', 'Bias from Data', 'Bias largely originates in training data and is reproduced by the model.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'check-sources', 'Check Sources', 'Confirming that cited references exist and say what the output claims.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'confident-but-wrong', 'Confident but Wrong', 'Fluency and certainty of tone carry no information about accuracy.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'constraints-and-format', 'Constraints and Format', 'Bounding length, tone, audience, and output shape so the result is usable.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'data-leakage', 'Data Leakage', 'Confidential information leaving the organization by being entered into an external tool.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'data-privacy', 'Data Privacy', 'Protecting personal and confidential information when using AI tools.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'disclosure-and-transparency', 'Disclosure and Transparency', 'Telling people when AI was materially used to produce work.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'ethical-red-lines', 'Ethical Red Lines', 'Uses that are off-limits regardless of whether a policy names them.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'fairness-awareness', 'Fairness Awareness', 'Noticing where AI output could produce unfair treatment.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'foundation-model', 'Foundation Model', 'A large general-purpose model trained broadly and adapted to many downstream uses.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'genai-capabilities', 'Generative AI Capabilities', 'What current tools do well: drafting, rephrasing, summarizing, translating, ideating.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'genai-limitations', 'Generative AI Limitations', 'Where current tools fail: factual accuracy, arithmetic, recency, source attribution.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'generative-ai', 'Generative AI', 'Machine learning that produces new content - text, image, audio, code - rather than only classifying or predicting.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'hallucination', 'Hallucination', 'Confident output that is fabricated rather than grounded in fact.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'human-in-the-loop', 'Human in the Loop', 'A person reviews and approves before an AI-influenced decision takes effect.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'human-oversight', 'Human Oversight', 'Keeping a person accountable for decisions an AI system informs.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'human-review', 'Human Review', 'A person reads, judges, and takes responsibility for the output before it is used.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'knowledge-cutoff', 'Knowledge Cutoff', 'The date past which a model has no trained knowledge of events.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'large-language-model', 'Large Language Model', 'A foundation model trained on text that predicts and generates language.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'machine-learning', 'Machine Learning', 'Building systems that learn patterns from data rather than being explicitly programmed.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'model-as-prediction', 'The Model Predicts, It Does Not Know', 'A language model generates the next most plausible words; it is not looking anything up or checking whether it is true.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'natural-language-instruction', 'Natural-Language Instruction', 'Directing a system in ordinary language rather than code or query syntax.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'no-real-understanding', 'No Real Understanding', 'Fluent output does not indicate comprehension, intent, or awareness.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'no-secrets-in-prompts', 'No Secrets in Prompts', 'Never paste credentials, personal data, or confidential material into a public AI tool.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'not-a-source-of-truth', 'Not a Source of Truth', 'AI output is a draft to be checked, not an authority to be cited.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'plausible-not-true', 'Plausible, Not True', 'Models optimize for plausible continuation, which is not the same as truth.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'prompt', 'Prompt', 'The instruction given to a generative AI system.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'prompt-structure', 'Prompt Structure', 'The parts of an effective prompt and how they fit together.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'prompt-vs-search', 'Prompt vs Search Query', 'A search query retrieves existing documents; a prompt instructs a model to produce something.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'right-tool-for-task', 'Right Tool for the Task', 'Matching the tool to the job rather than defaulting to AI.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'role-context-task', 'Role, Context, Task', 'Stating who the model should act as, the background it needs, and what to produce.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'traditional-ai', 'Traditional AI', 'Earlier AI focused on classification, prediction, and optimization rather than content generation.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'training-vs-inference', 'Training vs Inference', 'Training is learning from data; inference is using the trained model to answer.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'verify-outputs', 'Verify Outputs', 'Checking AI output against an independent source before relying on it.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'what-is-ai', 'What Is AI', 'Systems that perform tasks normally associated with human intelligence.') on conflict do nothing;
  insert into public.concepts (certification_id, slug, name, description)
  values (v_cert, 'when-not-to-use-ai', 'When Not to Use AI', 'Situations where AI is a poor or unsafe choice.') on conflict do nothing;

  -- ---- 4. TASKS (18) + task_concepts (55) --------------------------------
  select id into v_d from public.domains where certification_id = v_cert and code = 'D1';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '1.1', 'Distinguish artificial intelligence from ordinary software and automation', 'high', 'occasional',
     '2_understand', true, false, 'Working definition of AI (systems that perform tasks associated with human intelligence); how AI differs from rule-based automation and conventional software', 'Given an example, judge whether it is "AI" or plain automation', 'Skepticism toward "AI-washing"; recognizing marketing hype vs. real capability', 1,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '1.1'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('what-is-ai', 'ai-vs-automation', 'ai-vs-software')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D1';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '1.2', 'Distinguish machine learning and generative AI from traditional AI', 'high', 'occasional',
     '2_understand', true, false, 'ML as learning patterns from data (vs. hand-coded rules); generative AI as producing new content (text, images, code); the idea of training vs. using (inference) at a plain-language level', 'Sort examples into "traditional/rule-based", "machine learning", "generative"', 'Comfort with not needing the math - understanding the *category*, not the model', 2,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '1.2'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('machine-learning', 'generative-ai', 'traditional-ai', 'training-vs-inference')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D1';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '1.3', 'Explain what a foundation model / large language model is at a high level', 'high', 'occasional',
     '2_understand', true, false, 'LLM as a model trained on large text corpora that predicts likely next words; "foundation model" as a general-purpose base adaptable to many tasks; not a database, not a search engine, not a person', 'Explain in one sentence, to a colleague, what an LLM does', 'Demystification - it''s a prediction engine, not a mind', 3,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '1.3'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('foundation-model', 'large-language-model', 'model-as-prediction')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D1';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '1.4', 'Describe what an AI agent (agentic AI) is and how it differs from a chatbot', 'medium', 'occasional',
     '2_understand', true, false, 'An agent as an AI that can take multi-step actions toward a goal (use tools, call other systems) rather than only replying; contrast with a single-turn chatbot; still requires human oversight and goals set by a person', 'Recognize whether a described tool is "just answering" or "taking actions"', 'Appropriate caution - more autonomy means more need for oversight (bridges to D3)', 4,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '1.4'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('ai-agent', 'agentic-ai', 'agent-vs-chatbot')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D1';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '1.5', 'Recall common AI use cases across everyday workplace functions', 'high', 'daily',
     '1_remember', true, false, 'Typical use cases - drafting/summarizing text, answering questions, analyzing data, generating images, coding assistance, customer support, screening/triage', 'Match a business need to a plausible AI use case (and spot a poor fit)', 'Opportunity-awareness balanced with realism about limits', 5,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '1.5'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('ai-use-cases', 'ai-in-the-workplace')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D1';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '1.6', 'Identify what current AI cannot reliably do', 'high', 'daily',
     '2_understand', true, false, 'Current GenAI does not "know" facts, cannot guarantee correctness, has a knowledge cutoff, can''t be assumed current, and does not truly reason like a person', 'Flag a task where AI is the wrong or risky tool', 'Healthy skepticism as a default posture (sets up D2 verification + D3 trust)', 6,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '1.6'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('ai-limitations', 'not-a-source-of-truth', 'no-real-understanding')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D1';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '1.7', 'Recall the core AI vocabulary: artificial intelligence, machine learning, generative AI, large language model, foundation model, and AI agent', 'high', 'weekly',
     '1_remember', true, false, 'The definitions of the core terms, and which term names which thing. That "AI" is the umbrella, machine learning a way of building it, generative AI a kind of machine learning, an LLM a kind of generative model, a foundation model a general-purpose base, and an agent a system that acts.', 'Name the right term for a described system; recognize the term when a vendor or colleague uses it.', 'Comfort with the vocabulary - enough to read a proposal, sit in a procurement meeting, and not be sold something by its label.', 7,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '1.7'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('what-is-ai', 'machine-learning', 'generative-ai', 'large-language-model', 'foundation-model', 'ai-agent')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D2';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '2.1', 'Explain what a prompt is and how it differs from a search query', 'high', 'daily',
     '2_understand', true, false, 'A prompt as a natural-language instruction to a model; unlike a search (which retrieves existing pages), a prompt asks the model to generate a response', 'Rewrite a vague request as a clearer instruction', 'Willingness to be explicit rather than terse', 1,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '2.1'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('prompt', 'prompt-vs-search', 'natural-language-instruction')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D2';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '2.2', 'Apply the basic elements of an effective prompt (role, context, task, constraints, format)', 'high', 'daily',
     '3_apply', true, false, 'The five common building blocks - who the AI should act as (role), background (context), what to do (task), limits (constraints), and desired output shape (format)', 'Improve a weak prompt by adding the missing elements', 'Iterative mindset - prompting is a conversation, not a one-shot', 2,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '2.2'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('prompt-structure', 'role-context-task', 'constraints-and-format')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D2';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '2.3', 'Describe the capabilities and limitations of current generative AI tools', 'high', 'daily',
     '2_understand', true, false, 'Strong at drafting, summarizing, rephrasing, brainstorming, translating; weak/unreliable at exact facts, current events past a cutoff, arithmetic, citations, and anything requiring guaranteed accuracy', 'Predict whether a given task will play to a strength or a weakness', 'Matching the tool to the job rather than over-trusting it', 3,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '2.3'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('genai-capabilities', 'genai-limitations', 'knowledge-cutoff')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D2';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '2.4', 'Explain what AI "hallucination" is and why it happens', 'high', 'daily',
     '2_understand', true, false, 'Hallucination as fluent, confident output that is factually wrong or invented (fake citations, made-up details); it stems from prediction of plausible text, not intent to deceive or a "bug" to report', 'Recognize a likely hallucination in a sample output', 'Treating confidence as no guarantee of correctness', 4,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '2.4'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('hallucination', 'confident-but-wrong', 'plausible-not-true')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D2';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '2.5', 'Verify and evaluate AI output before relying on it', 'high', 'daily',
     '3_apply', true, false, 'Verification habits - check facts against a trusted source, confirm citations exist, sanity-check numbers, never publish/act on unreviewed output for anything that matters', 'Given an output and a use context, decide what must be verified before use', 'Ownership - the human, not the AI, is accountable for the result', 5,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '2.5'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('verify-outputs', 'check-sources', 'human-review')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D2';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '2.6', 'Choose when generative AI is and is not the right tool for a task', 'medium', 'daily',
     '3_apply', true, false, 'Good fits (first drafts, brainstorming, summaries) vs. poor/risky fits (authoritative facts, legal/medical/financial decisions, anything with confidential data or requiring guaranteed accuracy without review)', 'Given a scenario, decide "use AI", "use AI then verify", or "don''t use AI"', 'Judgment over reflex - reaching for AI only where it genuinely helps', 6,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '2.6'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('right-tool-for-task', 'when-not-to-use-ai')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D3';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '3.1', 'Protect privacy and confidential data when using AI tools', 'high', 'daily',
     '3_apply', true, false, 'Why pasting confidential, personal, or client data into public AI tools is risky (it may be stored, used for training, or exposed); the difference between approved enterprise tools and public consumer ones', 'Given a scenario, decide what is safe vs. unsafe to enter into a tool', 'Instinctive caution with sensitive information ("don''t paste secrets")', 1,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '3.1'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('data-privacy', 'data-leakage', 'no-secrets-in-prompts')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D3';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '3.2', 'Recognize bias and fairness risks in AI outputs', 'high', 'occasional',
     '2_understand', true, false, 'AI can reflect and amplify bias present in its training data; outputs can be unfair or stereotyped, with real impact in hiring, lending, and similar high-stakes uses', 'Spot a potentially biased or unfair output in an example', 'Awareness that "the AI said so" is never a defense for an unfair outcome', 2,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '3.2'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('ai-bias', 'fairness-awareness', 'bias-from-data')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D3';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '3.3', 'Apply the principle of human oversight (keeping a human in the loop)', 'high', 'daily',
     '3_apply', true, false, 'A human must review and remain accountable for AI-assisted decisions, especially those affecting people; more autonomy/impact means more oversight', 'Given a decision, judge whether a human must review it before it takes effect', 'Owning the outcome; not outsourcing responsibility to the tool', 3,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '3.3'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('human-oversight', 'human-in-the-loop', 'accountability')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D3';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '3.4', 'Recall the ethical red lines for workplace AI use and when disclosure is expected', 'high', 'daily',
     '1_remember', true, false, 'Organizations commonly set rules on which tools are approved, what data may be used, and when AI use must be disclosed; basic red lines (don''t deceive, don''t plagiarize, don''t use AI to harm or discriminate); relevance of the EU AI Act''s Article 4 literacy expectation at a plain-language level', 'Given a workplace situation, identify the responsible action per typical policy', 'Professional integrity - treating AI use as something to do openly and by the rules', 4,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '3.4'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('acceptable-use-policy', 'ethical-red-lines', 'disclosure-and-transparency')
  on conflict do nothing;

  select id into v_d from public.domains where certification_id = v_cert and code = 'D3';
  v_t := null;
  insert into public.tasks
    (certification_id, domain_id, code, statement, criticality, frequency, bloom_level,
     is_exam_scope, is_simulation_candidate, knowledge, skills, abilities, order_index, notes)
  values (v_cert, v_d, '3.5', 'Apply the organization''s AI-use policy to decide whether a specific use is permitted', 'high', 'weekly',
     '3_apply', true, false, 'What an acceptable-use policy covers: approved tools, permitted data, required disclosure, prohibited uses. That an absent policy does not mean permission.', 'Read a described situation and decide whether the intended AI use is permitted, needs disclosure, or is barred.', 'Willingness to stop and ask rather than assume permission.', 5,
     'Rebuilt by migration 104 after the 6666 UUID collision. Source: AIE-I_JTA_v2_0.md with migration 090 revisions applied.')
  on conflict do nothing
  returning id into v_t;
  if v_t is null then select id into v_t from public.tasks where certification_id = v_cert and code = '3.5'; end if;
  insert into public.task_concepts (task_id, concept_id)
  select v_t, c.id from public.concepts c
  where c.certification_id = v_cert and c.slug in ('acceptable-use-policy', 'disclosure-and-transparency')
  on conflict do nothing;

  -- ---- 5. MODULES (3, one per domain) ------------------------------------
  -- load-lessons-direct.mjs strips the leading NN- from the content folder name
  -- before matching, so module slugs are BARE. Folders on disk are
  -- 01-ai-concepts-and-landscape / 02-working-with-generative-ai /
  -- 03-responsible-and-safe-use-at-work; the slugs below drop the numeric prefix.
  insert into public.modules (certification_id, title, slug, description, order_index, estimated_minutes)
  values
    (v_cert, 'AI Concepts & Landscape',        'ai-concepts-and-landscape',        'What AI is and what it cannot reliably do.',     1, 45),
    (v_cert, 'Working with Generative AI',     'working-with-generative-ai',       'Prompting, limits, hallucination, verification.', 2, 45),
    (v_cert, 'Responsible & Safe Use at Work', 'responsible-and-safe-use-at-work', 'Privacy, bias, oversight, policy, red lines.',    3, 40)
  on conflict do nothing;

  -- ---- 6. PROOF ----------------------------------------------------------
  select count(*) into n from public.domains  where certification_id = v_cert;
  if n <> 3  then raise exception 'Expected 3 domains, got %', n;  end if;
  select count(*) into n from public.concepts where certification_id = v_cert;
  if n <> 47 then raise exception 'Expected 47 concepts, got %', n; end if;
  select count(*) into n from public.tasks    where certification_id = v_cert;
  if n <> 18 then raise exception 'Expected 18 tasks, got %', n;    end if;
  select count(*) into n from public.task_concepts tc
    join public.tasks t on t.id = tc.task_id where t.certification_id = v_cert;
  if n <> 55 then raise exception 'Expected 55 task_concepts, got %', n; end if;
  select round(sum(weight_pct),2) into w from public.domains where certification_id = v_cert;
  if w <> 100 then raise exception 'Domain weights sum to %, not 100', w; end if;
  raise notice 'AIE-I rebuilt: 3 domains, 18 tasks, 47 concepts, 55 links.';
end $$;

-- ============================================================================
-- 6. EXAM BLUEPRINT - set from the LIVE computed profile, never transcribed.
--    Runs AFTER the tasks exist (invariant 17).
-- ============================================================================
update public.certifications c
set exam_blueprint = jsonb_build_object(
  'version', '2.0',
  'basis', 'Certidemy Cognitive Model v2.0: an item''s cognitive level EQUALS its task''s declared level, so the form''s profile is a computed consequence of the JTA, not a target asserted over it.',
  'derived_from', 'tasks.bloom_level x domains.weight_pct over exam-scope tasks (see public.v_cognitive_profile)',
  'computed_at', to_char(current_date, 'YYYY-MM-DD'),
  'assembly', jsonb_build_object(
    'sample_by', 'domain weight_pct, then across tasks within each domain',
    'balance',   'difficulty spread within each task''s items',
    'cognition', 'follows automatically: every item carries its task''s bloom_level, so a domain-proportional draw reproduces cognitive_profile without needing to enforce it'
  ),
  'difficulty_mix', jsonb_build_object('easy', 30, 'moderate', 50, 'hard', 20),
  'difficulty_note', 'Difficulty is orthogonal to cognitive level. An easy Apply item and a hard Apply item are both Apply items. Items are made harder by subtler content, closer distractors, or less familiar situations - NEVER by raising the cognitive level.',
  'task_counts', (
    select jsonb_object_agg(x.bloom_level::text, x.n)
    from (select bloom_level, count(*) as n from public.tasks
          where certification_id = '22222222-2222-2222-2222-222222222222'
            and is_exam_scope group by 1) x
  ),
  'cognitive_profile', (
    select jsonb_object_agg(p.bloom_level::text, p.pct_of_form)
    from public.v_cognitive_profile p
    where p.certification_id = '22222222-2222-2222-2222-222222222222'
  )
)
where c.id = '22222222-2222-2222-2222-222222222222';

-- ============================================================================
-- 7. VERIFICATION
-- ============================================================================

-- Expect 1_remember 16.23 / 2_understand 51.37 / 3_apply 32.40
select bloom_level, tasks, pct_of_form
from public.v_cognitive_profile
where certification_id = '22222222-2222-2222-2222-222222222222'
order by bloom_level;

-- No concept may be orphaned. Expect 0 rows.
select c.slug as orphaned_concept
from public.concepts c
left join public.task_concepts tc on tc.concept_id = c.id
where c.certification_id = '22222222-2222-2222-2222-222222222222'
  and tc.concept_id is null;

-- No exam-scope task may exceed AIE-I's declared Bloom ceiling of 3_apply. Expect 0 rows.
select code, bloom_level from public.tasks
where certification_id = '22222222-2222-2222-2222-222222222222'
  and is_exam_scope and bloom_level::text > '3_apply';

-- THE CHECK THAT WOULD HAVE CAUGHT THE COLLISION.
-- Every certification id must be unique, and no code may appear twice. Expect 0 rows.
select id, count(*) as n, string_agg(code, ', ') as codes
from public.certifications group by id having count(*) > 1;
select code, count(*) as n from public.certifications group by code having count(*) > 1;
