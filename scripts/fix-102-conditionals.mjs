#!/usr/bin/env node
/**
 * PROMPT-102 s1: the two conditional items. Re-quote 9ecce8e5's anchor; shorten 4c69db20's
 * distractors to the key's length. Re-gates both from the DB before and after.
 * WRITES with `--apply`; dry by default. Unknown flags exit 2.
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { runCodeGates, groundedGateControls } from "./lib/grounded-gates.mjs";
import { gateItemOf, id8, storedItemControls } from "./lib/stored-item.mjs";
import { cueConfigFor } from "../functions/_shared/item-rules/item-cue-guard.mjs";

const CERT = "AIMS-F";
let APPLY = false;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply (dry by default).");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

for (const [label, c] of [["gates", groundedGateControls()], ["adapter", storedItemControls()]]) {
  if (c.fails.length) { console.error("REFUSING: " + label + " controls fail: " + JSON.stringify(c.fails).slice(0, 300)); process.exit(2); }
  console.log(label + " controls: " + c.examined + " cases, all pass");
}

/* ---- THE FIXES, declared as data so the write and the re-gate read the same thing ----
 * The anchor text is READ FROM THE LIBRARY, never quoted here: check-licensed-text caught an inline
 * copy of A.9.3 in this file. It is pinned by hash, so a library change refuses rather than re-quotes. */
const A93_SHA16 = "08a1dce0daaae127";
const A93_LEN = 99;
/* Each distractor stays wrong for its OWN reason: (a) drops the org's documentation duty,
 * (b) ignores risk proportionality, (c) denies that corrective action with a supplier exists. */
const SHORT_4C69 = {
  a: "Skip documenting the integration, because the vendor documents its own product.",
  b: "Apply one identical monitoring regime to every supplier, whatever the risk.",
  c: "Replace the model, since corrective action cannot be pursued with a supplier.",
};

const lib = JSON.parse(readFileSync(join(ROOT, "SOURCE-PASSAGES.json"), "utf8"));
const a93 = lib.passages.find((p) => p.source_id === "ISO/IEC 42001" && p.clause === "A.9.3");
const CLEAN_A93 = String(a93 && a93.text || "").trim();
const sha16 = createHash("sha256").update(CLEAN_A93).digest("hex").slice(0, 16);
if (!a93 || sha16 !== A93_SHA16 || CLEAN_A93.length !== A93_LEN) {
  console.error("REFUSING: the library's A.9.3 is not the passage this fix was ruled against.");
  console.error("  expected sha256/16 " + A93_SHA16 + " len " + A93_LEN + ", got " + sha16 + " len " + CLEAN_A93.length);
  process.exit(2);
}
const annexGaps = lib.annex_gaps || [];
const sequenceGaps = lib.sequence_gaps || [];
let declaredGaps = [];
try {
  const compl = JSON.parse(readFileSync(join(ROOT, "LIBRARY-COMPLETENESS.json"), "utf8"));
  declaredGaps = (compl.sources || []).map((s) => ({ holes: s.missing || [] }));
} catch { console.log("  LIBRARY-COMPLETENESS.json absent"); }
const passagesByKey = new Map(lib.passages
  .filter((p) => p.source_id === "ISO/IEC 42001" && p.edition === "2023").map((p) => [p.clause, p]));

const leakMod = await import("./lib/leak-score.mjs");
let leakSources = null;
try { leakSources = leakMod.buildSources(); } catch (e) {
  console.error("REFUSING: leak index would not build -- every item would be UNASSERTED on reproduction. " + String(e.message).slice(0, 120));
  process.exit(3);
}
console.log("  leak index: " + leakSources.size + " documents");

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const certRow = (await getAll(KEY, "certifications?select=id,exam_blueprint&code=eq." + CERT))[0];
const cid = certRow.id;
const cueCfg = cueConfigFor(certRow.exam_blueprint);
const tasks = (await getAll(KEY, "tasks?select=id,certification_id,code&order=code")).filter((t) => t.certification_id === cid);
const codeOfTask = new Map(tasks.map((t) => [t.id, t.code]));
const taskIdOfCode = new Map(tasks.map((t) => [t.code, t.id]));
const tsRows = await getAll(KEY, "task_sources?select=task_id,passage_id,role&order=task_id");
const pById = new Map((await getAll(KEY, "source_passages?select=id,clause&order=id")).map((r) => [r.id, r.clause]));
const mapByTask = new Map();
for (const r of tsRows) {
  if (!mapByTask.has(r.task_id)) mapByTask.set(r.task_id, { primary: [], supporting: [] });
  const c = pById.get(r.passage_id);
  if (c) mapByTask.get(r.task_id)[r.role].push(c);
}
const primaryOf = (code) => (mapByTask.get(taskIdOfCode.get(code)) || {}).primary || [];
const supportingOf = (code) => (mapByTask.get(taskIdOfCode.get(code)) || {}).supporting || [];

const qs = await getAll(KEY, "quiz_questions?select=id,question_text,options,correct_answer,explanation," +
  "task_id,status,visibility,is_exam_scope&certification_id=eq." + cid + "&language=eq.en&retired_at=is.null&order=id");
