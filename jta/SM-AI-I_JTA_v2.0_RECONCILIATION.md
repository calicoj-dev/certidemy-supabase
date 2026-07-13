# SM-AI-I — JTA v2.0 Cognitive Reconciliation Record

**Certification:** SM-AI-I — Scrum Master I (AI)
**JTA version:** 2.0 (supersedes SMI_JTA_v2.1)
**Date:** 12 July 2026
**Governing document:** `COGNITIVE-MODEL.md` v2.0
**Migration:** `091_sm_ai_i_jta_v2_cognitive_fix.sql`

---

## 1. Why this revision exists

Certidemy adopted a cognitive model with one binding rule:

> **An item's cognitive level equals the declared cognitive level of the task it
> assesses.** Testing above the declared level is construct-irrelevant variance
> (measuring competence the JTA never claimed). Testing below it is construct
> under-representation (failing to measure competence the JTA did claim). Both are
> validity failures.

That rule makes `tasks.bloom_level` **load-bearing** in a way it never was. Previously
the item generator derived an item's Bloom level from a difficulty curve and never read
the task at all, so the declared levels were decorative — nothing depended on them being
right, and so nobody checked whether they were.

When we checked, they were not.

**Two independent defects were found, and they are different in kind:**

- **A generator defect** — items were not written to their tasks' levels. Measured:
  **35.5%** of SM-AI-I's secure items tested *above* their task's declared level.
- **A JTA defect** — the declared levels themselves were wrong. This is the more
  serious of the two, because it means the ruler was bent. Fixing the generator against
  wrong declarations would have produced items that faithfully tested the wrong thing.

This record covers the **JTA defect**. It is the correction of the foundation.

---

## 2. The systematic finding: SM-AI-I over-declared Analyze

**Eleven of 51 tasks were declared `4_analyze`. Only five genuinely are.**

The diagnostic is the **skills line**, not the statement verb. The skills line states what
the candidate must actually *do*, and it is the closest thing in the JTA to a
specification of the assessment. Read across the eleven, a hard pattern appears:

| Skills line says… | Cognitive level | Count |
|---|---|---|
| *categorize*, *classify*, *recognize*, *coach* | **Apply** — using a taught framework on a described case | 6 |
| *diagnose*, *trace*, *prescribe* | **Analyze** — finding a cause nobody handed you | 5 |

**Classifying a situation against a framework you were taught is Apply.** The framework
is given; the candidate maps the case onto it. *"Categorize a real problem accurately"*
(task 1.4) hands the candidate the complex/complicated distinction and asks them to
apply it.

**Analyze means decomposing a situation to find a cause that was not supplied.**
*"Diagnose the boundary violation and prescribe the correction"* (task 2.7) requires the
candidate to work out what is wrong from symptoms, then decide what follows.

The six tasks in the first row were being tested one level too hard. Every item written
against them was drafted to a cognitive standard the competence does not require —
**construct-irrelevant variance sourced directly from the foundational document.**
Candidates would have been failed on reasoning the job-task analysis never asked them to
perform.

---

## 3. Change log

### 3.1 Over-declared Analyze → Apply (six tasks)

| Task | Statement | Was | Now | Evidence in its own skills line |
|---|---|---|---|---|
| **1.4** | Distinguish complex problems suited to Scrum from problems suited to predictive approaches | `4_analyze` | **`3_apply`** | *"**Categorize** a real problem accurately"* |
| **2.11** | Distinguish work a team may delegate to AI from the accountabilities it must retain | `4_analyze` | **`3_apply`** | *"**Classify** activities as safely delegable or necessarily retained"* |
| **3.9** | *(rewritten — see 3.3)* | `4_analyze` | **`3_apply`** | *"**Write** a Sprint Goal"* — Create, not Analyze |
| **4.7** | Distinguish artifact transparency from artifact perfection | `4_analyze` | **`3_apply`** | *"**Coach** a team out of 'we can't show stakeholders until it's polished'"* |
| **5.2** | Distinguish impediments from problems the team should resolve themselves | `4_analyze` | **`3_apply`** | *"Resist the urge to fix everything"* — a boundary decision |
| **5.10** | Identify the new impediments that arise in AI-augmented teams | `4_analyze` | **`3_apply`** | *"**Recognize** these impediment patterns in a team's behavior"* |

### 3.2 The five tasks that genuinely reach Analyze (unchanged)

