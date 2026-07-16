#!/usr/bin/env node
/**
 * patch-dryrun-and-bloomspec.mjs
 *
 * THREE FIXES, ALL FROM ONE MISTAKE I MADE.
 *
 * ------------------------------------------------------------------------------------
 * THE MISTAKE: I treated "the item contains a scenario" as evidence of Apply.
 *
 * It is not. A scenario is a VEHICLE, not a cognitive level. What sets the level is the
 * QUESTION BEING ASKED of that scenario:
 *
 *     "Here is a situation - WHAT IS IT?"           -> Understand  (classify, categorize)
 *     "Here is a situation - WHAT SHOULD BE DONE?"  -> Apply       (execute a rule)
 *     "Here is a situation - WHY IS THIS HAPPENING?"-> Analyze     (find an unsupplied cause)
 *
 * Anderson & Krathwohl place CLASSIFYING under Understand. ISTQB places classify/compare
 * at K2. A candidate shown a hospital triage system and asked "is this an AI system, a
 * foundation model, or an agentic system?" is being asked to DEMONSTRATE COMPREHENSION of
 * a taxonomy - not to act.
 *
 * ------------------------------------------------------------------------------------
 * FIX 1 - BLOOM_SPEC said "classify" at BOTH levels.
 *
 *   2_understand: "The candidate EXPLAINS, DISTINGUISHES, CLASSIFIES..."
 *   3_apply:      "...select the correct action, judgment, or CLASSIFICATION"
 *
 * The word appears in both, so the writer has no principled way to separate them - and
 * falls back on its trained habit of writing scenarios for everything. My spec caused the
 * ambiguity I then blamed the model for.
 *
 * The spec now draws the line where it belongs: on the QUESTION, not on the presence of a
 * situation. Understand items MAY carry a scenario; they simply ask what it IS, never what
 * to DO about it.
 *
 * ------------------------------------------------------------------------------------
 * FIX 2 - the dry run printed 80 characters of ONE item.
 *
 *     console.log(`[dry] ${enQs.length} logical ok (sample EN: ${enQs[0].question_text.slice(0, 80)}...)`)
 *
 * I judged a generator's cognitive fidelity on the opening clause of a single stem, and
 * nearly aborted a correct run over it. A dry run whose output cannot be audited is not a
 * dry run; it is a slower way of guessing.
 *
 * It now prints EVERY item in full - stem, all options, the key, and the difficulty - plus
 * the task code and its declared level on the header line, so what is on screen is exactly
 * what would be written to the bank.
 *
 * ------------------------------------------------------------------------------------
 * FIX 3 - gen-cert-secure logged concept slugs where it should log the task.
 *
 * backfill-practice was patched to print "> task 1.7 [1_remember]" with the statement.
 * The secure generator - the one that writes the actual examination - still printed a raw
 * uuid and a concept list, so there was no way to see, per task, what level it was writing
 * at. The expensive generator had the worse observability.
 *
 * Guarded: every anchor must match exactly once or nothing is written.
 */

import fs from "node:fs";
import path from "node:path";

const S = path.resolve("scripts");
const PATCHES = [];

// ---------------------------------------------------------------------------
// FIX 1 - BLOOM_SPEC: draw the line on the QUESTION, not on the scenario
// ---------------------------------------------------------------------------
PATCHES.push({
  file: "lib/item-task-context.mjs",
  what: "BLOOM_SPEC 2_understand - a scenario is allowed; the QUESTION is what sets the level",
  find: `  "2_understand": {
    name: "Understand",
    write: \`The candidate EXPLAINS, DISTINGUISHES, CLASSIFIES, or gives the reason WHY. Typical
stems: why a rule exists, how two things differ, what a term does and does not cover,
which description is accurate. The candidate must grasp meaning - not merely recall a
label, and not yet choose a course of action.\`,
    overshoot: \`Do NOT write "a team does X, what should you do?" - that is Apply, above this
task's declared level.\`,
  },`,
  repl: `  "2_understand": {
    name: "Understand",
    write: \`The candidate EXPLAINS, DISTINGUISHES, CLASSIFIES, or gives the reason WHY.

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
situation and asking what it IS. Both are Understand.\`,
    overshoot: \`Do NOT ask "what should you do?", "what is the correct next step?", or "how
should the team respond?" - the moment the candidate must ACT rather than IDENTIFY, the
item has become Apply and overshoots this task's declared level.\`,
  },`,
});

