#!/usr/bin/env node
/**
 * check-clause-number-recall.mjs -- run the gate's controls, then the gate itself, read-only, over artifacts.
 *
 * READ-ONLY. Unknown flags exit 2. Default subject is the batch-2 survivors, which is what PROMPT-93 s2 asks
 * for; `--file=<artifact.json>` points it elsewhere and may be repeated.
 *
 * THE CONTROLS RUN FIRST AND A CONTROL FAILURE SUPPRESSES THE LIST. A detector that cannot separate the six
 * items it was built from has nothing useful to say about fifty-three it has never seen, and printing a list
 * anyway is how a broken instrument gets believed.
 */
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { clauseNumberRecall, clauseNumberRecallControls, CONTAINER, citesClause }
  from "./lib/clause-number-recall.mjs";

const FILES = [];
for (const a of process.argv.slice(2)) {
  let m;
  if ((m = /^--file=(.+)$/.exec(a))) { FILES.push(m[1]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --file=<artifact.json> (repeatable). READ-ONLY.");
  process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
if (!FILES.length) FILES.push("AIMSF-ROLLOUT-B2.json");
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

console.log("CONTROLS");
const ctl = clauseNumberRecallControls();
for (const c of ctl) console.log("  " + (c.pass ? "ok   " : "FAIL ") + c.what + (c.pass ? "" : "   " + c.detail));
const failed = ctl.filter((c) => !c.pass).length;
console.log("  " + (ctl.length - failed) + " of " + ctl.length + " control(s) pass");
if (failed) {
  console.log("");
  console.log("CONTROL FAILURE -- no list is printed. A detector that cannot separate the six items it was");
  console.log("built from has nothing to say about items it has never seen.");
  process.exitCode = 1;
  process.exit();
}
console.log("");
console.log("DECLARED CONTAINER CONSTRUCTIONS: " + CONTAINER.map((c) => c.id).join(", "));
console.log("");

let examined = 0, fires = 0, noRef = 0, cited = 0, unexamined = 0;
for (const f of FILES) {
  const p = existsSync(f) ? f : join(ROOT, f);
  if (!existsSync(p)) { console.log("  (missing, skipped: " + f + ")"); continue; }
  const j = JSON.parse(readFileSync(p, "utf8"));
  const surv = (j.items || []).filter((r) => r.verdict === "survivor");
  console.log(f + "   " + surv.length + " survivor(s)" +
    (surv.length ? "" : "   <- NO GATED SURVIVORS. An ungated artifact has no verdicts to filter on."));
  for (const r of surv) {
    const v = clauseNumberRecall(r.item);
    if (!v.examined) { unexamined++; continue; }
    examined++;
    /* the GATE's predicate, not a second one: the first version of this line used a narrower regex and
     * reported four citing stems where the gate sees seven. */
    if (v.pass) { if (!citesClause(r.item)) noRef++; else cited++; continue; }
    fires++;
    console.log("");
    console.log("  FIRES  " + (r.item_id || idOf(r.item.question_text)) + "   task " + r.task_code +
      "   anchor " + r.item.key_support_clause + "   [" + v.hits.join(", ") + "]");
    console.log("    " + r.item.question_text);
  }
  console.log("");
}
console.log("FIRING COUNT, on the corpus, in the same breath as the gate");
console.log("  examined            " + examined);
console.log("  UNEXAMINED          " + unexamined + "   (no stem to judge -- reported, never counted as a pass)");
console.log("  cite no clause      " + noRef);
console.log("  cite one and PASS   " + cited + "   (the clause is the authority, not the answer's address)");
if (!examined) {
  console.log("  VACUOUS -- nothing was examined, so this is not a clean result. It is no result.");
  console.log("  Point --file at a GATED artifact (one whose items carry a verdict), or gate this one first.");
  process.exitCode = 2;
}
console.log("  FIRE                " + fires +
  (examined ? "   (" + Math.round((fires / examined) * 100) + "% of examined)" : ""));
console.log("");
console.log("A clean result means NO DECLARED CONTAINER CONSTRUCTION, never \"no recall item\". The detector");
console.log("is a lexical proxy for a structural property and says so in its own header.");
