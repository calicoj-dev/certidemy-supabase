#!/usr/bin/env node
/**
 * PROMPT-104 s1: record the two R7 rejects in AIMSF-DIRECTOR-REJECTIONS.json.
 * They were never inserted, so there is no row to carry a verdict -- the file is the record.
 * `--apply` writes; dry by default. Unknown flags exit 2.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { itemIdOfStem } from "./lib/item-id.mjs";

const FILE = "AIMSF-DIRECTOR-REJECTIONS.json";
const ART = "AIMSF-R7-ALL.json";
let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default)."); process.exit(2);
}
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const NEW = [
  { id: "f0fc9c25", task: "1.2", ruled: "PROMPT-104 s1",
    why: "near-duplicate of the accepted 9cbef19e (1.2, \"It can hold several of the listed roles\") -- same task, same fact, a DIFFERENT anchor, so the enemy rule cannot keep them off one form. The near-duplicate gate compares stems and cannot see this." },
  { id: "262b5be7", task: "5.5", ruled: "PROMPT-104 s1",
    why: "too obscure for a Foundation candidate: ISO/IEC 17021-1 9.1.3.5 shift working is a procedural detail of the certification body's audit planning, not the certification route the task describes. We do not want impossible exams." },
];

const j = JSON.parse(readFileSync(join(ROOT, FILE), "utf8"));
if (!Array.isArray(j.rejections)) { console.error("REFUSING: " + FILE + " has no rejections array"); process.exit(2); }
const art = JSON.parse(readFileSync(join(ROOT, ART), "utf8"));
const byId = new Map((art.items || []).map((r) => [r.item_id, r]));

/* VALIDATE: each id is a real survivor of the artifact, and not already recorded. */
const have = new Set(j.rejections.map((r) => r.id));
const bad = [];
for (const n of NEW) {
  const r = byId.get(n.id);
  if (!r) { bad.push(n.id + ": not in " + ART); continue; }
  if (r.verdict !== "survivor") { bad.push(n.id + ": verdict is " + r.verdict + ", not survivor"); continue; }
  if (r.task_code !== n.task) { bad.push(n.id + ": artifact task " + r.task_code + ", ruled " + n.task); continue; }
  if (itemIdOfStem(r.item.question_text) !== n.id) { bad.push(n.id + ": stem hash does not match its own id"); continue; }
  if (have.has(n.id)) { bad.push(n.id + ": already recorded as rejected"); continue; }
}
console.log("R7 REJECTS: " + NEW.length + " ruled, " + bad.length + " unresolved");
for (const b of bad) console.log("   " + b);
if (bad.length) { console.error("REFUSING: nothing written."); process.exit(2); }
for (const n of NEW) console.log("   " + n.id + "  task " + n.task + "  " + n.why.slice(0, 90));

const before = j.rejections.length;
j.rejections = [...j.rejections, ...NEW];
if (!APPLY) { console.log("\nDRY RUN: rejections " + before + " -> " + j.rejections.length + ". Re-run with --apply."); process.exitCode = 0; }
else {
  writeFileSync(join(ROOT, FILE), JSON.stringify(j, null, 1) + "\n", "utf8");
  const back = JSON.parse(readFileSync(join(ROOT, FILE), "utf8"));
  const ids = new Set(back.rejections.map((r) => r.id));
  const missing = NEW.filter((n) => !ids.has(n.id));
  console.log("\nwrote " + FILE + "   rejections " + before + " -> " + back.rejections.length);
  if (back.rejections.length !== before + NEW.length || missing.length) {
    console.error("READ-BACK FAILED: " + missing.map((m) => m.id).join(",")); process.exitCode = 2;
  } else console.log("read back: both ids present, and no pre-existing entry lost (" + before + " kept).");
}
