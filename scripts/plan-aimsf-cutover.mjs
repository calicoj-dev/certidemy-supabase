#!/usr/bin/env node
/**
 * READ-ONLY. Measures the AIMS-F exam pool and what a cutover would do. No `--apply` exists.
 *
 * The filter is `generate-mock-exam`'s own, transcribed from its candidate query and applied one
 * predicate at a time, so each one's cost is visible rather than inferred.
 *
 * The enemy rule and the stem identity are IMPORTED from the shared modules the function uses.
 * `pickAcrossTasksBalanced` is local to the Deno function and is NOT reimplemented: what is reported
 * is a BOUND -- per-domain availability and distinct-enemy capacity against quota. A bound clearing
 * quota with margin is sound; a tight one is reported as needing the real selector.
 */
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { enemyKeyOf } from "../functions/_shared/item-rules/enemy-rule.mjs";
import { itemIdOfStem as itemId } from "./lib/item-id.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
let CERT = null, FORMS = 20;
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--(cert|forms)=(.+)$/);
  if (m) { if (m[1] === "cert") CERT = m[2]; else FORMS = Number(m[2]); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --cert=<CODE>, --forms=<n>. READ-ONLY, no --apply.");
  process.exit(2);
}

if (!CERT) {
  /* NO CERTIFICATION DEFAULT (PROMPT-135 s3). This defaulted to a literal, so a caller that
   * forgot --cert operated on a different certification and said nothing. */
  console.error("--cert=<CODE> is required. plan-aimsf-cutover.mjs used to default to a single\n" +
    "certification, which is how the rollback command came to offer AIMS-F after an ISMS-IA cutover.");
  process.exit(2);
}
const LANGS = ["en", "es-419", "pt-BR"];
const KEY = requireKey(HERE);

const cert = (await getAll(KEY, "certifications?select=id,code,num_questions,exam_blueprint&code=eq." + CERT))[0];
if (!cert) { console.error("No certification " + CERT); process.exit(2); }
const TARGET = cert.num_questions ?? 40;

const all = await getAll(KEY, "quiz_questions?select=id,language,status,pool,is_exam_scope,retired_at," +
  "item_origin,task_id,question_group_id,question_text,options,correct_answer,difficulty" +
  "&certification_id=eq." + cert.id + "&order=id");
const ig = new Map((await getAll(KEY, "item_grounding?select=question_id,review_verdict,key_support_clause," +
  "source_id,edition&order=question_id")).map((g) => [g.question_id, g]));
const tasks = (await getAll(KEY, "tasks?select=id,code,domain_id,certification_id&order=code"))
  .filter((t) => t.certification_id === cert.id);
const domains = (await getAll(KEY, "domains?select=id,code,weight_pct,certification_id&order=code"))
  .filter((d) => d.certification_id === cert.id);
const domainByTask = new Map(tasks.map((t) => [t.id, t.domain_id]));
const taskCode = new Map(tasks.map((t) => [t.id, t.code]));

/* ---------- allocateByWeight, transcribed from generate-mock-exam:596 (deterministic) ---------- */
function allocateByWeight(doms, total) {
  const sum = doms.reduce((s, d) => s + d.weight_pct, 0) || 1;
  const floored = doms.map((d) => {
    const raw = (d.weight_pct / sum) * total;
    return { id: d.id, n: Math.floor(raw), rem: raw - Math.floor(raw) };
  });
  let assigned = floored.reduce((s, f) => s + f.n, 0);
  const order = [...floored].sort((a, b) => b.rem - a.rem);
  let i = 0;
  while (assigned < total && order.length > 0) { order[i % order.length].n += 1; assigned += 1; i += 1; }
  return new Map(floored.map((f) => [f.id, f.n]));
}
const alloc = allocateByWeight(domains, TARGET);

/* ---------- 1. THE FILTER, one predicate at a time ---------- */
console.log("AIMS-F EXAM POOL   mode='exam', the filter from generate-mock-exam:303-344");
console.log("  pool='secure' AND language=<l> AND status='approved' AND retired_at IS NULL");
console.log("  AND item_origin <> 'generated' AND is_exam_scope = true");
console.log("");
console.log("  NOTE: `<>` is NULL-propagating, so a row with item_origin IS NULL is excluded too.");
console.log("");
const hdr = "  predicate".padEnd(42) + LANGS.map((l) => l.padStart(9)).join("");
console.log(hdr);
const steps = [
  ["certification + language", (r) => true],
  ["+ pool = 'secure'", (r) => r.pool === "secure"],
  ["+ status = 'approved'", (r) => r.status === "approved"],
  ["+ retired_at IS NULL", (r) => r.retired_at === null],
  ["+ item_origin <> 'generated' (NULL out)", (r) => r.item_origin !== null && r.item_origin !== undefined && r.item_origin !== "generated"],
  ["+ is_exam_scope = true", (r) => r.is_exam_scope === true],
];
const poolByLang = {};
for (const [label, _] of steps) {
  const cells = [];
  for (const l of LANGS) {
    let rows = all.filter((r) => r.language === l);
    for (const [lab2, f] of steps) { rows = rows.filter(f); if (lab2 === label) break; }
    cells.push(String(rows.length).padStart(9));
    poolByLang[l] = rows;
  }
  console.log("  " + label.padEnd(40) + cells.join(""));
}

