/**
 * item-task-context.mjs - puts the JOB-TASK ANALYSIS into the item generator.
 *
 * ============================================================================
 * THE DEFECT THIS FIXES
 * ============================================================================
 * ISO/IEC 17024 makes the job-task analysis the foundation of the credential: the
 * exam exists to measure the tasks the JTA declares, at the cognitive levels it
 * declares them. Certidemy's JTAs do this properly - all 204 tasks across the five
 * certs carry a `statement`, `knowledge` / `skills` / `abilities`, a `criticality`,
 * and a declared `bloom_level`. The scaffold migrations loaded every field. It is
 * all sitting in `public.tasks`.
 *
 * The item generator never read that table.
 *
 * `gather()` selected concepts and task_concepts, then derived its task list from
 * `[...conceptsByTask.keys()]` - so a "task", to the generator, was nothing but a bag
 * of concept slugs. The draft prompt said "write questions that TEST the following
 * concept(s)" and listed concept descriptions. The task statement, the KSAs, and the
 * declared Bloom level were invisible. `bloom_level` on the item was then stamped
 * from a hardcoded DIFFICULTY curve that had nothing to do with the JTA at all.
 *
 * Measured consequence (secure pools, en): items testing ABOVE their task's declared
 * cognitive level - AIGRM-I 58.9%, SM-AI-I 35.5%, SPO-AI-I 34.4%, SD-AI-I 24.7%.
 * There was no traceability from a task's declared level to the items testing it,
 * because the two were never connected.
 *
 * This is also the ROOT CAUSE behind the other three defects found the same day. The
 * grounding was Scrum-flavoured because the generator had no task context to ground
 * in. The Bloom mapping was arbitrary because it never read the declared level. The
 * difficulty curve was invented because nothing anchored it. One disease, three
 * symptoms: the pipeline was concept-first, and the JTA was never wired into it.
 *
 * ============================================================================
 * WHAT THIS MODULE DOES
 * ============================================================================
 * 1. `taskBlock(task)` - renders the task's statement + KSAs + declared Bloom into
 *    the draft prompt, so the item writer is told WHAT COMPETENCE IT IS MEASURING
 *    rather than being handed three concept definitions and left to guess.
 * 2. `bloomDirective(task, kind, certName)` - tells the writer to assess AT the
 *    declared level, with a concrete description of what that level means for an
 *    MCQ, and what would overshoot it.
 * 3. `bloomForTask(task)` - the Bloom to STAMP on the item: the task's declared
 *    level, full stop. Not a function of difficulty.
 *
 * DIFFICULTY becomes what it should always have been: an orthogonal 1-5 dial WITHIN
 * the declared cognitive level. Two Apply items can differ in difficulty; neither is
 * thereby an Analyze item. Conflating the two is what produced the mess.
 *
 * Falls back cleanly when `task` is absent, so callers can be migrated one at a time.
 */

export const BLOOM_RANK = {
  "1_remember": 1,
  "2_understand": 2,
  "3_apply": 3,
  "4_analyze": 4,
  "5_evaluate": 5,
  "6_create": 6,
};

/** What it means to WRITE an MCQ at each level, and what overshooting looks like. */
const BLOOM_SPEC = {
  "1_remember": {
    name: "Remember",
    write: `The candidate RECALLS a stated fact, definition, term, timebox, or list from the
body of knowledge. A clean, unambiguous recall item is CORRECT at this level - do not
inflate it into a scenario to make it feel harder.`,
    overshoot: `Do NOT write a scenario requiring the candidate to decide what to do. That is
Apply, and it overshoots this task's declared level.`,
  },
  "2_understand": {
    name: "Understand",
    write: `The candidate EXPLAINS, DISTINGUISHES, CLASSIFIES, or gives the reason WHY.

A SCENARIO IS ALLOWED AT THIS LEVEL. What makes an item Understand is not the absence of
a situation - it is the QUESTION ASKED OF IT:

    Understand asks:  WHAT IS THIS?  Which category does it fall into? Why does it work
                      that way? How do these two differ? Which description is accurate?
    Apply asks:       WHAT SHOULD BE DONE?  Given this situation, what action does the
                      rule require?

So "here is a described system - is it a foundation model, a generative model, or an
agentic system?" is UNDERSTAND: the candidate demonstrates they grasp the taxonomy.
Classifying, categorizing, matching a case to a concept, and naming what is missing are
all Understand - the candidate is showing comprehension, not taking an action.

Vary the vehicle across the set: some items purely conceptual, some presenting a short
situation and asking what it IS. Both are Understand.`,
    overshoot: `Do NOT ask "what should you do?", "what is the correct next step?", or "how
should the team respond?" - the moment the candidate must ACT rather than IDENTIFY, the
item has become Apply and overshoots this task's declared level.`,
  },
  "3_apply": {
    name: "Apply",
    write: `The candidate EXECUTES A RULE OR PROCEDURE to reach a decision. Given a described
situation, they determine WHAT SHOULD BE DONE - the correct action, the required response,
the permitted course.

The distinguishing question is "what should be done?", not "what is this?". Merely
CLASSIFYING a described case is Understand, not Apply - the candidate must act on the
situation, not just name it. One clear situation, one right response, derivable by
applying the taught rule.`,
    overshoot: `Do NOT require the candidate to weigh several competing considerations, diagnose a
root cause, or reason across multiple interacting factors - that is Analyze, above this
task's declared level. And do NOT write a pure "which category is this?" item - that is
Understand, BELOW this task's declared level, and under-tests the competence.`,
  },
  "4_analyze": {
    name: "Analyze",
    write: `The candidate BREAKS A SITUATION DOWN: diagnoses the underlying cause, distinguishes
symptom from source, or reasons across several interacting factors to reach a defensible
conclusion. The stem carries enough detail that a competent practitioner must actually
work through it.`,
    overshoot: `Do NOT ask the candidate to judge the WORTH of competing approaches or design
something new - that is Evaluate/Create, which is out of MCQ scope entirely.`,
  },
  "5_evaluate": {
    name: "Evaluate",
    write: `The candidate JUDGES against criteria and defends a position.`,
    overshoot: `Evaluate is generally OUT OF SCOPE for multiple choice; such tasks belong in
simulation. If you are writing an MCQ here, keep it to a defensible single best answer.`,
  },
  "6_create": {
    name: "Create",
    write: `The candidate PRODUCES something new. Not assessable by multiple choice.`,
    overshoot: `Out of scope for MCQ.`,
  },
};

