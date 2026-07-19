# STYLE-GUIDE-AISM-I.md — the AISM-I lesson authoring contract

**Status:** Proven at the module-1 gate (D1, 8 lessons, Grok-reviewed). Binding on every
AISM-I lesson.
**Supplements, does not replace:** `LESSON_AUTHORING_SPEC.md` (v1.2). Where the spec defines
*syntax*, this guide defines the *AISM-I-specific quality contract* and resolves the spec
against the current cognitive model.
**Derived from:** the module-1 Grok review + accept/decline reasoning (logged at the end).

---

## 0. The one rule that overrides the old spec's example

**Every checkpoint question's `bloom_level` MUST equal its lesson's task's declared Bloom.**

Checkpoint questions are inserted into `quiz_questions` with `task_id` from the lesson's
`task_codes`, and `trg_item_bloom_matches_task` (migration 098) **rejects any mismatch at
load.** The authoring spec's worked example (a `4_analyze` question on a `2_understand` task)
**predates the cognitive model and must not be copied.**

Practical form — **one lesson teaches one task**, so all of that lesson's checkpoint questions
carry the task's single Bloom:

| Domain | Task Bloom(s) | Every checkpoint question in those lessons is… |
|---|---|---|
| D1 (all 8 tasks) | `2_understand` | `2_understand` |
| D2 | mostly `2_understand`, apply on 2.4/2.5/2.9 | match each lesson's task |
| D3 | mix; **3.6 is `4_analyze`** | 3.6's checkpoint is `4_analyze`; others match |
| D4 | understand / apply / analyze | match each lesson's task exactly |
| D5 | understand / apply | match each lesson's task |

You do **not** get to add "one harder question" for spice if it exceeds the task's Bloom. If a
concept genuinely needs a higher-order question, it belongs to a task declared at that level —
which is a JTA matter, not a lesson matter, and the JTA is locked.

Difficulty (1–5) is the free dial *within* the Bloom level: vary difficulty for a good
checkpoint, never Bloom.

---

## 1. Lesson shape (the proven module-1 skeleton)

```
::hook            (1; 10–25 words; one bold, memorable idea)
::concept         (2–3; one idea each; 150–260 words target, 400 hard max)
::interactive     (1; a widget that fits the cognitive level — see §3)
::callout         (0–1; pitfall / note / pro-tip / terminology)
::checkpoint      (1; exactly 3 questions for a standard lesson, all at task Bloom)
::summary         (1; 3–4 bullets, 8–15 words each)
```

- **Concept density: 2–3 per lesson.** One idea per `::concept`. If a lesson's task has 4–5
  concept_slugs, group closely-related slugs into a concept block; you do **not** need one
  block per slug.
- **Checkpoint: 3 questions** for a standard lesson (spec allows 3–5; we standardize on 3 for
  the 8-minute format, more only when a task genuinely warrants it).
- Every checkpoint question carries `concept_slugs` + `bloom_level` + `difficulty`.

---

## 2. Concreteness over abstraction (Grok's strongest craft note — adopted)

**Every core idea gets a short, specific, realistic example.** Abstract-but-correct is the most
common weakness; it reads as textbook and does not stick.

- ❌ "A service removes some costs and risks and imposes others."
- ✅ "Using a managed cloud database removes the cost of running servers and the risk of a
  botched security patch — but imposes a monthly fee and a dependency on that provider."

Rule of thumb: if a paragraph explains a concept with no concrete instance the reader can
picture, add one. Avoid purely philosophical passages — name the situation.

---

## 3. Widgets

**Use only widgets that need no registered diagram type** (until AISM diagram types are
registered): `drag-match`, `sort-into-order`, `toggle-and-observe`, `highlight-mistake`,
`scenario-mcq`. Do **not** use `::diagram` or `annotated-diagram` yet — the registered set is
Scrum-specific.

**Match widget to cognitive level:**
| Task Bloom | Good widgets | Why |
|---|---|---|
| `2_understand` | drag-match, toggle-and-observe, highlight-mistake | categorize, observe cause/effect, spot |
| `3_apply` | scenario-mcq, drag-match (decide-which-action) | choose the right action in a situation |
| `4_analyze` | highlight-mistake, scenario-mcq | find the cause, trace what's wrong |

**Vary widgets across a module** — no single type more than ~3× in 8 lessons. (Module 1 shipped
drag-match ×3, toggle ×3, highlight ×1, scenario ×1 — acceptable; push for a bit more spread in
later modules.)

**Keep widget items challenging but not level-crossing.** Grok asked for less-obvious items —
correct, *but*: on a `2_understand` lesson, an item so ambiguous that answering it requires
diagnosing a cause has silently become Analyze. Make items take a moment's thought, not a
level's worth. Save genuine ambiguity for `3_apply`/`4_analyze` lessons where it belongs.

---

## 4. The AI-thread architecture (the load-bearing decision — do not drift)

**AI is concentrated by the locked JTA, not sprinkled everywhere.** The JTA places the AI lens
in exactly one task per foundational domain — **1.8, 2.5, 3.11** — plus the AI-native core
(D4, D5). This was the central, five-round JTA decision: an AI *lens on top of* solid
foundations, never an AI *transplant of* them.

