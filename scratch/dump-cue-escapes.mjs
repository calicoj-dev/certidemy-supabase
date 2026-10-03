#!/usr/bin/env node
/* Read-only. For each uuid prefix: the cue arithmetic and every option with its length. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "../scripts/_pg.mjs";
import { gateItemOf } from "../scripts/lib/stored-item.mjs";
import { cueConfigFor, keyLengthEscape } from "../scripts/lib/item-cue-guard.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let CERT = "AIMS-F";
const WANT = [];
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--cert=(.+)$/);
  if (m) { CERT = m[1]; continue; }
  if (a.startsWith("--")) { console.error("Unrecognised flag: " + a); process.exit(2); }
  WANT.push(a);
}
const KEY = requireKey(join(HERE, "..", "scripts"));
const cert = (await getAll(KEY, "certifications?select=id,exam_blueprint&code=eq." + CERT))[0];
const cfg = cueConfigFor(cert.exam_blueprint);
const rows = await getAll(KEY, "quiz_questions?select=id,question_text,options,correct_answer,explanation," +
  "task_id&certification_id=eq." + cert.id + "&language=eq.en&retired_at=is.null&order=id");
const tasks = await getAll(KEY, "tasks?select=id,code&order=code");
const tcode = new Map(tasks.map((t) => [t.id, t.code]));

for (const p of WANT) {
  const r = rows.find((x) => String(x.id).startsWith(p));
  if (!r) { console.log("\n!! no row for " + p); continue; }
  const esc = keyLengthEscape(r, cfg);
  const gi = gateItemOf(r);
  const keyId = (r.correct_answer || [])[0];
  console.log("\n==== " + p + "   task " + tcode.get(r.task_id) + "   key=" + keyId +
    "   key " + esc.keyLen + " vs rival " + esc.maxRival + ", allowed +" + esc.allowed +
    ", OVER BY " + (esc.over - esc.allowed));
  console.log("   TARGET: key <= " + (esc.maxRival + esc.allowed) + " chars (or raise the longest rival)");
  console.log("   Q: " + String(r.question_text).replace(/\s+/g, " "));
  for (const o of r.options || []) {
    console.log("     " + o.id + (o.id === keyId ? " *" : "  ") + " (" + String(o.text).length + ") " +
      String(o.text).replace(/\s+/g, " "));
  }
}