Each one **traces** or **diagnoses** — it requires reasoning from symptoms to an
unsupplied cause.

| Task | Statement | Skills |
|---|---|---|
| **1.6** | Recognize when transparency is compromised and **trace consequences** | *Identify hidden information or inflated status reports* |
| **1.7** | **Analyze** how AI-accelerated output can threaten empiricism | ***Trace** how output velocity without inspection erodes…* |
| **2.7** | Identify accountability boundary violations | ***Diagnose** the boundary violation and **prescribe** the correction* |
| **3.10** | Recognize event anti-patterns | ***Diagnose** the anti-pattern and **prescribe** the correction* |
| **5.5** | Recognize psychological safety and how SM behavior affects it | ***Diagnose** safety issues; nudge behavior to rebuild* |

*Note: task 1.7 was never flagged by our automated verb-scan, because its statement verb
("Analyze") already agreed with its declared level. It was correct all along. The scan
finds verb/level disagreement; it cannot find a task that is wrong in both places at
once — which is a limitation worth recording.*

### 3.3 Structural corrections (three tasks)

**Task 3.3 — a recall task carrying a borrowed skills line.**
Statement: *"Identify the three topics of Sprint Planning (Why, What, How)"* — pure
recall of a canonical list. Declared `2_understand`. But its skills line read *"Diagnose
Sprint Plannings that skip Why"* — a **different competence**, and one that properly
belongs to task 3.10 (event anti-patterns, `4_analyze`). The borrowed skills line was
inflating this task's apparent level.

→ Re-declared **`1_remember`**. Statement: *"Recall the three topics of Sprint Planning
(Why, What, How)."* Skills corrected to: *"Name the three topics and what each answers."*

**Task 3.9 — a Create-level competence being assessed by multiple choice.**
Declared `4_analyze`, but its skills line read ***"Write** a Sprint Goal that's coherent
and outcome-focused."* **Writing is Bloom 6 (Create). Multiple choice cannot assess it at
all.**

→ Statement rewritten to the competence an MCQ *can* measure: *"**Select** a Sprint Goal
that is coherent and outcome-focused, and distinguish it from the Product Backlog items
selected for the Sprint."* Declared **`3_apply`**.

**Task 4.4 — a compound task: a definition welded to its application.**
Statement: *"**Define** the Increment and the Definition of Done"* (recall). Skills:
*"**Apply** DoD to determine if work is 'done'"* (Apply). **Two competences, two
cognitive levels, one task.** Under the cognitive model, that is two tasks.

→ **Split.**
- **4.4** — *"Recall the Increment and the Definition of Done."* **`1_remember`**
- **4.13 (new)** — *"Apply the Definition of Done to determine whether work is
  releasable."* **`3_apply`.* Inherits 4.4's concepts; no new content required.

### 3.4 Statement-verb corrections (level was already right)

Four tasks had a **correct declared level** and a **statement verb that contradicted
it**. Only the statement changed.

| Task | Was | Now | Why |
|---|---|---|---|
| **1.2** | *"**Explain** the three pillars…"* (`3_apply`) | *"**Apply** the three pillars… to diagnose which pillar is broken"* | Skills said *"Diagnose which pillar is broken in a described scenario"* |
| **3.6** | *"**Describe** the Sprint Retrospective's focus…"* (`3_apply`) | *"**Facilitate** the Sprint Retrospective…"* | Skills said *"Run formats (Liked/Learned/Lacked, 4Ls, sailboat)"* |
| **5.9** | *"**Apply** scaling principles…"* (`2_understand`) | *"**Recognize** scaling anti-patterns…"* | Skills said *"Recognize anti-patterns"*. This is a Level I credential: it does not certify the ability to scale, only to recognize when scaling has gone wrong. |
| **5.7** | *"**Navigate** terminology drift…"* (`2_understand`) | *"**Translate** between legacy terminology and the 2020 Scrum Guide"* | Skills said *"Translate between the two"* |

### 3.5 Removed from exam scope (prior fix, recorded here for completeness)

**Task 5.11** — *"Diagnose an AI-augmentation anti-pattern and coach the team back toward
empiricism and self-management"* — declared `5_evaluate` **and** `is_exam_scope = true`,
in direct contradiction of the JTA's own stated ceiling (*"Bloom 5–6 reserved for AI
simulations; 0% in MCQs"*). It is already flagged `is_simulation_candidate`.

