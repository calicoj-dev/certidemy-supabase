#!/usr/bin/env node
/* Lifts a rescued item's recorded solver result from `revised[].solver` onto `item.solver`.
 * revise-artifact wrote only the former until PROMPT-123, so three solved rescues read as unsolved.
 * The evidence already exists in the file; this invents nothing. --apply to write, dry by default. */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const ARGS = process.argv.slice(2);
const APPLY = ARGS.includes("--apply");
for (const a of ARGS) {
  if (a !== "--apply" && !a.startsWith("--file=") && !a.startsWith("--only=")) {
    console.error("unrecognised flag: " + a);
    console.error("this script opts into WRITING: --apply (dry by default). --file=<artifact> --only=a,b");
    process.exit(2);
  }
}
const FILE = (ARGS.find((a) => a.startsWith("--file=")) || "--file=ISMSF-R8").slice(7);
const ONLY = (ARGS.find((a) => a.startsWith("--only=")) || "--only=").slice(7)
  .split(",").map((s) => s.trim()).filter(Boolean);

const path = join(ROOT, FILE);
const j = JSON.parse(readFileSync(path, "utf8"));
const items = j.items || [];

console.log("BACKFILL item.solver FROM revised[].solver -- " + FILE);
console.log("  " + items.length + " item(s) in the artifact" + (ONLY.length ? ", scoped to " + ONLY.join(", ") : ""));
console.log("");

/* CONTROLS, both directions, before anything is touched. */
const controls = [];
const probe = (what, pass) => controls.push({ what, pass });
{
  const lift = (it) => {
    const r = [...(it.revised || [])].reverse().find((x) => Array.isArray(x.solver) && x.solver.length === 2);
    if (!r) return null;
    const [a, b] = r.solver;
    if (!(a === "accepted" && b === "accepted")) return null;
    return { state: "accepted", runs: 2, second: { state: b },
      reason: "lifted from revised[].solver (" + (r.ruled_in || "no ruling recorded") + ")",
      unshuffled: true, via: "backfill-artifact-solver PROMPT-123" };
  };
  probe("an accepted/accepted revision lifts",
    !!lift({ revised: [{ solver: ["accepted", "accepted"], ruled_in: "X" }] }));
  probe("a SPLIT revision does NOT lift",
    lift({ revised: [{ solver: ["accepted", "rejected"] }] }) === null);
  probe("a rejected/rejected revision does NOT lift",
    lift({ revised: [{ solver: ["rejected", "rejected"] }] }) === null);
  probe("an item with no revised block does NOT lift", lift({}) === null);
  probe("a keep_verdict string solver does NOT lift",
    lift({ revised: [{ solver: "KEPT: accepted (no new call, PROMPT-119 s1)" }] }) === null);
  probe("the LAST revision wins when there are two",
    (lift({ revised: [{ solver: ["accepted", "accepted"] }, { solver: ["accepted", "rejected"] }] })) === null);
  globalThis.__lift = lift;
}
const failed = controls.filter((c) => !c.pass);
console.log("  controls: " + controls.length + " case(s), " +
  (failed.length ? failed.length + " FAIL" : "all pass"));
for (const f of failed) console.log("      FAIL " + f.what);
if (failed.length) { console.error("REFUSING: the lift rule's own controls fail"); process.exit(2); }
console.log("");

const lift = globalThis.__lift;
const touched = [];
const skipped = [];
for (const it of items) {
  if (ONLY.length && !ONLY.includes(it.item_id)) continue;
  if (it.solver && it.solver.state) { skipped.push([it.item_id, "already has solver " + it.solver.state]); continue; }
  const s = lift(it);
  if (!s) { skipped.push([it.item_id, "nothing liftable in revised[]"]); continue; }
  it.solver = s;
  touched.push([it.item_id, it.task_code, s.state]);
}
for (const [id, task, state] of touched) console.log("  LIFT  " + id + "  task " + task + "  -> solver " + state + "/2");
for (const [id, why] of skipped) console.log("  skip  " + id + "  " + why);
console.log("");

if (ONLY.length && touched.length !== ONLY.length) {
  console.error("REFUSING: " + ONLY.length + " item(s) named, " + touched.length + " lifted. " +
    "A named item that did not lift is a surprise, not a no-op.");
  process.exit(2);
}
if (!touched.length) { console.log("Nothing to lift."); process.exit(0); }

if (!APPLY) { console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

/* POST-CONDITION: only the named items' `solver` may differ. Checksum everything else. */
const before = JSON.parse(readFileSync(path, "utf8"));
const strip = (o) => (o.items || []).map((x) => {
  const c = JSON.parse(JSON.stringify(x)); delete c.solver; return c;
});
const { createHash } = await import("node:crypto");
const md5 = (v) => createHash("md5").update(JSON.stringify(v)).digest("hex");
const beforeRest = md5(strip(before));
const afterRest = md5(strip(j));
if (beforeRest !== afterRest) {
  console.error("REFUSING TO WRITE: something other than `solver` changed.");
  process.exit(2);
}
const untouchedSolvers = md5((before.items || []).filter((x) => !touched.some((t) => t[0] === x.item_id))
  .map((x) => x.solver || null));
const untouchedAfter = md5((j.items || []).filter((x) => !touched.some((t) => t[0] === x.item_id))
  .map((x) => x.solver || null));
if (untouchedSolvers !== untouchedAfter) {
  console.error("REFUSING TO WRITE: a solver outside the named set changed.");
  process.exit(2);
}
console.log("  post-condition: every field but the named items' `solver` is byte-identical");
writeFileSync(path, JSON.stringify(j, null, 1) + "\n");
console.log("  WROTE " + FILE + " -- " + touched.length + " solver record(s) lifted");
