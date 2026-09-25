/**
 * read-sweep-examples.mjs -- READ the members of a sweep class.
 *
 * A COUNT IS READ BEFORE IT IS REPORTED. Every instrument error this repository
 * found in the last week was caught by reading the members, and not one by
 * reasoning about the design. This is the reading step, not a second count.
 *
 * READ-ONLY. Unknown flags exit 2.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAllIn } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

const KNOWN = new Set(["--class", "--n", "--field", "--secure-only"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a.split("=")[0])) {
    console.error("unknown flag " + JSON.stringify(a) + " -- read-only, known: " + [...KNOWN].join(", "));
    process.exitCode = 2; process.exit();
  }
}
const arg = (n, d) => {
  const h = process.argv.slice(2).find((a) => a.startsWith(n + "="));
  return h ? h.slice(n.length + 1) : d;
};

const CLASS = arg("--class", "cue-introduced/secure");
const N = Number(arg("--n", "10"));

const data = JSON.parse(readFileSync(join(ROOT, "ITEM-QUALITY-SWEEP.json"), "utf8"));
const hits = data.findings.filter((f) => f.findings.some((x) => x.cls === CLASS));
if (!hits.length) {
  console.log("CLASS " + CLASS + " has no members. Nothing to read.");
  process.exit(0);
}

/* Spread the sample across certifications rather than taking the first N, which
   would report one certification's habit as the class. */
const byCert = new Map();
for (const h of hits) {
  if (!byCert.has(h.cert)) byCert.set(h.cert, []);
  byCert.get(h.cert).push(h);
}
const picked = [];
const certs = [...byCert.keys()].sort();
for (let i = 0; picked.length < N && i < 50; i++) {
  for (const c of certs) {
    const list = byCert.get(c);
    if (list[i] && picked.length < N) picked.push(list[i]);
  }
}

const KEY = requireKey(HERE);
const ids = picked.map((p) => p.id);
const groups = [...new Set(picked.map((p) => p.group))];
const rows = await getAllIn(KEY, "quiz_questions",
  "id,language,question_group_id,question_text,options,correct_answer,explanation,pool",
  "question_group_id", groups);
const byId = new Map(rows.map((r) => [r.id, r]));
const enOf = new Map();
for (const r of rows) if (r.language === "en") enOf.set(r.question_group_id, r);

console.log("READING " + picked.length + " of " + hits.length + " members of class " + CLASS);
console.log("sampled across " + certs.length + " certification(s): " + certs.join(", "));
console.log("");

const txt = (o) => (o || []).map((x) => x.id + ") " + String(x.text || "")).join("\n      ");
const lens = (o, key) => (o || []).map((x) => x.id + "=" + String(x.text || "").trim().length + (key.includes(x.id) ? "*" : "")).join(" ");

let i = 0;
for (const p of picked) {
  i++;
  const tr = byId.get(p.id), en = enOf.get(p.group);
  console.log("--- " + i + ". " + p.cert + " " + p.pool + " " + p.lang + "  " + p.id);
  for (const f of p.findings.filter((x) => x.cls === CLASS)) console.log("    WHY: " + f.detail);
  if (!en || !tr) { console.log("    (row or English sibling not retrieved)"); continue; }
  console.log("    EN key/lengths: " + lens(en.options, en.correct_answer || []));
  console.log("    TR key/lengths: " + lens(tr.options, tr.correct_answer || []));
  console.log("    EN stem: " + String(en.question_text || "").slice(0, 200));
  console.log("    TR stem: " + String(tr.question_text || "").slice(0, 200));
  console.log("    EN options:");
  console.log("      " + txt(en.options).slice(0, 900));
  console.log("    TR options:");
  console.log("      " + txt(tr.options).slice(0, 900));
  console.log("");
}
void ids;
