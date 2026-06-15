-- 019_seed_module6_lesson01.sql
-- =============================================================================
-- Seed the Module 6 row (learn-UI module for the AI track) and the first D6
-- lesson, 06-01, in English. English-only first as a render proof; es-419 /
-- pt-BR for 06-01 and lessons 06-02..06-06 follow once this renders.
--
-- Notes from schema recon:
--   * modules and domains are SEPARATE tables. Modules drive the learn UI;
--     lessons attach via module_id (FK), not via the frontmatter module_slug.
--   * lessons.content_md holds the ENTIRE .md file (frontmatter + body); the
--     table has no status/task_codes/module_slug columns — those live in YAML.
--   * lesson_group_id is shared across the 3 language rows; slug is identical
--     per language (language column differentiates), mirroring 05-05.
--
-- All content dollar-quoted ($jta$) — no apostrophe/quote escaping needed.
-- Idempotent: module guarded by not-exists on (cert, slug); lesson guarded by
-- not-exists on (slug, language). module_id resolved by subquery so no invented
-- UUID. Cert SM-I = 11111111-1111-1111-1111-111111111111.
-- =============================================================================

-- ---- Module 6 ----------------------------------------------------------------
insert into public.modules (certification_id, title, description, slug, order_index, estimated_minutes)
select
  '11111111-1111-1111-1111-111111111111',
  $jta$Scrum with AI-Augmented Teams$jta$,
  $jta$How the Scrum Master keeps Scrum's empiricism and human accountability intact when teams incorporate AI agents into their work.$jta$,
  'ai-augmented-teams',
  6,
  50
where not exists (
  select 1 from public.modules
  where certification_id = '11111111-1111-1111-1111-111111111111'
    and slug = 'ai-augmented-teams'
);

-- ---- Lesson 06-01 (English) --------------------------------------------------
insert into public.lessons
  (module_id, language, slug, lesson_group_id, title, order_index, estimated_minutes, content_md)
select
  m.id, 'en', '06-01-ai-agents-as-tools',
  'c0000000-0000-0000-0000-00000000a601'::uuid,
  $jta$AI Agents on a Scrum Team: Tools, Not Members$jta$,
  1, 8,
  $lesson$---
lesson_id: 06-01-ai-agents-as-tools
module_slug: ai-augmented-teams
certification_code: SMPC
title: "AI Agents on a Scrum Team: Tools, Not Members"
subtitle: Why accountabilities stay human even when AI does the work
language: en
lesson_group_id: c0000000-0000-0000-0000-00000000a601
duration_minutes: 8
order_index: 1
task_codes: [6.1]
concept_slugs:
  - ai-as-tool-not-team-member
  - human-held-accountabilities
prerequisites: []
preview: |
  An 8-minute lesson on how AI agents fit a Scrum Team — as tools the
  team uses, never as members — and which accountabilities must remain
  human no matter how much work AI does.
authors:
  - Certidemy team
status: published
---

::hook
An AI agent writes code all night and opens twelve pull requests by morning. Useful? Absolutely. A Developer on your Scrum Team? No.
::

::concept title="The Scrum Team Is Still People"
The 2020 Scrum Guide defines the Scrum Team as one Product Owner, one Scrum Master, and Developers — a single team of people accountable for creating a valuable Increment each Sprint. Nothing in that definition changes because a team uses AI.

An AI agent can draft code, summarize a Product Backlog, or generate test cases. That makes it a powerful **tool**. It does not make it a member of the Scrum Team. There is no "AI accountability," no AI seat at Sprint Planning, and no AI commitment to the Sprint Goal.

Think of AI the way you think of an IDE, a CI pipeline, or a build server: essential to how modern Developers work, directed by the team, but never a teammate. The people are the team. The tools serve them.
::

::callout type="pitfall"
"The AI is basically another team member now." This sounds harmless, but it quietly hands a tool something only a person can hold: accountability. Tools have capabilities. People have accountabilities. Keep the two separate.
::

::concept title="Accountabilities Are Held by People"
[Accountability]{glossary="human-held-accountabilities"} means being answerable for an outcome. In Scrum, three accountabilities are always held by people:

- The **Product Owner** is accountable for maximizing the value of the product and for the Product Backlog.
- The **Scrum Master** is accountable for the team's effectiveness and for Scrum being understood and enacted.
- The **Developers** are accountable for a usable Increment each Sprint, for the Sprint Backlog, and for the Definition of Done.

An AI agent can *help* with any of these — suggest a Backlog order, draft the Increment, flag a quality gap. But "help" is not "hold." When the Increment ships broken, you cannot hold a model answerable; you hold the Developers. Accountability has to land on a person, because only a person can answer for a decision and change what they do next.
::

::interactive widget="drag-match" id="tool-capability-vs-human-accountability" concept_slugs="ai-as-tool-not-team-member,human-held-accountabilities"
{
  "items": [
    { "id": "a", "text": "Generating a first draft of the Increment's code" },
    { "id": "b", "text": "Deciding the Increment meets the Definition of Done" },
    { "id": "c", "text": "Summarizing fifty Product Backlog items into themes" },
    { "id": "d", "text": "Ordering the Product Backlog to maximize value" },
    { "id": "e", "text": "Proposing test cases for a new feature" }
  ],
  "targets": [
    { "id": "tool", "text": "A tool can do this (AI)" },
    { "id": "human", "text": "A person must hold this (accountability)" }
  ],
  "correct": { "a": "tool", "b": "human", "c": "tool", "d": "human", "e": "tool" },
  "allowReuse": true,
  "explanation": "Drafting, summarizing, and proposing are tool capabilities — AI can do them, subject to human review. Deciding Done and ordering the Backlog for value are accountabilities: the Developers and the Product Owner stay answerable for those, even when AI informs the work."
}
::

