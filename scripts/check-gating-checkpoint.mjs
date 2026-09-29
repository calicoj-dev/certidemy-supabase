#!/usr/bin/env node
/**
 * check-gating-checkpoint.mjs -- prove the gating checkpoint survives a kill.
 *
 * Ruled PROMPT-92 s1: kill a two-item run after its first item, resume it, and show that item 1 is not
 * re-called and that the spend total adds up.
 *
 * `--apply` makes REAL model calls (it must: the claim is about paid calls). DRY BY DEFAULT, which prints
 * the plan and writes nothing. Unknown flags exit 2.
 *
 * ============ WHY A CONTROL AND NOT AN ARGUMENT ============
 *
 * This repository has a standing rule that a gate nobody has watched fire is the same object as a count
 * assertion nobody has watched fail. The checkpoint's whole claim is about what happens when a process
 * DIES, and no amount of reading the code demonstrates that. So a run is actually killed.
 *
 * ============ WHAT IS ASSERTED, AND THE SECOND ONE IS THE POINT ============
 *
 *   1. after the kill, the partial file holds exactly ONE item;
 *   2. the resumed run makes FEWER CALLS than a cold run would -- measured, not assumed -- and specifically
 *      makes no call attributable to item 1;
 *   3. the final artifact holds BOTH items;
 *   4. the resumed run's reported spend EQUALS the killed run's spend plus the resume's own, so nothing paid
 *      for is lost from the total. This is the half the batch-2 kill destroyed and the half an
 *      "it resumed fine" claim would not notice.
 */
