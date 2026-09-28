#!/usr/bin/env node
/**
 * regate-pilot4-decue.mjs -- apply the NEW de-cue rules to pilot 4's 24 recorded rewrites, and report
 * which survive.
 *
 * READ-ONLY, and it makes NO MODEL CALLS. Unknown flags exit 2.
 *
 *   --from=PILOT-4-DECUE-REVIEW.json   the recorded re-de-cue (required)
 *   --out=PILOT-4-DECUE-REGATE.md
 *
 * ============ WHY NOT RE-RUN THE DE-CUE ============
 *
 * The rewrites are already recorded, field by field, in the artifact. The ruling changes the RULES, not
 * the writer -- so the honest measurement is the new rules against the OLD output, which is this
 * repository's own delta discipline: run the new instrument on the old input first, and change one
 * thing at a time. Re-generating would change both and make the 8-versus-13 attributable to neither.
 *
 * It is also free and deterministic, where a re-run costs 24 writer calls and would produce different
 * text -- a dry run of a generator is a sample, not a preview.
 *
 * ============ THE FIVE CHECKS ============
 *
 *   1  new absolutes          an absolute in a rewritten distractor that its original lacked
 *   2  changed reference      a clause address or multi-word control title dropped
 *   3  no new code cue        NEW: any cue id the original did not carry
 *   4  triggering cue clears  NEW: the cue that triggered the rewrite must be gone
 *   5  limiter preserved      NEW: a restrictive limiter in the original must survive
 *
 * Checks 3, 4 and 5 are the director's, from his read of all 24. Each carries a regression case built
 * from the item that motivated it.
 *
 * ============ AND THE TRIGGER ITSELF MOVES ============
 *
 * Under the new rule a de-cue runs only where a CODE cue fires. The probe never triggers; it prints as
 * a flag. Measured on this artifact: most of the 24 were triggered by the probe alone on items with no
 * code cue, which is why so few survive.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { shapeCues, shapeCueControls } from "./lib/shape-cues.mjs";
import { deCueRewriteCheck, deCueCheckControls, LIMITERS, limiterDropped,
  newCodeCue, triggerCleared } from "./lib/de-cue-checks.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let FROM = "PILOT-4-DECUE-REVIEW.json", OUT = "PILOT-4-DECUE-REGATE.md";
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--from=(.+)$/.exec(a))) { FROM = m[1]; continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("unknown flag " + JSON.stringify(a) + ". Known: --from=, --out=");
  console.error("READ-ONLY and no model calls. There is no --apply: this reports, it does not rewrite.");
  process.exitCode = 2; process.exit();
}

const ctl = [shapeCueControls(), deCueCheckControls()];
const fails = ctl.flatMap((c) => c.fails);
console.log("CONTROLS  " + ctl.reduce((a, c) => a + c.examined, 0) + " case(s), " + fails.length + " fail");
if (fails.length) {
  for (const f of fails) console.error("  FAIL " + f);
  console.error("REFUSING TO REPORT -- a check that cannot fire clears every rewrite.");
  process.exitCode = 2; process.exit();
}

const art = JSON.parse(readFileSync(join(ROOT, FROM), "utf8"));
const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const controlTitles = [...new Set(lib.passages
  .filter((p) => /^[A-D]\./.test(String(p.clause || "")))
  .map((p) => String(p.title || "").trim()).filter((t) => t.length >= 12 && /\s/.test(t)))];

/* ============ THE REAL KEY AND STEM COME FROM THE PILOT ARTIFACT ============
 *
 * The review artifact stores the distractors before and after, and NOT the key text or the stem. My
 * first version reconstructed items with a placeholder key -- which silently disabled every rule that
 * reads the key: key-length, only-hedged and odd-verdict all need it, and odd-verdict needs the stem's
 * option count too. It reported KEEP 4 where the director's read says 8, and the four it lost are
 * exactly the ones whose trigger those rules decide.
 *
 * A reconstruction that cannot evaluate the rules it is being asked about is not an approximation, it
 * is a silent no. So the gated pilot artifact is loaded and each review row is paired with its item by
 * task, in order of appearance -- the same order the review rows were built in.
 */
const PILOT = "PILOT-GROUNDED-AIMSF-4.json";
const pilot = JSON.parse(readFileSync(join(ROOT, PILOT), "utf8"));
const pilotByTask = new Map();
for (const r of pilot.items) {
  if (r.verdict !== "survivor" || !r.de_cue || r.de_cue.state !== "applied") continue;
  if (!pilotByTask.has(r.task_code)) pilotByTask.set(r.task_code, []);
  pilotByTask.get(r.task_code).push(r);
}
const takenPerTask = new Map();
const nextPilotFor = (task) => {
  const n = takenPerTask.get(task) || 0;
  takenPerTask.set(task, n + 1);
  return (pilotByTask.get(task) || [])[n] || null;
};
const keyTextOf = (it) => {
  const o = (it.item.options || []).find((x) => x && x.is_correct);
  return o ? String(o.text) : null;
};
/* The option ORDER matters to odd-verdict (it needs four options) and not to the others, so the key is
 * placed at its real index rather than first. */
const asItem = (stem, keyText, keyIdx, distractors) => {
  const texts = [];
  let d = 0;
  for (let i = 0; i < distractors.length + 1; i++) texts.push(i === keyIdx ? keyText : distractors[d++]);
  return {
    question_text: stem || "",
    correct_index: keyIdx,
    options: texts.map((t, i) => ({ id: "abcd"[i], text: t, is_correct: i === keyIdx })),
  };
};