PATCHES.push({
  file: "lib/item-task-context.mjs",
  what: "BLOOM_SPEC 3_apply - remove 'classification', which belongs to Understand",
  find: `  "3_apply": {
    name: "Apply",
    write: \`The candidate USES the knowledge in a concrete, short situation: given a described
scenario, select the correct action, judgment, or classification. One clear situation,
one right response. Keep the scenario tight - it exists to be acted on, not analysed.\`,
    overshoot: \`Do NOT require the candidate to weigh several competing considerations, diagnose a
root cause, or reason across multiple interacting factors - that is Analyze, above this
task's declared level.\`,
  },`,
  repl: `  "3_apply": {
    name: "Apply",
    write: \`The candidate EXECUTES A RULE OR PROCEDURE to reach a decision. Given a described
situation, they determine WHAT SHOULD BE DONE - the correct action, the required response,
the permitted course.

The distinguishing question is "what should be done?", not "what is this?". Merely
CLASSIFYING a described case is Understand, not Apply - the candidate must act on the
situation, not just name it. One clear situation, one right response, derivable by
applying the taught rule.\`,
    overshoot: \`Do NOT require the candidate to weigh several competing considerations, diagnose a
root cause, or reason across multiple interacting factors - that is Analyze, above this
task's declared level. And do NOT write a pure "which category is this?" item - that is
Understand, BELOW this task's declared level, and under-tests the competence.\`,
  },`,
});

// ---------------------------------------------------------------------------
// FIX 2 + 3 - gen-cert-secure: log the task, print every item in full
// ---------------------------------------------------------------------------
PATCHES.push({
  file: "gen-cert-secure.mjs",
  what: "log the task code + its DECLARED LEVEL (was printing a uuid and concept slugs)",
  find: `    console.log(\`> task \${w.taskId} [\${slugs}] - have min \${w.min}, need \${w.need}\`);`,
  repl: `    const wTask = taskById.get(w.taskId);
    if (!wTask || !wTask.bloom_level) {
      console.log(\`  ! task \${w.taskId} declares no bloom_level - SKIPPED. Fix the JTA; do not guess a level.\`);
      continue;
    }
    console.log(\`\\n> task \${wTask.code}  [\${wTask.bloom_level}]  - have min \${w.min}, need \${w.need}\`);
    console.log(\`    STATEMENT: \${wTask.statement}\`);
    if (wTask.skills) console.log(\`    SKILLS:    \${wTask.skills}\`);
    console.log(\`    concepts:  \${slugs}\`);`,
});

PATCHES.push({
  file: "gen-cert-secure.mjs",
  what: "dry run prints EVERY item in full - stem, options, key, difficulty",
  find: `        console.log(\`    [dry] \${enQs.length} logical ok (sample EN: \${enQs[0].question_text.slice(0, 80)}...)\`);`,
  repl: `        // Print EVERY item in full. A dry run whose output cannot be read is not a dry
        // run - it is a slower way of guessing. Judging cognitive level from the first
        // 80 characters of one stem is exactly how a correct run nearly got aborted.
        console.log(\`    [dry] \${enQs.length} item(s) at \${wTask.bloom_level}:\`);
        for (const q of enQs) {
          const key = Array.isArray(q.correct_answer) ? q.correct_answer.join(",") : String(q.correct_answer);
          console.log(\`\\n      --- d\${q.difficulty} ------------------------------------------------\`);
          console.log(\`      \${q.question_text}\`);
          for (const o of q.options || []) {
            console.log(\`        \${o.id === key || key.includes(o.id) ? "*" : " "} \${o.id}) \${o.text}\`);
          }
        }
        console.log("");`,
});

// ---------------------------------------------------------------------------
const byFile = new Map();
let ok = true;

for (const p of PATCHES) {
  const fp = path.join(S, p.file);
  if (!fs.existsSync(fp)) { console.error(`  MISSING  ${p.file}`); ok = false; continue; }
  if (!byFile.has(p.file)) byFile.set(p.file, fs.readFileSync(fp, "utf8"));
  const src = byFile.get(p.file);

  if (src.includes(p.repl)) { console.log(`  already  ${p.file} :: ${p.what}`); continue; }

  const hits = src.split(p.find).length - 1;
  if (hits !== 1) {
    console.error(`  ANCHOR   ${p.file} :: ${p.what}  -> matched ${hits}x, expected 1`);
    ok = false;
    continue;
  }
  byFile.set(p.file, src.replace(p.find, p.repl));
  console.log(`  staged   ${p.file} :: ${p.what}`);
}

if (!ok) { console.error("\nABORTED. Nothing written."); process.exit(1); }

for (const [file, out] of byFile) {
  const fp = path.join(S, file);
  fs.writeFileSync(fp + ".bak", fs.readFileSync(fp));
  fs.writeFileSync(fp, out, "utf8");
  console.log(`\n  WROTE  ${file}`);
}

console.log(`
BLOOM_SPEC now draws the line on the QUESTION, not on the scenario.
The dry run now prints every item in full, with the task's declared level.`);