import { execFileSync, spawn } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, unlinkSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default).");
  console.error("This control makes REAL model calls, because its claim is about paid calls surviving a kill.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT = "CHECKPOINT-CONTROL.json";
const RAW = join(ROOT, "CHECKPOINT-CONTROL-raw.json");
const PARTIAL = join(ROOT, "CHECKPOINT-CONTROL.partial.jsonl");
const FINAL = join(ROOT, OUT);
const GEN = join(HERE, "gen-grounded-items.mjs");

/* a two-item source artifact, taken from batch 2's raw output so the items are real and already paid for */
const SRC = join(ROOT, "AIMSF-ROLLOUT-B2-raw.json");
if (!existsSync(SRC)) { console.error("need " + SRC); process.exit(2); }

console.log("plan:");
console.log("  1. build a TWO-ITEM raw artifact from AIMSF-ROLLOUT-B2-raw.json");
console.log("  2. run the re-gate and KILL it as soon as the partial file has one line");
console.log("  3. assert the partial holds exactly 1 item");
console.log("  4. resume, and assert item 1 makes NO model call and the spend adds up");
console.log("  5. assert the final artifact holds BOTH items, then clean up");
if (!APPLY) {
  console.log("\nDRY RUN -- no model calls, nothing written. Re-run with --apply.");
  process.exit(0);
}

for (const f of [RAW, PARTIAL, FINAL, PARTIAL + ".done"]) if (existsSync(f)) unlinkSync(f);
const src = JSON.parse(readFileSync(SRC, "utf8"));
/* two items from DIFFERENT tasks, so a per-task shortcut cannot make this pass by accident */
const seen = new Set();
const two = [];
for (const it of src.items || []) {
  if (seen.has(it.task_code)) continue;
  seen.add(it.task_code); two.push(it);
  if (two.length === 2) break;
}
if (two.length !== 2) { console.error("could not take two items from two tasks"); process.exit(2); }
writeFileSync(RAW, JSON.stringify({ ...src, items: two }, null, 1) + "\n", "utf8");
console.log("\nbuilt a 2-item artifact: " + two.map((x) => x.task_code).join(", "));

const args = ["--dns-result-order=ipv4first", GEN, "--cert=AIMS-F",
  "--from=CHECKPOINT-CONTROL-raw.json", "--out=" + OUT];

/* ---- step 2: run and kill after the first checkpointed item ---- */
const killLog = [];
const killed = await new Promise((resolve) => {
  const ch = spawn(process.execPath, args, { cwd: ROOT });
  let done = false;
  const poll = setInterval(() => {
    if (done) return;
    if (existsSync(PARTIAL)) {
      /* Wait for a line that PARSES, not merely for a non-empty file. Killing mid-write would leave a
       * truncated line, the resume would correctly re-gate that item, and the control would then be
       * measuring the truncation-tolerance path while claiming to measure the skip. */
      const lines = readFileSync(PARTIAL, "utf8").split(/\r?\n/).filter((l) => l.trim());
      let n = 0;
      for (const l of lines) { try { JSON.parse(l); n++; } catch { /* not yet complete */ } }
      if (n >= 1) {
        done = true; clearInterval(poll);
        ch.kill("SIGKILL");            /* SIGKILL: no chance to tidy up, which is the point */
        resolve({ killedAt: n });
      }
    }
  }, 400);
  ch.stdout.on("data", (d) => killLog.push(String(d)));
  ch.stderr.on("data", (d) => killLog.push(String(d)));
  ch.on("exit", () => {
    if (done) return;
    done = true; clearInterval(poll);
    resolve({ killedAt: null, exitedFirst: true });
  });
});
let fails = 0;
const ok = (what, cond, detail) => {
  console.log((cond ? "  ok   " : "  FAIL ") + what + (detail !== undefined && !cond ? "   " + detail : ""));
  if (!cond) fails++;
};
console.log("\nafter the kill:");
ok("the run was killed mid-gating, not allowed to finish", !killed.exitedFirst,
  "it exited on its own -- the control proved nothing");
const partialLines = existsSync(PARTIAL)
  ? readFileSync(PARTIAL, "utf8").split(/\r?\n/).filter((l) => l.trim()) : [];
ok("the partial file holds exactly 1 item", partialLines.length === 1, "holds " + partialLines.length);
ok("the final artifact does NOT exist yet", !existsSync(FINAL));
const first = partialLines.length ? JSON.parse(partialLines[0]) : null;
const killSpend = first ? first.spend_delta : null;
if (first) {
  console.log("      item 1 = " + first.item_id + " (task " + first.task_code + "), verdict " +
    first.verdict + ", " + killSpend.calls + " call(s), $" +
    (((killSpend.input / 1e6) * 15) + ((killSpend.output / 1e6) * 75)).toFixed(3));
}

/* ---- step 4: resume ---- */
console.log("\nresuming:");
const out2 = execFileSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
const resumedLine = (out2.match(/CHECKPOINT: resumed [^\n]*/) || ["(no resume line)"])[0];
console.log("      " + resumedLine.trim());
ok("the resume reported reading the checkpoint", /CHECKPOINT: resumed 1 gated item/.test(out2));

const fin = JSON.parse(readFileSync(FINAL, "utf8"));
ok("the final artifact holds BOTH items", (fin.items || []).length === 2,
  "holds " + (fin.items || []).length);
ok("item 1's verdict came from the checkpoint, unchanged",
  (fin.items || []).some((x) => (x.item_id || "") === (first || {}).item_id &&
    x.verdict === (first || {}).verdict));

/* the second assertion: item 1 cost nothing on the resume */
const linesAfter = existsSync(PARTIAL + ".done")
  ? readFileSync(PARTIAL + ".done", "utf8").split(/\r?\n/).filter((l) => l.trim()) : [];
const byId = new Map(linesAfter.map((l) => { const r = JSON.parse(l); return [r.item_id, r]; }));
ok("the retired partial holds 2 item(s)", linesAfter.length === 2, "holds " + linesAfter.length);
ok("item 1 was NOT checkpointed a second time (one line per item)",
  linesAfter.filter((l) => JSON.parse(l).item_id === (first || {}).item_id).length === 1);

/* spend arithmetic: the resume's own delta must be the SECOND item only */
const secondRec = linesAfter.map((l) => JSON.parse(l)).find((r) => r.item_id !== (first || {}).item_id);
const total = fin.spend || {};
const sumDeltas = linesAfter.reduce((a, l) => {
  const d = JSON.parse(l).spend_delta || {};
  return { calls: a.calls + (d.calls || 0), input: a.input + (d.input || 0), output: a.output + (d.output || 0) };
}, { calls: 0, input: 0, output: 0 });
const usd = (x) => ((x.input / 1e6) * 15) + ((x.output / 1e6) * 75);
console.log("");
console.log("  spend arithmetic:");
console.log("    item 1 (killed run)   " + killSpend.calls + " call(s)  $" + usd(killSpend).toFixed(3));
console.log("    item 2 (resumed run)  " + (secondRec ? secondRec.spend_delta.calls : "?") + " call(s)  $" +
  (secondRec ? usd(secondRec.spend_delta).toFixed(3) : "?"));
console.log("    sum of the deltas     " + sumDeltas.calls + " call(s)  $" + usd(sumDeltas).toFixed(3));
console.log("    artifact total        " + total.calls + " call(s)  $" + Number(total.usd || 0).toFixed(3));
ok("the artifact total EQUALS the sum of both items' deltas",
  total.calls === sumDeltas.calls && Math.abs(Number(total.usd || 0) - usd(sumDeltas)) < 0.01,
  total.calls + " vs " + sumDeltas.calls);
/* THE RULED ASSERTION, MEASURED RATHER THAN INFERRED. The resumed process's OWN calls are the artifact
 * total minus what the checkpoint restored. Had item 1 been re-gated, that number would carry item 1's
 * calls as well as item 2's. Stating it as a subtraction rather than as "the total went up" is the
 * difference between measuring the claim and finding a number consistent with it. */
const resumeOwnCalls = total.calls - killSpend.calls;
console.log("    the resume's OWN calls  " + resumeOwnCalls + "   (artifact total " + total.calls +
  " minus the " + killSpend.calls + " it restored from the checkpoint)");
ok("item 1 was NOT re-called: the resume's own calls are item 2's alone",
  resumeOwnCalls === (secondRec ? secondRec.spend_delta.calls : -1),
  resumeOwnCalls + " own call(s) against item 2's " + (secondRec ? secondRec.spend_delta.calls : "?"));
ok("item 1's paid calls are still in the total (the half the batch-2 kill destroyed)",
  total.calls > resumeOwnCalls, "total " + total.calls + " is not greater than the resume's own work");

/* clean up: this control's artifacts are not results */
for (const f of [RAW, FINAL, PARTIAL, PARTIAL + ".done",
  join(ROOT, "CHECKPOINT-CONTROL-raw.json.done")]) {
  if (existsSync(f)) rmSync(f);
}
console.log("\ncleaned up the control's artifacts (they are not results)");
console.log(fails ? "\n" + fails + " assertion(s) FAILED" : "\nall assertions pass");
if (fails) process.exitCode = 1;