/* ---------- 2. BY ORIGIN ---------- */
console.log("");
console.log("SERVING EXAM POOL BY item_origin   (after every predicate above)");
const origins = [...new Set(all.map((r) => (r.item_origin === null || r.item_origin === undefined) ? "<NULL>" : r.item_origin))].sort();
console.log("  origin".padEnd(42) + LANGS.map((l) => l.padStart(9)).join(""));
for (const o of origins) {
  const cells = LANGS.map((l) => String(poolByLang[l].filter((r) =>
    ((r.item_origin === null || r.item_origin === undefined) ? "<NULL>" : r.item_origin) === o).length).padStart(9));
  console.log("  " + o.padEnd(40) + cells.join(""));
}
console.log("");
console.log("GROUNDED SET, for comparison (every status, so the cutover's own stock is visible)");
console.log("  state".padEnd(42) + LANGS.map((l) => l.padStart(9)).join(""));
for (const st of ["approved", "pending_review", "draft"]) {
  const cells = LANGS.map((l) => String(all.filter((r) => r.language === l && r.status === st &&
    [...ig.keys()].length && isGroundedRow(r, l)).length).padStart(9));
  console.log("  grounded, " + st.padEnd(31) + cells.join(""));
}
/* The four the approval dry run refuses on condition 4, by content id. The target pool is what
 * approval would LEAVE SERVING, so a row that cannot be approved is not in it. */
const GATE_REFUSED = new Set(["a3841bda", "1d659dfc", "3973e1ff", "182229d1"]);
/* a declaration, not a const arrow: `isGroundedRow` is called by the census above this line */
function enOf(r, l) {
  if (l === "en") return r;
  if (!r.question_group_id) return null;
  return all.find((x) => x.question_group_id === r.question_group_id && x.language === "en");
}
function isGroundedRow(r, l) {
  const en = enOf(r, l);
  return !!en && ig.has(en.id);
}
function isApprovable(r, l) {
  const en = enOf(r, l);
  if (!en) return false;
  const g = ig.get(en.id);
  if (!g || g.review_verdict !== "accept") return false;
  return !GATE_REFUSED.has(itemId(en.question_text));
}

/* ---------- 3. THE TARGET POOL and 20 dry assemblies ---------- */
/* The target pool is the GROUNDED set: what the cutover would leave serving. */
console.log("");
console.log("DRY ASSEMBLY over the GROUNDED pool   target_count=" + TARGET + ", " + FORMS + " form(s) per language");
console.log("  (availability and distinct-enemy capacity against quota -- a BOUND; the real picker is");
console.log("   local to the Deno function and is not reimplemented here)");
console.log("");
for (const l of LANGS) {
  const target = all.filter((r) => r.language === l && isApprovable(r, l) &&
    r.retired_at === null && r.pool === "secure");
  const byDom = new Map();
  for (const r of target) {
    const d = domainByTask.get(r.task_id);
    if (!d) continue;
    if (!byDom.has(d)) byDom.set(d, []);
    byDom.get(d).push(r);
  }
  console.log("  " + l + "   APPROVABLE secure rows " + target.length);
  console.log("    domain  weight   quota   avail   enemyCap   verdict");
  let shortDom = 0;
  for (const d of domains) {
    const q = alloc.get(d.id) ?? 0;
    const rows = byDom.get(d.id) || [];
    const keys = new Set();
    for (const r of rows) {
      const en = l === "en" ? r : all.find((x) => x.question_group_id === r.question_group_id && x.language === "en");
      const g = en ? ig.get(en.id) : null;
      const k = g ? enemyKeyOf(g) : null;
      keys.add(k || ("row:" + r.id));
    }
    const cap = keys.size;
    const ok = rows.length >= q && cap >= q;
    if (!ok) shortDom++;
    console.log("    " + String(d.code).padEnd(7) + String(d.weight_pct).padStart(6) +
      String(q).padStart(8) + String(rows.length).padStart(8) + String(cap).padStart(11) +
      "   " + (ok ? "ok" : "SHORT") + (cap < q ? " (enemy-bound)" : ""));
  }
  console.log("    domains short: " + shortDom + " of " + domains.length +
    (shortDom ? "   -> mode='exam' REFUSES the form (step 8 integrity gate)" : "   -> " + FORMS + " forms assemble"));
  console.log("");
}
