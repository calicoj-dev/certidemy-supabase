# Certidemy — Lesson Authoring Specification

**Document version:** 1.2
**Status:** Locked. This is the authoring contract.
**Last updated:** June 2026
**Audience:** Anyone writing lesson content (humans or AI)

---

## What this document is

The exact markdown syntax for Certidemy lessons. Every lesson is a single `.md` file that conforms to this spec. The frontend parser reads the file and renders it as either Focus mode (slide-style) or Review mode (article-style) — the source is identical for both.

If a lesson doesn't conform to this spec, the renderer will fail or produce broken output. **The spec is the contract.**

---

## Table of contents

1. [File anatomy](#1-file-anatomy)
2. [Frontmatter](#2-frontmatter)
3. [Section markers](#3-section-markers)
4. [Section types reference](#4-section-types-reference)
5. [Markdown inside sections](#5-markdown-inside-sections)
6. [Inline elements](#6-inline-elements)
7. [Widget schemas](#7-widget-schemas)
8. [Conventions for writing](#8-conventions-for-writing)
9. [Validation checklist](#9-validation-checklist)
10. [Worked example](#10-worked-example)
11. [Versioning this spec](#11-versioning-this-spec)
12. [Frontmatter projection into join tables](#12-frontmatter-projection-into-join-tables-mandatory)

---

## 1. File anatomy

A lesson file has three parts, in order:

```
+-----------------------+
| Frontmatter (YAML)    |  — metadata (id, title, tasks, concepts...)
+-----------------------+
| Body (sections)       |  — the lesson content using ::section markers
+-----------------------+
```

File extension: `.md`
Filename convention: `{module-number}-{lesson-number}-{slug}.md`
Example: `01-01-agile-manifesto.md`

Location convention: `content/{cert-code}/{module-slug}/{lesson-file}.md`
Example: `content/smpc/01-foundations-of-agile/01-01-agile-manifesto.md`

Encoding: UTF-8, LF line endings, no BOM.

---

## 2. Frontmatter

Every lesson opens with a YAML frontmatter block delimited by `---`. All fields are required unless marked optional.

```yaml
---
lesson_id: 01-01-agile-manifesto
module_slug: foundations-of-agile
certification_code: SMPC
title: The Agile Manifesto
subtitle: Four sentences that changed software forever      # optional
language: en                                                 # en | es-419 | pt-BR
lesson_group_id: 01-01-agile-manifesto                      # same as lesson_id for canonical lesson; translations point here
duration_minutes: 8
order_index: 1                                              # position within the module
task_codes: [1.1]                                           # which JTA tasks this lesson teaches
concept_slugs:                                              # concepts touched (for mastery tracking)
  - agile-values
  - agile-principles
prerequisites: []                                           # other lesson_ids that should be completed first
preview: |
  An 8-minute lesson covering the four values and twelve
  principles of the Agile Manifesto, plus how they show up
  in Scrum.                                                 # 1-3 sentence summary shown on the lesson card
authors:
  - Certidemy team                                          # optional, credit line
status: draft                                               # draft | review | published
---
```

### Field rules

| Field | Type | Notes |
|---|---|---|
| `lesson_id` | string | kebab-case, globally unique, immutable once published |
| `module_slug` | string | references a module (`modules.slug` column we'll add) |
| `certification_code` | string | `SMPC`, `GAIPC`, etc. |
| `title` | string | shown as the lesson header |
| `subtitle` | string? | optional, shown smaller below title |
| `language` | enum | `en`, `es-419`, or `pt-BR` |
| `lesson_group_id` | string | translations share this ID; canonical English lesson uses its own `lesson_id` |
| `duration_minutes` | int | honest estimate of total time on Focus mode |
| `order_index` | int | position within the module |
| `task_codes` | string[] | JTA task codes (e.g., `["1.1", "1.2"]`) |
| `concept_slugs` | string[] | concepts taught (must exist in `concepts` table) |
| `prerequisites` | string[] | other `lesson_id`s |
| `preview` | string | 1-3 sentence summary for the catalog UI |
| `authors` | string[]? | optional credit |
| `status` | enum | `draft` until reviewed, `review` during review, `published` when live |

### Validation

The renderer rejects lessons where:
- `task_codes` contains codes that don't exist in the `tasks` table
- `concept_slugs` contains slugs that don't exist in the `concepts` table
- `lesson_id` collides with another lesson at status `published`
- `duration_minutes < 2` or `> 30` (sanity range; flag for review)

---

## 3. Section markers

The body is divided into **sections**, each opened by a marker line starting with `::` and closed by a matching `::` on its own line.

```
::section-name attribute="value"
[content]
::
```

### Marker syntax rules

- Section opens with `::` followed immediately by the section name (no space)
- Attributes appear after the section name as `key="value"` pairs (HTML-attribute style)
- Attribute values are always double-quoted
- The opening marker and closing `::` each live on their own line
- Markers are NOT nested. A section cannot contain another section.
- Sections appear at the top level of the document in any order, BUT the renderer treats order as the rendering order in Review mode and the slide order in Focus mode.

### Example
```
::callout type="exam-watch"
CertiProf often asks about the order of values. Memorize it.
::
```

### Comments
Use HTML-style comments anywhere in the body (not inside frontmatter):
```
<!-- This section needs review -->
```
Comments are stripped before rendering.

---

## 4. Section types reference

There are **8 section types**. Each has a defined purpose, a Focus-mode rendering, a Review-mode rendering, and a set of allowed attributes.

| Section | Required? | Focus mode | Review mode | Bloom level fit |
|---|---|---|---|---|
| `::hook` | Recommended (1) | Full-screen, large hero text | Lead paragraph styled larger | n/a |
| `::concept` | Yes (≥1) | One slide per `::concept` | Section with heading | 1-2 |
| `::diagram` | Optional | Full-screen visual | Inline, captioned | 1-2 |
| `::interactive` | Recommended (≥1) | Takes over screen | Inline, full-width | 2-4 |
| `::deep-dive` | Optional | Collapsed; tap to expand | Expanded by default | 2-3 |
| `::callout` | Optional | Slide between concepts | Styled aside in flow | n/a |
| `::checkpoint` | Yes (=1, last) | Final slide; gates lesson completion | End of article | 1-4 |
| `::summary` | Recommended (1) | After checkpoint | End of article | n/a |

Order convention: hook → concepts/diagrams/interactives/deep-dives/callouts (mixed as the lesson flows) → checkpoint → summary.

### 4.1 `::hook`

The opening line. One screen. One bold idea.

```
::hook
Why a four-sentence manifesto changed software forever.
::
```

**Attributes:** none.

**Body:** 1-2 short sentences. No markdown formatting beyond emphasis. No headings.

**Use sparingly:** Max 1 hook per lesson, at the top.

---

### 4.2 `::concept`

The workhorse. Each `::concept` covers ONE idea. If you find yourself writing about two ideas in one concept block, split it.

```
::concept title="The Four Values"
Individuals and interactions over processes and tools...

(more markdown body)
::
```

**Attributes:**
- `title="..."` (required) — shown as the heading

**Body:** Full markdown allowed. Paragraphs, lists, code blocks, blockquotes, links. Keep it to ~150-300 words per concept (Focus mode is one screen).

**Rendering:**
- Focus mode: title at top, body below, scrollable if needed (rare). One concept = one slide.
- Review mode: H2 heading + body inline in flow.

---

### 4.3 `::diagram`

A visual element. The body is a description (for accessibility) and the `type` attribute names a registered diagram component.

```
::diagram type="empiricism-loop" caption="The three pillars form a continuous loop"
A circular flow showing Transparency feeding Inspection feeding Adaptation feeding back to Transparency.
::
```

**Attributes:**
- `type="..."` (required) — must be a registered diagram type the frontend knows how to render
- `caption="..."` (optional) — shown below the diagram

**Body:** Plain-text description used as the `alt` text for accessibility and as a fallback if the diagram component fails to load.

**Registered diagram types (initial set):**
- `scrum-framework-overview`
- `empiricism-loop`
- `sprint-flow`
- `accountability-relationships`
- `artifact-commitment-pairs`
- `cynefin-quadrants`

New diagrams: register the type in the frontend's `DiagramRegistry`, then use it here.

---

### 4.4 `::interactive`

The widget. Active engagement. Reports score back to the engine.

```
::interactive widget="drag-match" id="match-values-to-behaviors" concept_slugs="agile-values"
{
  "items": [
    { "id": "a", "text": "We've always done it this way" },
    { "id": "b", "text": "Let's pair on this tricky bug" }
  ],
  "targets": [
    { "id": "violates", "text": "Violates a value" },
    { "id": "lives",    "text": "Lives a value" }
  ],
  "correct": {
    "a": "violates",
    "b": "lives"
  },
  "explanation": "Pairing on a hard bug lives 'individuals and interactions'..."
}
::
```

**Attributes:**
- `widget="..."` (required) — slug from `widget_definitions` (one of the 6 primitives)
- `id="..."` (required) — unique within the lesson, used for progress tracking
- `concept_slugs="..."` (optional, comma-separated) — concepts this widget assesses

**Body:** JSON conforming to the widget's `config_schema`. See [Section 7](#7-widget-schemas) for each widget's schema.

**Rendering:** Both modes render full-width. In Focus mode, the widget takes the screen; in Review mode, it's an inline block.

---

### 4.5 `::deep-dive`

Secondary content. The 20% that interested learners want, that the other 80% can skip.

```
::deep-dive title="Historical context: the Snowbird meeting"
In February 2001, seventeen software practitioners met at a ski resort in Utah...
::
```

**Attributes:**
- `title="..."` (required) — collapsed-state label

**Body:** Full markdown.

**Rendering:**
- Focus mode: collapsed accordion; tap title to expand. Doesn't gate progress.
- Review mode: expanded by default with the title as an H3.

---

### 4.6 `::callout`

Visual aside. Several types with distinct styles.

```
::callout type="exam-watch"
CertiProf often asks which value takes precedence. The items on the left are valued MORE.
::
```

**Attributes:**
- `type="..."` (required) — one of: `exam-watch`, `pitfall`, `pro-tip`, `terminology`, `quote`, `note`

**Body:** Short markdown (1-3 sentences ideal). Plain text strongly preferred.

**Type meanings:**
| Type | Use for | Visual style (frontend hint) |
|---|---|---|
| `exam-watch` | "This is commonly tested" | Yellow border, exam icon |
| `pitfall` | "Common misconception" | Red/orange border, warning icon |
| `pro-tip` | "Real-world tip beyond the exam" | Blue border, lightbulb |
| `terminology` | "Term drift / synonyms" | Gray border, abc icon |
| `quote` | Direct quote from Scrum Guide / Manifesto | Italic, blockquote style |
| `note` | Generic neutral aside | Light gray, info icon |

---

### 4.7 `::checkpoint`

The end-of-lesson quiz. Required. Always last (before `::summary`). 3-5 questions.

```
::checkpoint
[
  {
    "id": "q1",
    "question": "Which Agile value emphasizes adapting to circumstances over rigid planning?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Individuals and interactions" },
      { "id": "b", "text": "Working software" },
      { "id": "c", "text": "Customer collaboration" },
      { "id": "d", "text": "Responding to change" }
    ],
    "correct": ["d"],
    "explanation": "'Responding to change over following a plan' is the fourth value...",
    "concept_slugs": ["agile-values"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  { "id": "q2", ... },
  { "id": "q3", ... }
]
::
```

**Attributes:** none.

**Body:** JSON array of question objects.

**Question object schema:**
| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | unique within the checkpoint |
| `question` | string | yes | the question text |
| `type` | enum | yes | `single_choice`, `multi_choice`, `true_false` |
| `options` | array | yes | objects with `id` and `text` |
| `correct` | string[] | yes | array of option ids |
| `explanation` | string | yes | shown after answering |
| `concept_slugs` | string[] | yes | for mastery updates |
| `bloom_level` | enum | yes | matches `bloom_level` DB column |
| `difficulty` | int 1-5 | yes | for adaptive routing |

Checkpoint questions get inserted into `quiz_questions` at lesson-publish time with `is_exam_scope = true` and `task_id` derived from the lesson's `task_codes`.

---

### 4.8 `::summary`

Bullet-point takeaways. Final section.

```
::summary
- The Agile Manifesto has four values and twelve principles.
- Items on the LEFT are valued more than items on the right.
- The manifesto predates Scrum by 6 years.
::
```

**Attributes:** none.

**Body:** A bulleted list, 3-5 items. Each item is a single short sentence.

---

## 5. Markdown inside sections

Inside section bodies (where allowed), standard GitHub-flavored Markdown is supported with these specifics:

### Supported
- Headings `##` and `###` (but NOT `#` — that's reserved for the section title attribute)
- Paragraphs, line breaks
- Emphasis: `**bold**`, `*italic*`, `***bold italic***`
- Lists: bulleted (`- `) and numbered (`1. `)
- Code: inline `` `code` `` and fenced ` ```language ` blocks
- Blockquotes `> `
- Links `[text](url)`
- Tables (GFM syntax)
- Horizontal rules `---`

### NOT supported / discouraged
- HTML tags inside section bodies (use a callout or diagram instead)
- Footnotes
- Definition lists
- Task lists (`- [ ] item`) — render as plain bullets

### Newlines and paragraphs
- Single newline = soft line break
- Blank line between paragraphs = hard break (standard markdown)
- Keep paragraphs short (1-4 sentences) for mobile readability

---

## 6. Inline elements

Two custom inline elements work across all section bodies.

### 6.1 Glossary terms — `[term]{glossary="slug"}`

Wraps a word in a definition tooltip. On hover (desktop) or tap (mobile), shows a popover with the term's definition.

```markdown
The Scrum Master is accountable for [empiricism]{glossary="empirical-process"} on the team.
```

- The `slug` must match a `concepts.slug` row
- The popover content comes from `concepts.description`
- Wrap the term as it appears in your sentence; the popover is the formal definition

### 6.2 Citation references — `[^source-name]`

For quoting/citing source material with full attribution. Renders as a superscript number; full citation appears at the bottom of the lesson.

```markdown
The Scrum Master "is accountable for the Scrum Team's effectiveness"[^scrum-guide-2020].
```

Citations are defined at the end of the markdown body:
```markdown
[^scrum-guide-2020]: Schwaber, K. & Sutherland, J. (2020). *The Scrum Guide*. Section: The Scrum Master.
```

Use sparingly. The lesson is not an academic paper.

---

## 7. Widget schemas

JSON schemas for each of the six widget primitives. Each must be exactly this shape; the renderer will reject malformed widgets at parse time.

### 7.1 `drag-match`

Drag items onto matching targets.

```json
{
  "items": [
    { "id": "a", "text": "Customer collaboration" },
    { "id": "b", "text": "Working software" }
  ],
  "targets": [
    { "id": "value-1", "text": "Stakeholder engagement" },
    { "id": "value-2", "text": "Value delivery" }
  ],
  "correct": {
    "a": "value-1",
    "b": "value-2"
  },
  "explanation": "Customer collaboration is the third Agile value..."
}
```

| Field | Notes |
|---|---|
| `items` | Things being dragged. `id` is internal; `text` is shown. |
| `targets` | Drop zones. Same shape. |
| `correct` | Map of item id → target id |
| `explanation` | Shown after submit |

Variants: set `"allowReuse": true` to allow one target to receive multiple items.

---

### 7.2 `sort-into-order`

Drag items into sequence.

```json
{
  "items": [
    { "id": "a", "text": "Sprint Planning" },
    { "id": "b", "text": "Daily Scrum" },
    { "id": "c", "text": "Sprint Review" },
    { "id": "d", "text": "Sprint Retrospective" }
  ],
  "correct_order": ["a", "b", "c", "d"],
  "explanation": "The Daily Scrum happens many times within a Sprint, after Planning and before Review."
}
```

| Field | Notes |
|---|---|
| `items` | Things being ordered |
| `correct_order` | Array of item ids in correct sequence |
| `explanation` | After-submit text |

---

### 7.3 `toggle-and-observe`

Boolean toggles change a visualization. Each toggle has consequences shown in real time.

```json
{
  "scenario_title": "The Broken Factory",
  "intro": "A team works on a product. Use the toggles below to see what happens when empiricism breaks.",
  "toggles": [
    {
      "id": "transparency",
      "label": "Transparency",
      "off_consequence": "Stakeholders see misleading status reports.",
      "on_consequence": "Stakeholders see real progress."
    },
    {
      "id": "inspection",
      "label": "Inspection",
      "off_consequence": "Problems compound silently.",
      "on_consequence": "Problems surface early.",
      "depends_on": ["transparency"]
    },
    {
      "id": "adaptation",
      "label": "Adaptation",
      "off_consequence": "We have meetings but nothing changes.",
      "on_consequence": "Process improves Sprint over Sprint.",
      "depends_on": ["inspection"]
    }
  ],
  "reflection_prompt": "Once all three are on, what kind of team do you have?",
  "reflection_answer": "A team practicing genuine empiricism, capable of self-correcting."
}
```

| Field | Notes |
|---|---|
| `scenario_title` | Top heading |
| `intro` | Brief explanation of what to do |
| `toggles` | Array of toggles; each has on/off consequences |
| `depends_on` | Optional; if other toggle(s) off, this one is locked |
| `reflection_prompt` | Question shown when all toggles configured |
| `reflection_answer` | Revealed after the learner reflects |

---

### 7.4 `highlight-mistake`

Read text, click the part that's wrong.

```json
{
  "scenario_title": "What's wrong with this Daily Scrum?",
  "text": "Marco (Scrum Master): \"Let's go around the room. Sarah, what did you do yesterday? Good. James, you? OK. Anna? — and we have a status report email going out to leadership at noon, so make sure your tickets are updated by then.\"",
  "highlights": [
    {
      "id": "round-robin",
      "span": "Let's go around the room. Sarah, what did you do yesterday? Good. James, you? OK. Anna?",
      "is_correct": true,
      "feedback": "Round-robin questioning is an anti-pattern. The Daily Scrum is for Developers to plan their work, not to report to the Scrum Master."
    },
    {
      "id": "status-report",
      "span": "we have a status report email going out to leadership at noon",
      "is_correct": true,
      "feedback": "Daily Scrum is not a status reporting event. This frames it as one."
    }
  ],
  "minimum_correct": 1
}
```

| Field | Notes |
|---|---|
| `text` | The scenario text |
| `highlights` | The clickable spans. `is_correct: false` is allowed for distractors. |
| `minimum_correct` | How many they need to identify to pass |

---

### 7.5 `scenario-mcq`

Multi-step branching. Each step shows the consequence of the prior choice.

```json
{
  "scenario_title": "Your Daily Scrum is becoming a status meeting",
  "steps": [
    {
      "id": "step-1",
      "situation": "Three weeks in. The Daily Scrum has become you asking each Developer what they did yesterday. The team is responsive but flat.",
      "question": "What's your first move?",
      "options": [
        { "id": "a", "text": "Stop attending — they'll figure it out.", "next": "step-2a" },
        { "id": "b", "text": "Ask the team: 'What would the Daily Scrum look like if it served YOU?'", "next": "step-2b" },
        { "id": "c", "text": "Tell them the Scrum Guide rules and ask them to fix it.", "next": "step-2c" }
      ]
    },
    {
      "id": "step-2a",
      "situation": "You stop attending. The Daily Scrum continues for a week, then dissolves. Developers go straight to their desks.",
      "question": "What now?",
      "options": [...]
    },
    {
      "id": "step-2b",
      "situation": "The team pauses. Then: 'Honestly? We do it because YOU lead it. We sync in Slack already.'",
      "question": "What now?",
      "options": [...]
    }
  ],
  "best_path": ["step-1:b", "step-2b:..."],
  "explanation": "Asking the team to reflect on the event's value is the coaching stance. Imposing rules is teaching, which has its place but not here."
}
```

| Field | Notes |
|---|---|
| `steps` | Object map of step id → step content |
| `best_path` | The sequence of choices considered optimal |
| `explanation` | After-completion debrief |

Each step's `next` field routes to another step, creating the branching tree. The widget tracks the path taken and shows whether it matched `best_path`.

---

### 7.6 `annotated-diagram`

A diagram with clickable hotspots that reveal explanations.

```json
{
  "diagram_type": "scrum-framework-overview",
  "alt_text": "The Scrum framework showing accountabilities, events, and artifacts in a single diagram.",
  "hotspots": [
    {
      "id": "product-backlog",
      "label": "Product Backlog",
      "x": 12, "y": 30,
      "explanation": "The single source of work for the product. Ordered by the Product Owner. Never complete."
    },
    {
      "id": "daily-scrum",
      "label": "Daily Scrum",
      "x": 50, "y": 55,
      "explanation": "15-minute Developer event for inspecting progress toward the Sprint Goal."
    }
  ],
  "completion_threshold": 0.7
}
```

| Field | Notes |
|---|---|
| `diagram_type` | Matches the registered diagram type |
| `hotspots` | Array of clickable points |
| `x`, `y` | Position as percentage of diagram width/height |
| `completion_threshold` | Fraction of hotspots the learner must click to be "complete" |

---

## 8. Conventions for writing

### Voice and tone
- **Second person** ("you"). The reader is a learner; we speak to them directly.
- **Active voice** by default. "The Scrum Master removes impediments," not "Impediments are removed by..."
- **Specific** over **abstract**. Show a scenario, then name the principle. Not the reverse.
- **Honest** about uncertainty. If the Scrum Guide is silent on something, say so. Don't fabricate authority.

### Length per section
| Section | Target words | Hard max |
|---|---|---|
| `::hook` | 10-25 | 40 |
| `::concept` | 150-300 | 400 |
| `::diagram` body (alt text) | 20-40 | 80 |
| `::deep-dive` | 200-500 | 800 |
| `::callout` | 25-75 | 150 |
| `::summary` items | 8-15 words each | 25 |

### Writing about Scrum-specific terminology
- Always teach the 2020 Guide term as authoritative
- When CertiProf uses a legacy term, flag it with a `::callout type="terminology"`
- Don't make the deprecated term sound shameful — it's just legacy

### Localization-friendly writing
- Avoid idioms ("piece of cake," "ballpark figure") — they don't translate
- Avoid US-centric examples (use "a manufacturing team in Monterrey" not "a Wall Street firm")
- Avoid culturally-specific humor
- Use Celsius if temperature ever comes up; metric units generally
- Currency examples: USD or no specific currency

### Examples ✅ Good
> The Sprint Goal answers ONE question: "Why are we running this Sprint?" If you can't write the goal in one sentence, the team hasn't aligned yet.

✅ Good — concrete, prescriptive, specific.

> Sprint Goals are an important part of effective Scrum practice and should be considered carefully.

❌ Vague. Says nothing.

> Picture this: you're a Scrum Master at a fintech startup, your team's burning the midnight oil, and...

❌ Idiom-heavy, US-startup-specific, hard to translate.

---

## 9. Validation checklist

Before marking a lesson `status: published`, verify:

**Structure:**
- [ ] Frontmatter has all required fields
- [ ] All `task_codes` exist in `tasks` table
- [ ] All `concept_slugs` exist in `concepts` table
- [ ] Has exactly 1 `::checkpoint` section
- [ ] Has at least 1 `::concept` section
- [ ] Has at least 1 `::interactive` section (strongly recommended; not strictly required)
- [ ] `::summary` is present and has 3-5 bullets
- [ ] After authoring, `wire-lessons.mjs` was run for the cert (dry-run reviewed, then applied) — see §12
- [ ] The lesson has **≥1 row in `lesson_concepts`** and **≥1 row in `lesson_tasks`** (the projection landed)
- [ ] `wire-lessons.mjs` reported **zero UNRESOLVED** `concept_slugs` / `task_codes` for this lesson (every frontmatter tag resolves to a real concept/task at current codes)

**Content:**
- [ ] Sections appear in narrative order
- [ ] Checkpoint has 3-5 questions
- [ ] Each checkpoint question has `concept_slugs` and `bloom_level` set
- [ ] No `::concept` exceeds 400 words
- [ ] No fictional citations or fabricated quotes
- [ ] Terminology drift handled with `::callout type="terminology"` where relevant

**Quality:**
- [ ] Read it aloud — does it flow?
- [ ] Mobile-tested: open in Focus mode on a phone, do you make it through?
- [ ] Tutor test: ask "explain X from this lesson" — does it ground correctly?
- [ ] No US-centric idioms or culturally-specific examples

---

## 10. Worked example

A real, complete lesson file demonstrating every section type. Use this as the template for new lessons.

```markdown
---
lesson_id: 01-01-agile-manifesto
module_slug: foundations-of-agile
certification_code: SMPC
title: The Agile Manifesto
subtitle: Four sentences that changed software forever
language: en
lesson_group_id: 01-01-agile-manifesto
duration_minutes: 8
order_index: 1
task_codes: [1.1]
concept_slugs:
  - agile-values
  - agile-principles
prerequisites: []
preview: |
  An 8-minute lesson covering the four values and twelve principles
  of the Agile Manifesto, plus how they show up in Scrum.
authors:
  - Certidemy team
status: published
---

::hook
In 2001, seventeen people met at a ski resort. By the time they left, they had changed how the world builds software.
::

::concept title="What the Manifesto Actually Says"
The Agile Manifesto is four short value statements and twelve supporting principles. That's it. No tools. No frameworks. No certification.

The four values:

1. **Individuals and interactions** over processes and tools
2. **Working software** over comprehensive documentation
3. **Customer collaboration** over contract negotiation
4. **Responding to change** over following a plan

The structure matters. The Manifesto doesn't reject the items on the right — documentation, contracts, and plans all have value. It says: when forced to choose, value the items on the left **more**.
::

::callout type="exam-watch"
CertiProf often asks which Agile value comes first or what each value emphasizes. Memorize the order: Individuals → Software → Collaboration → Change.
::

::interactive widget="drag-match" id="match-values-to-behaviors" concept_slugs="agile-values"
{
  "items": [
    { "id": "a", "text": "Team pairs on a tough bug instead of opening a Jira ticket" },
    { "id": "b", "text": "Devs demo a rough Increment instead of writing a status report" },
    { "id": "c", "text": "PO meets with users every Sprint instead of relying on a signed PRD" },
    { "id": "d", "text": "Sprint Goal changes mid-Sprint because market conditions shifted" }
  ],
  "targets": [
    { "id": "v1", "text": "Individuals and interactions" },
    { "id": "v2", "text": "Working software" },
    { "id": "v3", "text": "Customer collaboration" },
    { "id": "v4", "text": "Responding to change" }
  ],
  "correct": { "a": "v1", "b": "v2", "c": "v3", "d": "v4" },
  "explanation": "Each scenario shows one value being chosen over its right-side counterpart. In real teams, all four often show up at once — Agile is about which to prioritize when they conflict."
}
::

::concept title="Why Four Values, Not Forty?"
Before the Manifesto, software methodology was a thicket of acronyms — RUP, XP, DSDM, FDD, Crystal, Scrum. The seventeen practitioners at Snowbird represented competing methodologies. What surprised them was finding underlying agreement.

The four values are deliberately broad. They aren't a recipe. They're a [test]{glossary="empirical-process"} you apply to any decision: are we prioritizing the things on the left?

When you watch a team work, you'll start to see the Manifesto everywhere. Not as rules, but as a lens.
::

::deep-dive title="Historical context: the Snowbird meeting"
In February 2001, seventeen software practitioners met at a ski resort in Snowbird, Utah. The group included Kent Beck (Extreme Programming), Ken Schwaber and Jeff Sutherland (Scrum), Alistair Cockburn (Crystal), Martin Fowler, and others.

Over a long weekend they drafted what became the Manifesto. The signers committed to publishing it without copyright so any practitioner could reference it freely.

The Manifesto is hosted at agilemanifesto.org and has been signed online by hundreds of thousands of people since its publication.

The original group also drafted the **Twelve Principles** that elaborate on the four values. The principles are less famous but more practically useful — they cover things like sustainable pace, technical excellence, simplicity, and self-organizing teams (later renamed self-managing in the 2020 Scrum Guide).
::

::concept title="From Manifesto to Scrum"
Scrum is one **implementation** of Agile thinking, not the only one. Other Agile methods exist (Kanban, XP, Lean software development) and a healthy Scrum team often borrows practices from them.

For the SMPC exam, you don't need to memorize the relationships between Agile methods. You need to know:
- Scrum is Agile (predates the Manifesto by 6 years, but aligns with it)
- The Manifesto explains *why* Scrum looks the way it does
- A team can be "doing Scrum" without being Agile if they follow the rituals but miss the values
::

::callout type="pitfall"
A team that holds all the Scrum events on schedule but doesn't talk to users, doesn't respond to change, and writes more documentation than software is "doing Scrum, not being Agile." This is the most common Scrum failure mode.
::

::checkpoint
[
  {
    "id": "q1",
    "question": "Which value addresses adapting to circumstances over rigid planning?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Individuals and interactions over processes and tools" },
      { "id": "b", "text": "Working software over comprehensive documentation" },
      { "id": "c", "text": "Customer collaboration over contract negotiation" },
      { "id": "d", "text": "Responding to change over following a plan" }
    ],
    "correct": ["d"],
    "explanation": "Responding to change over following a plan is the fourth value. The Manifesto values plans (the right side) but values adaptation more.",
    "concept_slugs": ["agile-values"],
    "bloom_level": "2_understand",
    "difficulty": 2
  },
  {
    "id": "q2",
    "question": "A team holds all five Scrum events on schedule but never adjusts the Product Backlog based on user feedback. Are they Agile?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Yes — they're following Scrum, which is Agile" },
      { "id": "b", "text": "No — they're doing Scrum mechanics but missing 'responding to change' and 'customer collaboration'" },
      { "id": "c", "text": "Yes — Scrum guarantees Agility once events are running" },
      { "id": "d", "text": "Not enough information to say" }
    ],
    "correct": ["b"],
    "explanation": "Scrum is a framework that can be used in Agile ways or non-Agile ways. Following the rituals isn't enough; the underlying values must show up too.",
    "concept_slugs": ["agile-values", "agile-principles"],
    "bloom_level": "4_analyze",
    "difficulty": 3
  },
  {
    "id": "q3",
    "question": "How does the Manifesto treat the items on the right (processes, documentation, contracts, plans)?",
    "type": "single_choice",
    "options": [
      { "id": "a", "text": "Rejects them as obstacles to Agility" },
      { "id": "b", "text": "Treats them as equally important to the left side" },
      { "id": "c", "text": "Acknowledges their value but prioritizes the left side when choosing" },
      { "id": "d", "text": "Replaces them with the left side" }
    ],
    "correct": ["c"],
    "explanation": "The Manifesto explicitly says 'while there is value in the items on the right, we value the items on the left more.' It's a question of priority, not exclusion.",
    "concept_slugs": ["agile-values"],
    "bloom_level": "2_understand",
    "difficulty": 2
  }
]
::

::summary
- The Agile Manifesto is four values and twelve principles, drafted in 2001.
- The items on the LEFT of each value statement are prioritized over the items on the right — but the right side isn't worthless.
- Scrum predates the Manifesto but aligns with it; Scrum without Agile values is "Scrum theater."
- For SMPC: know the four values and their order.
::
```

---

## 11. Versioning this spec

This document is version 1.2. As lessons get written and we learn what works, this spec will evolve. Versioning rules:

- Minor revisions (added section types, new widget primitives): bump to 1.x
- Breaking changes (renamed fields, deprecated sections): bump to 2.0 and migrate existing lessons

The renderer always supports the **current spec version** plus one previous major (so 2.0 reads 1.x for a transition period).

Lessons that haven't been touched in a year and reference a deprecated spec version are flagged in the admin UI for review.

### Changelog

- **1.0** (May 18, 2026) — Original authoring contract: file anatomy, frontmatter, the 8 section types, inline elements, widget schemas, writing conventions, validation checklist, and the worked example.
- **1.2** (June 2026) — Added §12, the **projection rule**: a lesson's frontmatter `concept_slugs` / `task_codes` MUST be projected into the `lesson_concepts` / `lesson_tasks` join tables via `wire-lessons.mjs` after authoring; a lesson with zero rows in either is incomplete. Added three §9 validation-checklist items. This is coverage-traceability evidence for the ISO/IEC 17024 framework — the review→lesson link and the traceability matrix both depend on it. Additive; no existing section changes and the section-type count stays at 8. *(No standalone v1.1 was ever cut: this amendment was authored and committed as the "v1.2 addendum," so folding it in brings the spec to 1.2 to keep the version consistent with the HANDOFF, REFERENCE, and addendum already in the repo.)*

---

## 12. Frontmatter projection into join tables (MANDATORY)

A lesson declares its relationships **twice**, and both must agree:

1. In its **frontmatter** (`concept_slugs`, `task_codes`) — the human-authored source of truth, inside the lesson file.
2. As **rows in the join tables** `lesson_concepts (lesson_id, concept_id, weight)` and `lesson_tasks (lesson_id, task_id)` — what the running system actually queries.

The join-table rows are a **projection** of the frontmatter. The frontmatter alone is inert: the review→lesson link, coverage reports, and the traceability matrix all read the **join tables**, not the frontmatter text. A lesson whose frontmatter is correct but whose join rows are missing is **incomplete** — its questions cannot resolve "review where this is covered," and the certification has a hole in its traceability matrix.

### The rule

> **After authoring or importing any lesson, its `concept_slugs` and `task_codes` MUST be projected into `lesson_concepts` and `lesson_tasks`.** A lesson with zero rows in either table is not done.

### How to project

Run the standard projection control — `supabase\scripts\wire-lessons.mjs` — for the cert. It is cert-agnostic (`CERT_ID`), idempotent (re-running only fills gaps), dry-run-capable (`DRY_RUN=1`), reads each lesson's frontmatter, resolves slugs→concept ids and codes→task ids **scoped to that cert**, and writes the join rows for every language row sharing a `lesson_group_id`. It also **reports any slug/code that does not resolve** to a real concept/task — surfacing authoring errors instead of dropping them silently.

```powershell
cd C:\Users\Juan\Documents\certidemy\supabase
$env:CERT_ID="<cert-uuid>"; $env:DRY_RUN="1"; node scripts\wire-lessons.mjs   # inspect
$env:DRY_RUN="0"; node scripts\wire-lessons.mjs                               # apply
```

### Why this is mandatory (the history)

Both finished certs shipped with this step skipped:

- **SM-AI-I**: its 6 AI lessons (originally Module 6, re-homed in migration 052) were inserted without projection — their questions had no review→lesson link until migration 055 wired them by hand.
- **SPO-AI-I**: **all 132** lesson rows were unprojected — every task read `lessons_teaching = 0` until `wire-lessons.mjs` projected all 396 concept links and 132 task links.

The projection step is the single thing that was missed, twice. This rule exists so it is never missed again — most importantly for every cert authored after this one.

### Frontmatter must use CURRENT task codes

`wire-lessons.mjs` resolves `task_codes` against the live `tasks.code` values for the cert. If tasks are renumbered (e.g. a domain remap), the lesson frontmatter `task_codes` become **stale** and will appear in the script's UNRESOLVED report. Stale frontmatter does not break a running system whose join rows were fixed by hand, but it makes the authoring source-of-truth disagree with the DB — a real inconsistency to clean up. When you renumber tasks, rewrite the affected lessons' frontmatter `task_codes` to the new codes, then re-run the projection.

---

**End of authoring spec.** Reference this document when writing any new lesson. If something isn't covered, ask before inventing.