const rows = [];
for (const it of art.items) {
  /* THE PAIRING CONSUMES ONE PILOT ITEM PER REVIEW ROW, WHATEVER THAT ROW'S OUTCOME. Skipping the
   * consume for a reverted row desynchronises every later pairing on the same task -- which is how the
   * first run of this paired 5.2's second item against the first and lost a KEEP. The review rows are in
   * the order the subjects were built, so the counter has to advance in that same order. */
  const src = nextPilotFor(it.task);
  if (it.state !== "applied") { rows.push({ ...it, decision: it.state.toUpperCase(), why: it.reason || "" }); continue; }
  if (!src) { rows.push({ ...it, decision: "CANNOT REGATE", why: "no pilot item paired for task " + it.task }); continue; }
  const keyText = keyTextOf(src);
  const keyIdx = (src.item.options || []).findIndex((o) => o && o.is_correct);
  if (!keyText || keyIdx < 0) {
    rows.push({ ...it, decision: "CANNOT REGATE", why: "the pilot item for task " + it.task + " has no resolvable key" });
    continue;
  }
  const stem = String(src.item.question_text || "");
  const before = asItem(stem, keyText, keyIdx, it.origD || []);
  const after = asItem(stem, keyText, keyIdx, it.newD || []);

  /* THE TRIGGER, UNDER THE NEW RULE: a CODE cue on the original, computed with all SIX rules. The
   * artifact's `shape_before` was recorded with four, so it cannot answer whether only-hedged or
   * odd-verdict triggered -- it is reported beside the six-rule answer rather than used. */
  const cuesBefore = shapeCues(before).map((c) => c.id);
  const cuesAfter = shapeCues(after).map((c) => c.id);
  const recordedBefore = (it.shape_before || []).map((c) => c.id);
  const trigger = cuesBefore;
  const afterIds = cuesAfter;

  const rw = deCueRewriteCheck(it.origD || [], it.newD || [], controlTitles);
  const c3 = newCodeCue(trigger, afterIds);
  const c4 = triggerCleared(trigger, afterIds);
  const c5 = limiterDropped(it.origD || [], it.newD || []);

  let decision = "KEEP", why = "";
  if (!trigger.length) {
    decision = "REVERT"; why = "no code shape cue on the original: under the new trigger this rewrite " +
      "would never have been attempted (probe-only trigger)";
  } else if (rw.revert) {
    decision = "REVERT"; why = "check 1/2: " + rw.reason;
  } else if (c3.length) {
    decision = "REVERT"; why = "check 3: new code cue " + c3.join(", ") + " that the original did not carry";
  } else if (!c4.cleared) {
    decision = "REVERT"; why = "check 4: the triggering cue " + c4.remaining.join(", ") + " did not clear";
  } else if (c5.length) {
    decision = "REVERT"; why = "check 5: limiter dropped -- " +
      c5.map((x) => "option " + (x.index + 1) + " lost " + JSON.stringify(x.limiter)).join("; ");
  } else {
    why = "code cue " + trigger.join(", ") + " cleared, no new cue, limiters intact";
  }
  rows.push({ ...it, trigger, afterIds, recordedBefore, decision, why });
}

const keep = rows.filter((r) => r.decision === "KEEP");
const revert = rows.filter((r) => r.decision === "REVERT");
const already = rows.filter((r) => !["KEEP", "REVERT"].includes(r.decision));

const md = [];
const p = (s = "") => md.push(s);
p("# Pilot 4 de-cue, re-gated under the new rules");
p("");
p("`scripts/regate-pilot4-decue.mjs`, read-only, **no model calls**. The new rules are applied to the");
p("rewrites already recorded in `" + FROM + "`, which is the delta discipline: new instrument, old");
p("input, one thing changed at a time. Re-generating would change the rules AND the text and make the");
p("result attributable to neither.");
p("");
p("| | |");
p("|---|---|");
p("| applied in the recorded run | " + rows.filter((r) => r.state === "applied").length + " |");
p("| **KEEP under the new rules** | **" + keep.length + "** |");
p("| REVERT under the new rules | " + revert.length + " |");
p("| already reverted, unchanged | " + already.length + " |");
p("");
p("## Decisions");
p("");
p("| task | decision | trigger cue | after | why |");
p("|---|---|---|---|---|");
for (const r of rows) {
  p("| " + r.task + " | **" + r.decision + "** | " + ((r.trigger || []).join(", ") || "-") +
    " | " + ((r.afterIds || []).join(", ") || "-") + " | " + String(r.why).replace(/\|/g, "\\|") + " |");
}
p("");
p("## Why so many revert");
p("");
p("The dominant reason is the TRIGGER, not the rewrites: an item with no code shape cue would never");
p("have been rewritten under the new rule, because the options probe no longer triggers anything. The");
p("probe scored the authored bank at 98 percent, so it reads examiner convention rather than a defect,");
p("and rewriting to satisfy it produced parallel distractors that it flagged anyway.");
p("");
writeFileSync(join(ROOT, OUT), md.join("\n") + "\n", "utf8");

console.log("PILOT 4 RE-GATE under the new rules");
console.log("  applied in the recorded run   " + rows.filter((r) => r.state === "applied").length);
console.log("  KEEP                          " + keep.length);
console.log("  REVERT                        " + revert.length);
console.log("  already reverted              " + already.length);
const byReason = revert.reduce((m, r) => {
  const k = /^check (\d)/.exec(r.why) ? "check " + /^check (\d)/.exec(r.why)[1] : "no code cue (trigger)";
  m[k] = (m[k] || 0) + 1; return m;
}, {});
for (const [k, v] of Object.entries(byReason).sort((a, b) => b[1] - a[1])) console.log("    " + k.padEnd(24) + v);
console.log("  wrote " + OUT);
console.log("  KEEP tasks: " + keep.map((r) => r.task).join(", "));
