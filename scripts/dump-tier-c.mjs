/**
 * dump-tier-c.mjs -- print the English and Spanish of every Tier C item so the
 * fixes can be drafted against the live text rather than from the review note.
 *
 * READ-ONLY. Unknown flags exit 2.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
for (const a of process.argv.slice(2)) {
  console.error("unknown flag " + JSON.stringify(a)); process.exitCode = 2; process.exit();
}

const TIER_C = [
  ["85", "7312ac33", "option a: confident -> confiable, should be segura"],
  ["130", "64495519", "vendor and provider both proveedor"],
  ["113", "df6bafc6", "vendor and provider both proveedor"],
  ["119", "5fe28afb", "readiness -> disponibilidad, should be preparacion"],
  ["114", "c330fb40", "distinct -> distintivo, should be distinto"],
  ["103", "4b5d4ed5", "sensitive -> confidenciales, breaks distractor d"],
  ["170", "7df0197d", "recourse -> recursos"],
  ["207", "c94769f9", "most directly -> de manera mas incorrecta"],
  ["25", "f02f62e3", "se deferentan"],
  ["322", "04be5971", "malrepresenta"],
  ["328", "8ce51417", "autogestirse"],
  ["336", "6dc29170", "Defer al Product Owner"],
  ["93", "2cc60850", "dejando a ninguna persona"],
  ["184", "1a568ec2", "la Respeto"],
  ["187", "499c3a66", "missing question marks"],
  ["277", "a6477254", "rango for rank"],
  ["289", "41611b9c", "rango for rank"],
  ["41", "0bf3f292", "coincide con patrones"],
  ["224", "40d5d539", "inserted debe (key)"],
  ["309", "5a5917ca", "inserted debe (stem); also drops next"],
  ["161", "16d3e0c9", "(deskilling) only in the key"],
  ["112", "26cde04c", "added continua"],
  ["231", "e8f2dd0c", "DoD spelled out only in the key"],
];

const KEY = requireKey(HERE);
const rows = await getAll(KEY,
  "quiz_questions?select=id,language,question_group_id,question_text,options,correct_answer,explanation&order=id");
const byId = new Map(rows.map((r) => [r.id, r]));
const enOf = new Map();
for (const r of rows) if (r.language === "en") enOf.set(r.question_group_id, r);

const opt = (q) => (q && Array.isArray(q.options) ? q.options : []).map((o) => o.id + ") " + String(o.text || "")).join("\n      ");

let missing = 0;
for (const [n, pre, note] of TIER_C) {
  const hits = rows.filter((r) => r.id.startsWith(pre));
  if (hits.length !== 1) { console.log("### #" + n + " " + pre + "  RESOLVED " + hits.length + " ROWS -- skipped"); missing++; continue; }
  const tr = hits[0], en = enOf.get(tr.question_group_id);
  console.log("### #" + n + "  " + pre + "  [" + tr.language + "]  " + note);
  console.log("  KEY " + JSON.stringify(tr.correct_answer) + "   group " + tr.question_group_id.slice(0, 8));
  console.log("  EN STEM: " + String((en && en.question_text) || "(none)").replace(/\s+/g, " "));
  console.log("  TR STEM: " + String(tr.question_text || "").replace(/\s+/g, " "));
  console.log("  EN OPTS:\n      " + opt(en));
  console.log("  TR OPTS:\n      " + opt(tr));
  console.log("  EN EXPL: " + String((en && en.explanation) || "").replace(/\s+/g, " ").slice(0, 420));
  console.log("  TR EXPL: " + String(tr.explanation || "").replace(/\s+/g, " ").slice(0, 420));
  console.log("");
}
console.log("resolved " + (TIER_C.length - missing) + " of " + TIER_C.length);
