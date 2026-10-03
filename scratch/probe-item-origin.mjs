#!/usr/bin/env node
/* Read-only. What item_origin do the grounded rows carry, and what does the column allow? */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "../scripts/_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const KEY = requireKey(join(HERE, "..", "scripts"));
const cert = (await getAll(KEY, "certifications?select=id&code=eq.AIMS-F"))[0];
const all = await getAll(KEY, "quiz_questions?select=id,language,status,pool,is_exam_scope,retired_at," +
  "item_origin,question_group_id&certification_id=eq." + cert.id + "&order=id");
const ig = new Set((await getAll(KEY, "item_grounding?select=question_id&order=question_id")).map((g) => g.question_id));
const enOf = (r) => r.language === "en" ? r
  : (r.question_group_id ? all.find((x) => x.question_group_id === r.question_group_id && x.language === "en") : null);
const grounded = (r) => { const en = enOf(r); return !!en && ig.has(en.id); };

const key = (v) => v === null || v === undefined ? "<NULL>" : String(v);
console.log("AIMS-F rows by item_origin x grounded, approved + secure + exam-scope + live only");
const tally = new Map();
for (const r of all) {
  if (!(r.status === "approved" && r.pool === "secure" && r.is_exam_scope === true && r.retired_at === null)) continue;
  const k = key(r.item_origin) + " | grounded=" + grounded(r) + " | " + r.language;
  tally.set(k, (tally.get(k) || 0) + 1);
}
for (const k of [...tally.keys()].sort()) console.log("  " + k.padEnd(46) + tally.get(k));

console.log("");
console.log("every distinct item_origin on this certification, any status:");
const t2 = new Map();
for (const r of all) { const k = key(r.item_origin); t2.set(k, (t2.get(k) || 0) + 1); }
for (const k of [...t2.keys()].sort()) console.log("  " + k.padEnd(20) + t2.get(k));

console.log("");
console.log("distinct item_origin across the WHOLE table (what the column is used for elsewhere):");
const other = await getAll(KEY, "quiz_questions?select=item_origin&limit=20000");
const t3 = new Map();
for (const r of other) { const k = key(r.item_origin); t3.set(k, (t3.get(k) || 0) + 1); }
for (const k of [...t3.keys()].sort()) console.log("  " + k.padEnd(20) + t3.get(k));