**Consequences for lessons:**

1. **Non-AI foundational lessons stay non-AI.** Lessons for tasks 1.1–1.7 (and the equivalent
   in D2/D3) teach the field-standard foundation straight. Injecting AI concepts a task does
   not declare is **coverage drift** — the checkpoint would test concepts the task doesn't own,
   and the traceability matrix breaks. "Make every lesson feel more AI" is the exact pressure
   the JTA refused; refuse it here too.
2. **The AI-thread lesson leans in hard, and re-uses the domain's own concepts as the thing AI
   bends.** `01-08` is the template: it explicitly revisits utility/warranty and co-creation
   (taught earlier in D1) and shows how a probabilistic model changes them. That is what makes
   the thread feel woven, not bolted — it builds on what the module already taught, rather than
   introducing a foreign AI topic.
3. **Modern examples everywhere are the honest way to feel AI-native.** Use realistic,
   contemporary digital-service examples (payments APIs, streaming, SaaS, support platforms,
   AI-adjacent tooling) throughout — *including* the non-AI lessons. This makes the whole cert
   read as current and sets up the AI material naturally, **without** teaching AI concepts a
   task doesn't declare. This is the accepted, legitimate core of Grok's "feels bolted on" note.

The test: a non-AI lesson should feel *modern*, not *AI-heavy*. The AI-thread lesson should feel
*woven* (building on the module), not *isolated*.

---

## 5. Voice, localization, integrity (from spec §8 — restated as binding)

- **Second person, active voice.** Speak to the learner. "You measure the outcome," not
  "outcomes are measured."
- **No idioms, no US-centric examples, no culturally-specific humor.** Neutral names; metric
  units; no specific currency. Examples should translate cleanly to es-419 / pt-BR.
- **No fabricated citations or quotes.** Foundations are general field knowledge — state them
  plainly; do not invent authorities or attributions.
- **Marketing-identity line (sacred gate #6).** Field-standard framework names may appear in a
  lesson body only as pedagogical cross-reference; never as an identity/equivalence claim.
  Standard nouns (service, SLA, incident, change, value co-creation) are the field's shared
  vocabulary — use them plainly; do not rename them to "look original."

---

## 6. Checkpoint calibration

- 3 questions, all at the task's Bloom.
- Difficulty spread: for foundations, 2 / 2 / 3 is typical; the range 1–4 is available. Vary
  difficulty by making content subtler or distractors closer — **never** by raising Bloom.
- Distractors must be wrong on the merits, plausible, and roughly length-matched to the key
  (the secure-bank cue-neutrality discipline applies in spirit to checkpoints too).
- Every explanation teaches — it says *why* the key is right and, where useful, why a tempting
  distractor is wrong.

---

## 7. Definition of done (per lesson)

- [ ] Frontmatter complete; `task_codes` + `concept_slugs` match the locked JTA exactly.
- [ ] Exactly 1 `::checkpoint`, 1 `::summary`, ≥1 `::concept`, ≥1 `::interactive`.
- [ ] **All checkpoint `bloom_level`s equal the task's Bloom.** (Load-blocker if not.)
- [ ] Every `::concept` ≤ 400 words; every core idea has a concrete example.
- [ ] Widget JSON and checkpoint JSON parse (validate before hand-off).
- [ ] Modern/realistic examples; no idioms; no fabricated citations; no framework identity claims.
- [ ] (At load, main session) `wire-lessons.mjs` projects frontmatter → `lesson_concepts` /
      `lesson_tasks` with zero UNRESOLVED (spec §12).

---

## Appendix — module-1 Grok gate: accept/decline log

**Accepted (craft):**
- 01-06 cost/risk concept was abstract → added a concrete cloud / vendor-lock-in example.
- 01-06 widget items too obvious → made one item take real thought (without crossing into Analyze).
- 01-06 summary wording → adopted the clearer "removes some… imposing others… benefits outweigh" phrasing.
- 01-08 "service that drifts" → added the fraud-model-degrades-as-behavior-shifts example.
- 01-08 "co-creating under uncertainty" was philosophical → made concrete (named provider actions
  for expectation-setting and probabilistic-output assurance).
- 01-08 pitfall → sharpened to the AI-specific "we didn't change the model, so it's stable" trap.
- General: "use more modern/digital examples" → adopted as a standing rule (§4.3).

**Declined (with reason):**
- "AI feels bolted on; make most lessons lean into AI." Declined as stated. The JTA concentrates
  the AI thread by design (1.8 / 2.5 / 3.11 + D4/D5); non-AI foundational lessons teach the
  foundation straight, or they drift off the tasks they're bound to. The *legitimate* core of the
  note — feel more current — is taken via modern examples (§4.3), which does the job without
  coverage drift.
- Re-litigating the JTA ("would I lock v0.5"): moot — JTA is locked at v1.1 with 3.6 included.

**Provenance note:** Grok reviews the lesson *text*; it cannot see the trigger, the coverage
view, or the traceability matrix. Its craft notes are valuable; its "more AI" instinct must be
filtered through the locked JTA's deliberate AI-concentration, exactly as in JTA review.