/** Normalize whatever the DB enum hands us. */
function levelOf(task) {
  const raw = task?.bloom_level;
  if (!raw) return null;
  const key = String(raw);
  return BLOOM_SPEC[key] ? key : null;
}

/**
 * The Bloom level to STAMP on an item: the task's DECLARED level.
 * Never derived from difficulty. If the task has no declared level (should not
 * happen on a scaffolded cert), fall back to the caller's legacy mapping.
 */
export function bloomForTask(task, fallback = "2_understand") {
  return levelOf(task) ?? fallback;
}

/**
 * The task context block for the draft prompt. This is the JTA speaking directly to
 * the item writer: here is the competence, here are the KSAs behind it, here is the
 * level at which it is declared to be tested.
 */
export function taskBlock(task) {
  if (!task) return "";
  const lvl = levelOf(task);
  const spec = lvl ? BLOOM_SPEC[lvl] : null;
  const lines = [];

  lines.push(`THE TASK BEING ASSESSED (from the job-task analysis - this is what the`);
  lines.push(`credential certifies, and what these items must measure):`);
  lines.push(``);
  if (task.code) lines.push(`  Task ${task.code}`);
  if (task.statement) lines.push(`  Statement: ${task.statement}`);
  if (spec) lines.push(`  Declared cognitive level: ${lvl} (${spec.name})`);
  if (task.criticality) lines.push(`  Criticality: ${task.criticality}`);
  lines.push(``);

  const ksa = [];
  if (task.knowledge) ksa.push(`    Knowledge: ${task.knowledge}`);
  if (task.skills) ksa.push(`    Skills:    ${task.skills}`);
  if (task.abilities) ksa.push(`    Abilities: ${task.abilities}`);
  if (ksa.length) {
    lines.push(`  Knowledge / skills / abilities this task requires:`);
    lines.push(...ksa);
    lines.push(``);
  }

  lines.push(`Every item must measure THIS task. The concepts below are the material the`);
  lines.push(`task draws on - they are the substance, but the TASK is the target.`);
  return lines.join("\n");
}

/**
 * The cognitive-level directive for the draft prompt. Replaces the old
 * "aim for 30% level 2 / 50% level 3 / 20% level 4" difficulty curve, which was
 * invented and disconnected from the JTA.
 *
 * When the task declares a level, items are written AT that level, and DIFFICULTY
 * varies 1..5 WITHIN it. When no task is supplied, fall back to the legacy per-cert
 * difficulty line so existing callers keep working.
 */
export function bloomDirective(task, kind, legacyLine) {
  const lvl = levelOf(task);
  if (!lvl) return legacyLine;
  const spec = BLOOM_SPEC[lvl];

  return `COGNITIVE LEVEL - write EVERY item at ${lvl} (${spec.name}), the level this task
is declared at in the job-task analysis. This is not a target average across the set;
it is the level of each item.

  ${spec.write.split("\n").join("\n  ")}

  ${spec.overshoot.split("\n").join("\n  ")}

DIFFICULTY is a SEPARATE dial from cognitive level. Vary "difficulty" 1..5 WITHIN
${spec.name}: an easy ${spec.name} item and a hard ${spec.name} item are both
${spec.name} items. Spread the set roughly 30% easy / 50% moderate / 20% hard for
this level. Do NOT raise the cognitive level to make an item harder - make the
content subtler, the distractors closer, or the situation less familiar instead.${
    kind === "secure"
      ? `\n\nThese are SECURE, exam-grade items: they must withstand professional scrutiny and
unambiguously separate a competent candidate from an unprepared one.`
      : ""
  }`;
}

/** Convenience for verifiers: is this item above its task's declared level? */
export function isAboveTaskBloom(itemBloom, task) {
  const lvl = levelOf(task);
  if (!lvl) return false;
  return (BLOOM_RANK[String(itemBloom)] ?? 0) > BLOOM_RANK[lvl];
}