const gs = await getAll(KEY, "item_grounding?select=question_id,key_support,key_support_clause&order=question_id");
const gOf = new Map(gs.map((g) => [g.question_id, g]));
const liveByTask = new Map();
for (const r of qs) {
  if (!liveByTask.has(r.task_id)) liveByTask.set(r.task_id, []);
  liveByTask.get(r.task_id).push({ id: id8(r), stem: r.question_text || "" });
}

const pick = (pre) => {
  const hits = qs.filter((q) => q.id.startsWith(pre));
  if (hits.length !== 1) { console.error("REFUSING: " + pre + " resolves to " + hits.length + " rows"); process.exit(2); }
  return hits[0];
};
const gate = (row, overrides = {}) => {
  const g = gOf.get(row.id);
  const item = gateItemOf({ ...row, ...overrides });
  const code = codeOfTask.get(row.task_id);
  return runCodeGates({ ...item, key_support: overrides.key_support ?? g.key_support,
    key_support_clause: g.key_support_clause, explanation: row.explanation }, {
    passagesByKey, annexGaps, sequenceGaps: [...sequenceGaps, ...declaredGaps], cert: CERT, cueCfg,
    primaryClauses: primaryOf(code), supportingClauses: supportingOf(code),
    sources: leakSources, leak: leakMod,
    liveStemsForTask: (liveByTask.get(row.task_id) || []).filter((x) => x.id !== id8(row)),
  });
};
const show = (label, r) => {
  console.log("  " + label + "  passed=" + r.passed +
    (r.failed.length ? "  FAILED[" + r.failed.join(",") + "]" : "") +
    (r.unasserted.length ? "  UNASSERTED[" + r.unasserted.join(",") + "]" : ""));
  for (const g of r.gates) if (g.pass === false) console.log("      " + g.id + ": " + String(g.reason).slice(0, 160));
};

const rowA = pick("9ecce8e5"), rowB = pick("4c69db20");
const newOptsB = rowB.options.map((o) => (SHORT_4C69[o.id] ? { ...o, text: SHORT_4C69[o.id] } : o));

console.log("\n=== BEFORE ===");
show("9ecce8e5", gate(rowA));
show("4c69db20", gate(rowB));
console.log("\n=== AFTER (simulated) ===");
const afterA = gate(rowA, { key_support: CLEAN_A93 });
const afterB = gate(rowB, { options: newOptsB });
show("9ecce8e5", afterA);
show("4c69db20", afterB);

const wc = (t) => (String(t).trim().match(/\S+/g) || []).length;
console.log("\n4c69db20 option lengths after: " + newOptsB.map((o) => o.id + "=" + wc(o.text) + "w").join("  ") +
  "   (key is " + rowB.correct_answer.join(",") + ")");

if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exitCode = 0; }
else {
  if (!afterA.passed || !afterB.passed) {
    console.error("\nREFUSING TO WRITE: a fix does not clear the gates. Nothing written.");
    process.exit(2);
  }
  const r1 = await fetch(REST_URL + "/item_grounding?question_id=eq." + rowA.id,
    { method: "PATCH", headers: H, body: JSON.stringify({ key_support: CLEAN_A93 }) });
  if (!r1.ok) { console.error("9ecce8e5 PATCH failed HTTP " + r1.status + " " + (await r1.text()).slice(0, 200)); process.exit(2); }
  const r2 = await fetch(REST_URL + "/quiz_questions?id=eq." + rowB.id, {
    method: "PATCH", headers: H,
    body: JSON.stringify({ options: newOptsB, status: rowB.status, visibility: rowB.visibility, is_exam_scope: rowB.is_exam_scope }),
  });
  if (!r2.ok) { console.error("4c69db20 PATCH failed HTTP " + r2.status + " " + (await r2.text()).slice(0, 200)); process.exit(2); }

  /* READ BACK, both rows, and re-gate from what is now stored rather than from what was sent. */
  const qs2 = await getAll(KEY, "quiz_questions?select=id,question_text,options,correct_answer,explanation," +
    "task_id,status,visibility,is_exam_scope&certification_id=eq." + cid + "&language=eq.en&retired_at=is.null&order=id");
  const gs2 = await getAll(KEY, "item_grounding?select=question_id,key_support,key_support_clause&order=question_id");
  for (const g of gs2) gOf.set(g.question_id, g);
  const a2 = qs2.find((q) => q.id === rowA.id), b2 = qs2.find((q) => q.id === rowB.id);
  console.log("\n=== READ BACK ===");
  console.log("  9ecce8e5 key_support: " + JSON.stringify(gOf.get(a2.id).key_support));
  console.log("  4c69db20 status=" + b2.status + " visibility=" + b2.visibility + " is_exam_scope=" + b2.is_exam_scope);
  for (const o of b2.options) console.log("    " + o.id + " (" + wc(o.text) + "w) " + o.text);
  show("9ecce8e5", gate(a2));
  show("4c69db20", gate(b2));
  const ok = gate(a2).passed && gate(b2).passed;
  console.log(ok ? "\nBOTH CLEAR THE GATES. Record verdicts with record-102-verdicts.mjs --phase=conditional --apply"
    : "\nPOST-CONDITION FAILED: a row does not clear the gates after the write.");
  if (!ok) process.exitCode = 2;
}