::concept title="Why the Line Matters in Practice"
This is not a philosophical point — it changes what you do as a Scrum Master.

When a stakeholder says "the AI approved it, so it's done," you have a problem: a tool's output was treated as a decision. The Definition of Done is met when the **Developers** judge it met, not when a model emits a green checkmark. When someone asks "whose fault is the outage," the answer is never "the AI's" — the team owns its Increment, including the parts AI produced.

Holding this line keeps Scrum's empiricism intact. Decisions stay with people who can inspect, learn, and adapt. The moment accountability drifts to a tool, no one is answerable, and the team loses its ability to self-correct.
::

::callout type="pro-tip"
A simple test when AI enters a conversation about the team: ask "who is answerable if this is wrong?" If the honest answer is a person, you are using AI as a tool. If the answer is "the AI," someone has quietly handed away an accountability — pull it back.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "A team uses an AI agent to generate most of its code. In Scrum terms, what is the AI agent?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "A new Developer on the Scrum Team" },
      { "id": "b", "text": "A tool the Developers use; the Developers remain the team" },
      { "id": "c", "text": "A fourth Scrum accountability" },
      { "id": "d", "text": "A replacement for the Scrum Master" }
    ],
    "correct": ["b"],
    "explanation": "AI is a tool the team uses. The Scrum Team is still defined as people; using a tool — however capable — does not add a member or an accountability.",
    "concept_slugs": ["ai-as-tool-not-team-member"],
    "bloom_level": "2_understand",
    "difficulty": 1
  },
  {
    "id": "q2",
    "question": "An AI agent reports that an Increment passes all automated checks. Who is accountable for deciding the Increment actually meets the Definition of Done?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "The AI agent, since it ran the checks" },
      { "id": "b", "text": "The Scrum Master" },
      { "id": "c", "text": "The Developers" },
      { "id": "d", "text": "The stakeholder who requested the feature" }
    ],
    "correct": ["c"],
    "explanation": "The Developers are accountable for the Definition of Done. AI can inform the judgment, but the accountability to decide Done is held by people.",
    "concept_slugs": ["human-held-accountabilities"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q3",
    "question": "Why does Scrum require accountabilities to be held by people rather than tools?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Because tools are not fast enough to keep up with a Sprint" },
      { "id": "b", "text": "Because only a person can be answerable for a decision and adapt their future behavior" },
      { "id": "c", "text": "Because the Scrum Guide forbids using any tools" },
      { "id": "d", "text": "Because stakeholders prefer talking to people" }
    ],
    "correct": ["b"],
    "explanation": "Accountability means answerability. Only a person can answer for a decision, learn from the outcome, and change what they do — which is what keeps the team's empiricism working.",
    "concept_slugs": ["human-held-accountabilities", "ai-as-tool-not-team-member"],
    "bloom_level": "2_understand",
    "difficulty": 3
  },
  {
    "id": "q4",
    "question": "A stakeholder says, 'The AI signed off on the release, so the team is not responsible for the bug that shipped.' What is the most accurate Scrum response?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Correct — the AI made the call, so accountability sits with the tool" },
      { "id": "b", "text": "The Developers are accountable for the Increment, including work AI produced; a tool cannot hold that accountability" },
      { "id": "c", "text": "The Scrum Master is personally accountable for the bug" },
      { "id": "d", "text": "Accountability is shared equally between the team and the AI" }
    ],
    "correct": ["b"],
    "explanation": "A tool's output is never a substitute for the Developers' accountability for the Increment. AI can assist, but the team owns the result — including the parts AI generated.",
    "concept_slugs": ["human-held-accountabilities"],
    "bloom_level": "3_apply",
    "difficulty": 3
  }
]
::

::summary
- The Scrum Team is still defined as people: one Product Owner, one Scrum Master, and Developers.
- AI agents are tools the team uses — like an IDE or CI pipeline — never members and never a fourth accountability.
- The three accountabilities are always held by people; AI can help but cannot hold them.
- Accountability must be human because only a person can answer for a decision and adapt — which keeps Scrum's empiricism alive.
- When AI enters the picture, ask "who is answerable if this is wrong?" The answer must be a person.
::
$lesson$
from (
  select id from public.modules
  where certification_id = '11111111-1111-1111-1111-111111111111'
    and slug = 'ai-augmented-teams'
) m
where not exists (
  select 1 from public.lessons l
  where l.slug = '06-01-ai-agents-as-tools' and l.language = 'en'
);

-- ---- VERIFICATION (run separately) -------------------------------------------
-- Module present:
-- select title, slug, order_index from public.modules
--  where certification_id = '11111111-1111-1111-1111-111111111111' order by order_index;
-- Lesson present and attached to Module 6:
-- select l.language, l.slug, l.title, l.order_index, m.slug as module
--   from public.lessons l join public.modules m on m.id = l.module_id
--  where l.slug = '06-01-ai-agents-as-tools';
