#!/usr/bin/env node
/* An insert run WITHOUT --reuse-solver stamps a fresh solver verdict over the one the item was
 * approved on. This restores the approved verdict from the artifact the director read -- the record,
 * not a re-judgement. Refuses where the artifact's disposition is not `survivor`. --apply to write. */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const ARGS = process.argv.slice(2);
let APPLY = false, FILE = null, CERT = null, IDS = [];
for (const a of ARGS) {
  if (a === "--apply") { APPLY = true; continue; }
  let m;
  if ((m = /^--from=(.+)$/.exec(a))) { FILE = m[1]; continue; }
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--ids=(.+)$/.exec(a))) { IDS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  console.error("unrecognised flag: " + a);
  console.error("this script opts into WRITING: --apply (dry by default).");
  console.error("  --from=<artifact> --cert=<CODE> --ids=a,b");
  process.exit(2);
}
if (!FILE || !CERT || !IDS.length) { console.error("--from, --cert and --ids are all required."); process.exit(2); }

/* jsonb does not preserve key order, so a correct write reads back as a JSON.stringify mismatch.
 * Every comparison here is canonical: keys sorted at every depth. */
function canon(v) {
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (v && typeof v === "object") {
    return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  }
  return JSON.stringify(v === undefined ? null : v);
}

const art = JSON.parse(readFileSync(join(ROOT, FILE), "utf8"));
const rec = new Map((art.items || []).map((r) => [r.item_id, r]));
const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };

const cert = (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0];
const qs = await getAll(KEY, "quiz_questions?select=id,question_text&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const gr = new Map((await getAll(KEY,
  "item_grounding?select=question_id,solver&order=question_id")).map((g) => [g.question_id, g]));

const plan = [], bad = [];
for (const id of IDS) {
  const r = rec.get(id);
  if (!r) { bad.push(id + ": not in " + FILE); continue; }
  if (r.verdict !== "survivor") { bad.push(id + ": artifact verdict is " + r.verdict + ", not survivor"); continue; }
  if (!r.solver || r.solver.state !== "accepted") { bad.push(id + ": no accepted solver verdict recorded"); continue; }
  const hits = qs.filter((q) => itemIdOfStem(q.question_text) === id);
  if (hits.length !== 1) { bad.push(id + ": resolves to " + hits.length + " bank row(s)"); continue; }
  const g = gr.get(hits[0].id);
  if (!g) { bad.push(id + ": no item_grounding row"); continue; }
  const same = canon(g.solver) === canon(r.solver);
  plan.push({ id, qid: hits[0].id, live: g.solver, want: r.solver, same });
}
for (const b of bad) console.log("  " + b);
if (bad.length) { console.error("REFUSING: nothing written."); process.exit(2); }

for (const p of plan) {
  console.log(p.id + "  " + (p.same ? "already the approved verdict, no write" : "DIFFERS -> restoring"));
  if (!p.same) {
    console.log("    live: " + JSON.stringify(p.live).slice(0, 120));
    console.log("    read: " + JSON.stringify(p.want).slice(0, 120));
  }
}
const todo = plan.filter((p) => !p.same);
console.log(plan.length + " examined, " + todo.length + " to restore");
if (!APPLY) { console.log("DRY. Nothing written. --apply to write."); process.exit(0); }

let wrote = 0;
for (const p of todo) {
  const res = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.qid,
    { method: "PATCH", headers: { ...H, Prefer: "return=representation" }, body: JSON.stringify({ solver: p.want }) });
  if (!res.ok) { console.error("  PATCH failed for " + p.id + ": " + res.status + " " + (await res.text()).slice(0, 200)); process.exitCode = 1; continue; }
  const back = (await res.json())[0];
  if (canon(back.solver) !== canon(p.want)) { console.error("  READ BACK MISMATCH for " + p.id); process.exitCode = 1; continue; }
  wrote++;
}
/* post-condition, both directions: what we restored now matches, and what we did not touch is unchanged. */
const after = new Map((await getAll(KEY,
  "item_grounding?select=question_id,solver&order=question_id")).map((g) => [g.question_id, g]));
let okRestored = 0, okUntouched = 0, fail = 0;
for (const p of plan) {
  const now = after.get(p.qid);
  if (canon(now.solver) !== canon(p.want)) { console.error("  POST-CONDITION: " + p.id + " is not the approved verdict"); fail++; continue; }
  if (p.same) okUntouched++; else okRestored++;
}
console.log("restored " + wrote + "; post-condition: " + okRestored + " now approved, " +
  okUntouched + " untouched and already approved, " + fail + " wrong");
if (fail) process.exitCode = 1;