→ `is_exam_scope = false`. It remains a Phase-2 simulation candidate. **This competence
is not currently certified**, and that is now stated rather than silently assumed.

---

## 4. The recomputed cognitive profile

**This is not a target. It is a computed property** of the reconciled task declarations
weighted by domain — a sum, not a choice. `exam_blueprint` is set from it, and an
executable invariant re-derives it from the live database on every verification run, so
the published claim and the item bank cannot silently diverge.

| Bloom level | Tasks | % of an 80-item form | Items |
|---|---|---|---|
| **1 Remember** | 8 | **15.87%** | ~13 |
| **2 Understand** | 16 | **30.95%** | ~25 |
| **3 Apply** | 22 | **43.04%** | ~34 |
| **4 Analyze** | 5 | **10.14%** | ~8 |
| | **51** | **100.00%** | **80** |

### What changed, and what it means

| | Old JTA "target" table | Old task rows (as declared) | **Reconciled v2.0** |
|---|---|---|---|
| Remember | 15% | 12.3% | **15.9%** |
| Understand | 35% | 33.8% | **31.0%** |
| Apply | 35% | 31.6% | **43.0%** |
| Analyze | 15% | 22.3% | **10.1%** |

**Three observations worth an outside reviewer's attention:**

1. **Analyze falls from 22.3% to 10.1%.** This is the correction of the systematic
   over-declaration. The prior figure meant roughly 18 of 80 items were being written as
   diagnostic reasoning problems against tasks that only require classification.

2. **Apply rises to 43%** and becomes the centre of gravity — which is what a Scrum
   Master credential *should* be. The job is overwhelmingly *applying* a known framework
   to live situations: run the event, apply the DoD, categorize the impediment, coach the
   behavior. It is not, mostly, a diagnostic role.

3. **The reconciled profile lands close to the old "target" table on Remember and
   Understand, and far from it on Apply/Analyze.** The old table was not absurd — it was
   *unvalidated*. It was inherited from `SMPC_JTA_v2.md`, written when Certidemy was an
   exam-prep product for CertiProf's SMPC, where it was a marketing claim (*"we place 50%
   at Apply/Analyze so learners over-prepare"*). Carried into an own-credential JTA it
   became a second, competing declaration of cognitive level, reconciled with nothing.
   **It has been deleted.** A JTA states its tasks and *reports* the resulting
   distribution; it does not assert one over them.

---

## 5. Integrity checks (all passed)

- Every concept remains linked to at least one task — **0 orphaned concepts**.
- No exam-scope task exceeds the MCQ ceiling of `4_analyze` — **0 violations**.
- No new concepts, no new lessons, no coverage gap. Task 4.13 inherits 4.4's concepts;
  the material is unchanged, only the competence declaration.
- Domain weights unchanged.

---

## 6. What this forces downstream

1. **SM-AI-I's secure item bank must be regenerated.** Its items were written without
   the task in scope and stamped with a Bloom derived from a difficulty curve. They are
   now additionally misaligned against six tasks whose declared level has changed. The
   existing bank is marked `bank_revision = 'v1-preJTA'`; the regenerated bank will be
   `v2-jta`.
2. **The practice pool** follows.
3. **`exam_blueprint`** is set from the profile in §4.
4. **The scheme document (`SCHEME-SM-AI-I.md`) §6** must publish this profile.
5. **The readiness calculator** scores candidates against `bloom_level` and `difficulty`
   — both of which have been noise until now. It must be re-derived once the bank is
   truthful.

---

## 7. Open question for review

**Is 10.1% Analyze too low for a Scrum Master credential?**

The reconciled figure follows mechanically from the task declarations, and each of the
five surviving Analyze tasks is defensible on its skills line. But an outside reviewer
should ask the reverse question the cognitive model demands: **if the profile looks wrong,
the tasks may be wrong** — and the remedy is to fix the tasks, never to adjust the profile
to flatter the credential.

Specifically: **is diagnostic reasoning under-declared in this JTA?** A Scrum Master's
distinctive value is arguably that they *see what is actually wrong* — the sprint that
keeps failing for a reason nobody has named, the retrospective that is theatre. If that
is a genuine, frequent, high-criticality competence, it should appear as **more tasks
declared at Analyze**, not as a higher percentage asserted over the same tasks.

We record this as an open question rather than resolving it by preference.
