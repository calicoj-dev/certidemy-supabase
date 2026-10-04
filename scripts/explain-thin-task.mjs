#!/usr/bin/env node
/**
 * READ-ONLY, NO MODEL CALLS. Why a task cannot reach its floor: its primaries, what is held against
 * each, the cap headroom per primary, and which of the two separate limits is biting.
 *
 * Ruled PROMPT-118 s4. There are TWO reasons a task is stuck and they need opposite actions:
 *
 *   the CAP        floor > (effective primaries x CAP). No number of rounds can close it; the map has
 *                  to grow or the floor has to come down.
 *   MIN_EFFECTIVE  the task has fewer than MIN_EFFECTIVE effective primaries. The arithmetic may allow
 *                  the floor -- two primaries at a cap of 2 is exactly 4 -- but every item would come
 *                  from one of two sentences, so the pipeline calls it a map question rather than work.
 *
 * Reporting the second as the first sends you looking for more items when what is missing is passages.
 *
 *   --cert=<CODE>   required
 *   --tasks=a,b     required: the tasks to explain
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { buildGateContext } from "./lib/gate-context.mjs";
import { CAP } from "./lib/anchor-cap.mjs";
import { classifyPrimaries, MIN_EFFECTIVE } from "./lib/effective-primary.mjs";
import { loadTaskFloors, floorFor } from "./lib/task-floors.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let CERT = null, TASKS = null;
for (const a of process.argv.slice(2)) {
  let m = a.match(/^--cert=(.+)$/); if (m) { CERT = m[1]; continue; }
  m = a.match(/^--tasks=(.+)$/); if (m) { TASKS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=, --tasks=. READ-ONLY.");
  process.exit(2);
}
if (!CERT || !TASKS) { console.error("--cert= and --tasks= are both required."); process.exit(2); }

const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const ctx = await buildGateContext(KEY, CERT);
const floors = loadTaskFloors(CERT);
const tasks = await getAll(KEY, "tasks?select=id,code&certification_id=eq." + cert.id + "&order=code");
const rows = await getAll(KEY, "quiz_questions?select=id,task_id,language,status,pool,is_exam_scope," +
  "retired_at,item_origin&certification_id=eq." + cert.id + "&retired_at=is.null&order=id");
const grounding = await getAll(KEY, "item_grounding?select=question_id,source_id,edition," +
  "key_support_clause,review_verdict&order=question_id");
const gByQ = new Map(grounding.map((g) => [g.question_id, g]));

console.log("WHY THESE TASKS CANNOT REACH FLOOR   " + CERT +
  "   (cap " + CAP + " per clause per task, MIN_EFFECTIVE " + MIN_EFFECTIVE + ")");
for (const code of TASKS) {
  const t = tasks.find((x) => x.code === code);
  if (!t) { console.log(""); console.log("  " + code + ": NO SUCH TASK on " + CERT); continue; }
  const map = ctx.mapByTask.get(t.id) || { primary: [], supporting: [] };
  console.log("");
  console.log("================ task " + code);
  /* effective classification, per (source, edition), exactly as check-task-map does it */
  const taskOfQ = new Map(rows.map((r) => [r.id, r.task_id]));
  let effective = 0;
  const lines = [];
  const groups = new Map();
  for (const p of map.primary) {
    const k = p.source_id + "|" + p.edition;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(p);
  }
  for (const [k, group] of groups) {
    const [src, ed] = k.split("|");
    const view = ctx.index.for(src, ed);
    const all = [...view.keys()];
    const res = classifyPrimaries(group.map((p) => String(p.clause)),
      (c) => view.get(String(c)) || null, all);
    for (const r of res) {
      if (r.effective) effective++;
      const held = grounding.filter((g) => taskOfQ.get(g.question_id) === t.id &&
        g.source_id === src && String(g.edition) === String(ed) &&
        String(g.key_support_clause) === String(r.clause)).length;
      const p = view.get(String(r.clause));
      lines.push({ src, ed, clause: String(r.clause), effective: r.effective,
        why: r.why || r.reason || "",
        words: p ? String(p.text || "").trim().split(/\s+/).length : 0, held });
    }
  }
  const f = floorFor(code, floors, effective);
  const heldEn = rows.filter((r) => r.task_id === t.id && r.language === "en" && gByQ.has(r.id) &&
    gByQ.get(r.id).review_verdict === "accept").length;
  console.log("  PRIMARIES mapped " + map.primary.length + ", supporting " + map.supporting.length +
    ", EFFECTIVE " + effective);
  console.log("    source / clause          words  effective  held  headroom  why");
  for (const l of lines) {
    console.log("    " + (l.src + " " + l.clause).padEnd(24) + String(l.words).padStart(6) +
      String(l.effective ? "yes" : "NO").padStart(11) + String(l.held).padStart(6) +
      String(Math.max(0, CAP - l.held)).padStart(10) + "  " + String(l.why).slice(0, 44));
  }
  const ceiling = effective * CAP;
  console.log("  floor " + f.floor + "   (" + f.why + ")");
  console.log("  held (accepted grounded, en) " + heldEn);
  console.log("  cap ceiling = effective x " + CAP + " = " + ceiling);
  console.log("");
  const capBites = ceiling < f.floor;
  const thinBites = effective < MIN_EFFECTIVE;
  if (capBites) {
    console.log("  THE CAP BITES: the floor of " + f.floor + " is above the " + ceiling +
      " items the map can carry. More rounds cannot close it.");
  } else {
    console.log("  THE CAP DOES NOT BITE: " + ceiling + " items fit, and the floor is " + f.floor + ".");
  }
  if (thinBites) {
    console.log("  MIN_EFFECTIVE BITES: " + effective + " effective primary(ies) against a minimum of " +
      MIN_EFFECTIVE + ". Every item would come from one of " + effective + " sentences, which is why");
    console.log("  the pipeline calls this a MAP question rather than work -- even where the arithmetic allows the floor.");
  }
  if (!capBites && !thinBites) console.log("  NEITHER LIMIT BITES: this task is short on items, not on map.");
}
