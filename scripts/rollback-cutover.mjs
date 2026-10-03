#!/usr/bin/env node
/**
 * Undo a cutover: set `retired_at = null` on exactly the ids `cutover-aimsf.mjs` recorded.
 * WRITES with `--apply`; dry by default. Unknown flags exit 2.
 *
 * It reads the id list from the file rather than re-deriving it. A rollback that recomputes its own
 * target set can restore a row the cutover never touched -- the file IS the record of what was done.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";

let APPLY = false, FILE = "AIMSF-CUTOVER-RETIRED.json", ONLY = null;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m = a.match(/^--file=(.+)$/);
  if (m) { FILE = m[1]; continue; }
  /* `--ids` un-retires NAMED groups only and PRUNES them from the record, so the file keeps naming
   * exactly what is still retired. Without it the whole recorded set is restored. */
  m = a.match(/^--ids=(.+)$/);
  if (m) { ONLY = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  console.error("Unrecognised flag: " + a + ". Known: --file=<path>, --ids=<uuid8>,..., --apply.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const path = join(ROOT, FILE);
if (!existsSync(path)) {
  console.error("No " + FILE + ". There is no recorded cutover to roll back.");
  process.exit(2);
}
const rec = JSON.parse(readFileSync(path, "utf8"));
let ids = (rec.ids || []).map((x) => x.id);
if (!ids.length) { console.error(FILE + " names no ids."); process.exit(2); }
let groupsOf = null;
if (ONLY) {
  /* resolve each named prefix to its WHOLE group, so a group never half-returns */
  groupsOf = ONLY;
}

const KEY = requireKey(HERE);
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const cert = (await getAll(KEY, "certifications?select=id&code=eq." + (rec.cert || "AIMS-F")))[0];
const all = await getAll(KEY, "quiz_questions?select=id,language,status,pool,visibility,is_exam_scope," +
  "retired_at&certification_id=eq." + cert.id + "&order=id");
const byId = new Map(all.map((r) => [r.id, r]));

if (groupsOf) {
  /* a named prefix brings its WHOLE group back, so a group never half-returns. Only ids the record
   * actually names are eligible -- this cannot un-retire something the cutover did not retire. */
  const recorded = new Set(ids);
  const groupRows = await getAll(KEY, "quiz_questions?select=id,question_group_id&certification_id=eq." +
    cert.id + "&order=id");
  const wanted = new Set();
  for (const p of groupsOf) {
    const seed = groupRows.find((r) => String(r.id).startsWith(p));
    if (!seed) { console.error("  " + p + " resolves to no row -- skipped"); continue; }
    const fam = seed.question_group_id
      ? groupRows.filter((r) => r.question_group_id === seed.question_group_id)
      : [seed];
    for (const r of fam) if (recorded.has(r.id)) wanted.add(r.id);
  }
  ids = [...wanted];
  console.log("--ids: restoring " + ids.length + " recorded row(s) across " + groupsOf.length + " group(s)");
  if (!ids.length) { console.error("None of the named groups is in the record."); process.exit(2); }
}

const idSet = new Set(ids);
const missing = ids.filter((id) => !byId.has(id));
const alreadyLive = ids.filter((id) => byId.has(id) && byId.get(id).retired_at === null);
console.log("ROLLBACK " + FILE + "   cert=" + rec.cert + "   recorded " + ids.length + " id(s)" +
  (rec.retired_at ? "   stamped " + rec.retired_at : ""));
console.log("  not found in the bank      " + missing.length);
console.log("  already live (not retired) " + alreadyLive.length);
console.log("  would restore              " + ids.filter((id) => byId.has(id) && byId.get(id).retired_at !== null).length);
if (!APPLY) { console.log("\nDRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

let wrote = 0;
for (const id of ids) {
  const r0 = byId.get(id);
  if (!r0 || r0.retired_at === null) continue;
  const r = await fetch(REST_URL + "/quiz_questions?id=eq." + id, { method: "PATCH", headers: H,
    body: JSON.stringify({ retired_at: null, status: r0.status, visibility: r0.visibility,
      is_exam_scope: r0.is_exam_scope }) });
  if (!r.ok) { console.error("  PATCH FAILED " + id.slice(0, 8) + "  " + (await r.text()).slice(0, 140)); continue; }
  wrote++;
}
const after = await getAll(KEY, "quiz_questions?select=id,retired_at&certification_id=eq." + cert.id + "&order=id");
const stillRetired = after.filter((r) => idSet.has(r.id) && r.retired_at !== null).length;
/* the NEGATIVE half: nothing OUTSIDE the recorded list became live */
const strays = after.filter((r) => !idSet.has(r.id) && byId.has(r.id) &&
  byId.get(r.id).retired_at !== null && r.retired_at === null).length;
/* PRUNE the record, so the file keeps naming exactly what is still retired. Without this the
 * rollback list would re-retire rows a later ruling deliberately brought back. */
let pruned = 0;
if (groupsOf && !stillRetired) {
  const keep = (rec.ids || []).filter((x) => !idSet.has(x.id));
  pruned = (rec.ids || []).length - keep.length;
  rec.ids = keep;
  rec.count = keep.length;
  rec.returned = rec.returned || [];
  rec.returned.push({ at: new Date().toISOString(), ruled_in: "PROMPT-110 s1",
    groups: groupsOf, rows: pruned });
  writeFileSync(path, JSON.stringify(rec, null, 2) + "\n");
}
console.log("");
console.log("  restored " + wrote + "   still retired from the list " + stillRetired + "   strays " + strays);
if (groupsOf) console.log("  pruned from the record " + pruned + "   record now names " + (rec.ids || []).length);
if (stillRetired || strays) process.exitCode = 2;
