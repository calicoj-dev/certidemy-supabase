/* IS THE SURVIVOR COUNT A MEASUREMENT OF THE ITEMS, OR OF THE TASK MAP?
 *
 * Five of five sampled drops read as correct items flagged for a passage-scoping reason, so the question
 * is no longer whether there is an artifact -- it is how big it is. This counts, for every item dropped
 * on the anchoring model alone:
 *
 *   (a) does the reason name a source the LIBRARY HOLDS?  The instrument already appends that sentence
 *       itself, so this is reading its own third state rather than re-deriving one.
 *   (b) is the clause it names present in task_sources for that task as SUPPORTING -- i.e. linked, just
 *       not primary, which is exactly what the AIMS-F ruling produced?
 *
 * If (a) is most of the 95 then the shortfall of 156 is not a bill for regeneration. Generating against
 * it would spend ~780 model calls replacing items that are sound, and retire a third of a live bank for
 * a bookkeeping reason -- the conservative error that nobody investigates because a refusal looks like
 * rigour. */
import { readFileSync } from "node:fs";
import { requireKey, getAll } from "file:///C:/Users/Juan/Documents/certidemy/supabase/scripts/_pg.mjs";
const R = "C:/Users/Juan/Documents/certidemy/supabase/";
const j = JSON.parse(readFileSync(R + "ANCHOR-OR-FLAG-AIMS-F-all-secure.json", "utf8"));
const lib = JSON.parse(readFileSync(R + "SOURCE-PASSAGES.json", "utf8"));

const noGate = (it) => !(it.gates || []).some((g) => g.pass === false);
const flags = j.items.filter((it) => it.state === "flag" && noGate(it));
const unheld = j.items.filter((it) => it.state === "cannot-be-checked");

/* (a) the instrument's own third state, read rather than re-derived */
const HELD = /the library HOLDS/i;
const namesHeld = flags.filter((it) => HELD.test(String(it.reason || "")));
console.log("items dropped on the anchoring model alone : " + flags.length);
console.log("  ...whose reason says the library HOLDS the source: " + namesHeld.length);
console.log("  ...whose reason does not say so                  : " + (flags.length - namesHeld.length));
console.log("separately, cannot-be-checked (source genuinely unheld): " + unheld.length);

/* which sources the 95 actually rest on */
const srcOf = (s) => {
  const t = String(s);
  for (const [re, name] of [
    [/42001/, "ISO/IEC 42001"], [/19011/, "ISO 19011"], [/17021/, "ISO/IEC 17021-1"],
    [/42006/, "ISO/IEC 42006"], [/2024\/1689|EU AI Act/i, "EU AI Act"], [/27001/, "ISO/IEC 27001"],
    [/27002/, "ISO/IEC 27002"], [/31000/, "ISO 31000"], [/27005/, "ISO/IEC 27005"],
    [/22989/, "ISO/IEC 22989"], [/GDPR/i, "GDPR"], [/Annex SL|Directives Part 1/i, "ISO/IEC Directives Annex SL"],
    [/ISO 9000|ISO 9001/, "ISO 9000/9001"], [/NIST/i, "NIST AI RMF"], [/ITIL/i, "ITIL 4"],
  ]) if (re.test(t)) return name;
  return "(no source named)";
};
const inLib = new Set(lib.passages.map((x) => x.source_id));
const t1 = {};
for (const it of flags) { const k = srcOf(it.rests_on || it.reason); t1[k] = (t1[k] || 0) + 1; }
console.log("\nthe source the key rests on, for the 95:");
for (const [k, v] of Object.entries(t1).sort((a, b) => b[1] - a[1])) {
  console.log("  " + String(v).padStart(3) + "  " + k + (inLib.has(k) ? "   [IN THE LIBRARY]" : "   [not indexed]"));
}

/* (b) linked-but-supporting: does the task carry ANY supporting row at all? */
const KEY = requireKey(R + "scripts");
const certs = await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F");
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code")).filter(
  (t) => t.certification_id === certs[0].id);
const codeById = new Map(tasks.map((t) => [t.id, t.code]));
const ts = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id,passage_id");
const byTask = new Map();
for (const r of ts) {
  const c = codeById.get(r.task_id);
  if (!c) continue;
  if (!byTask.has(c)) byTask.set(c, { primary: 0, supporting: 0 });
  byTask.get(c)[r.role === "primary" ? "primary" : "supporting"]++;
}
console.log("\nAIMS-F task_sources by role (the set the anchoring pass draws from):");
let pTot = 0, sTot = 0;
for (const t of tasks.sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, { numeric: true }))) {
  const r = byTask.get(t.code) || { primary: 0, supporting: 0 };
  pTot += r.primary; sTot += r.supporting;
}
console.log("  primary rows total    : " + pTot);
console.log("  supporting rows total : " + sTot);
console.log("  tasks with 0 supporting: " +
  tasks.filter((t) => !(byTask.get(t.code) || {}).supporting).length + " of " + tasks.length);

/* the decisive cross-tab: drop rate against how many primaries the task has */
console.log("\ndrop rate against the size of the task's PRIMARY map:");
const rows = [];
for (const t of tasks) {
  const mine = j.items.filter((it) => it.task === t.code);
  if (!mine.length) continue;
  const dropped = mine.filter((it) => it.state === "flag" && noGate(it)).length;
  const r = byTask.get(t.code) || { primary: 0, supporting: 0 };
  rows.push({ code: t.code, prim: r.primary, supp: r.supporting, n: mine.length, dropped });
}
rows.sort((a, b) => a.prim - b.prim);
console.log("  task  primary supporting  items  model-flagged");
for (const r of rows) {
  console.log("  " + r.code.padEnd(5) + " " + String(r.prim).padStart(7) + " " +
    String(r.supp).padStart(10) + " " + String(r.n).padStart(6) + " " + String(r.dropped).padStart(14));
}
const lo = rows.filter((r) => r.prim <= 4), hi = rows.filter((r) => r.prim >= 8);
const rate = (a) => a.length ? (a.reduce((s, r) => s + r.dropped, 0) / a.reduce((s, r) => s + r.n, 0) * 100).toFixed(1) : "n/a";
console.log("\n  tasks with <=4 primary passages : " + rate(lo) + "% model-flagged  (" + lo.length + " tasks)");
console.log("  tasks with >=8 primary passages : " + rate(hi) + "% model-flagged  (" + hi.length + " tasks)");
