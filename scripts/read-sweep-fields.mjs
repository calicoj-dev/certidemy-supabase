/**
 * read-sweep-fields.mjs -- print the ENGLISH field beside the TRANSLATED field
 * for a sweep class, so the member can be judged rather than counted.
 *
 * READ-ONLY. Unknown flags exit 2.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAllIn } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KNOWN = new Set(["--class", "--n", "--match", "--lang"]);
for (const a of process.argv.slice(2)) {
  if (!KNOWN.has(a.split("=")[0])) {
    console.error("unknown flag " + JSON.stringify(a) + " -- known: " + [...KNOWN].join(", "));
    process.exitCode = 2; process.exit();
  }
}
const arg = (n, d) => {
  const h = process.argv.slice(2).find((a) => a.startsWith(n + "="));
  return h ? h.slice(n.length + 1) : d;
};
const CLASS = arg("--class", "G4-term");
const N = Number(arg("--n", "8"));
const MATCH = arg("--match", null);
const LANG = arg("--lang", null);

const data = JSON.parse(readFileSync(join(ROOT, "ITEM-QUALITY-SWEEP.json"), "utf8"));
const hits = [];
for (const f of data.findings) {
  if (LANG && f.lang !== LANG) continue;
  for (const x of f.findings) {
    if (x.cls !== CLASS) continue;
    if (MATCH && !String(x.detail).includes(MATCH)) continue;
    hits.push({ row: f, x });
  }
}
if (!hits.length) { console.log("no members of " + CLASS + (MATCH ? " matching " + MATCH : "")); process.exit(0); }

/* spread across certifications */
const byCert = new Map();
for (const h of hits) { if (!byCert.has(h.row.cert)) byCert.set(h.row.cert, []); byCert.get(h.row.cert).push(h); }
const picked = [];
for (let i = 0; picked.length < N && i < 200; i++) {
  for (const c of [...byCert.keys()].sort()) {
    const l = byCert.get(c);
    if (l[i] && picked.length < N) picked.push(l[i]);
  }
}

const KEY = requireKey(HERE);
const groups = [...new Set(picked.map((p) => p.row.group))];
const rows = await getAllIn(KEY, "quiz_questions",
  "id,language,question_group_id,question_text,options,correct_answer,explanation", "question_group_id", groups);
const byId = new Map(rows.map((r) => [r.id, r]));
const enOf = new Map();
for (const r of rows) if (r.language === "en") enOf.set(r.question_group_id, r);

const fieldText = (row, field) => {
  if (!row) return null;
  if (field === "stem") return String(row.question_text || "");
  if (field === "explanation") return String(row.explanation || "");
  if (field.startsWith("option:")) {
    const id = field.slice(7);
    const o = (row.options || []).find((z) => z.id === id);
    return o ? String(o.text || "") : null;
  }
  return null;
};

console.log("READING " + picked.length + " of " + hits.length + " flags in class " + CLASS +
  (MATCH ? "  matching " + JSON.stringify(MATCH) : ""));
console.log("");
let i = 0;
for (const p of picked) {
  i++;
  const tr = byId.get(p.row.id), en = enOf.get(p.row.group);
  console.log("--- " + i + ". " + p.row.cert + " " + p.row.pool + " " + p.row.lang + "  field=" + p.x.field);
  console.log("    WHY: " + p.x.detail);
  const enT = String(fieldText(en, p.x.field) || "(absent)");
  const trT = String(fieldText(tr, p.x.field) || "(absent)");
  /* If the detail names a token, show the window AROUND it rather than the head
     of the field. A truncated view of a long explanation hides the very thing
     the flag is about, and judging a member from a window that cannot contain
     it is how a reading step turns into a second count. */
  const tok = (String(p.x.detail).match(/`([^`]+)`/) || [])[1];
  const window = (s) => {
    if (!tok) return s.slice(0, 420);
    const at = s.toLowerCase().indexOf(tok.toLowerCase());
    if (at < 0) return "[TOKEN NOT FOUND IN THIS FIELD] " + s.slice(0, 300);
    return (at > 140 ? "..." : "") + s.slice(Math.max(0, at - 140), at + 200);
  };
  console.log("    EN: " + (tok ? enT.slice(0, 300) : enT.slice(0, 420)));
  console.log("    TR: " + window(trT));
  console.log("");
}
