#!/usr/bin/env node
/* Un-retire the rows of an item RELEASED from <SLUG>-WITHHELD.json.
 *
 * The inverse of retire-withheld.mjs, and deliberately narrower: it will only un-retire a row that
 * THIS process retired, which it proves by intersecting the item's group with the id list in
 * <SLUG>-WITHHELD-RETIRED.json. A row retired by the cutover, or by anything else, is out of reach
 * here -- un-retiring something the cutover removed would put a superseded item back in the pool.
 *
 * It also refuses to release an item still named in the `withheld` list: the list is the authority
 * on what is held, so the release is recorded there FIRST and this script follows it.
 *
 * This script opts into WRITING: --apply. Dry by default. Unknown flags exit 2.
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
let CERT = null, APPLY = false, IDS = [];
const AV = process.argv.slice(2);
for (let i = 0; i < AV.length; i++) {
  const a = AV[i];
  let m;
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--cert(?:=(.+))?$/.exec(a))) { CERT = m[1] || AV[++i]; continue; }
  if ((m = /^--ids=(.+)$/.exec(a))) { IDS = m[1].split(",").map((s) => s.trim()).filter(Boolean); continue; }
  console.error("unrecognised flag: " + a);
  console.error("  --cert <CODE> (required), --ids=a,b (required), --apply (dry by default)");
  process.exit(2);
}
if (!CERT || !IDS.length) { console.error("--cert and --ids are both required"); process.exit(2); }

const SLUG = CERT.replace(/-/g, "");
const KEY = requireKey(join(ROOT, "scripts"));
const wPath = join(ROOT, SLUG + "-WITHHELD.json");
const rPath = join(ROOT, SLUG + "-WITHHELD-RETIRED.json");
if (!existsSync(wPath)) { console.error("REFUSING: no " + SLUG + "-WITHHELD.json"); process.exit(2); }
if (!existsSync(rPath)) { console.error("REFUSING: no " + SLUG + "-WITHHELD-RETIRED.json -- nothing was retired by this process"); process.exit(2); }

const wdoc = JSON.parse(readFileSync(wPath, "utf8"));
const stillHeld = new Set((wdoc.withheld || []).map((w) => String(w.item_id ?? w.id)));
const released = new Map((wdoc.released || []).map((w) => [String(w.item_id ?? w.id), w]));
const retiredIds = new Set((JSON.parse(readFileSync(rPath, "utf8")).ids || []).map((x) => String(x.id)));

console.log("RELEASE WITHHELD   " + CERT + "   " + (APPLY ? "--apply" : "dry run (default)"));
console.log("  still withheld       " + stillHeld.size);
console.log("  recorded as released " + released.size);
console.log("  rows this process retired: " + retiredIds.size);

const bad = [];
for (const id of IDS) {
  if (stillHeld.has(id)) bad.push(id + " is still in the `withheld` list -- record the release there first");
  else if (!released.has(id)) bad.push(id + " is in neither list; it was never withheld by this process");
  else if (!String(released.get(id).released_in || "").trim()) bad.push(id + " has no `released_in`");
}
if (bad.length) {
  console.error("REFUSING:");
  for (const b of bad) console.error("  " + b);
  process.exit(2);
}

const cert = (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0];
if (!cert) { console.error("no certification " + CERT); process.exit(2); }
const rows = await getAll(KEY, "quiz_questions?select=id,question_group_id,question_text,language," +
  "status,pool,visibility,is_exam_scope,retired_at&certification_id=eq." + cert.id + "&order=id");

const target = [];
for (const id of IDS) {
  const en = rows.filter((r) => r.language === "en" && itemIdOfStem(r.question_text) === id);
  if (en.length !== 1) {
    console.error("REFUSING: " + id + " resolves to " + en.length + " English row(s), not 1.");
    process.exit(2);
  }
  const group = rows.filter((r) => r.question_group_id === en[0].question_group_id);
  /* ONLY rows this process retired. A row the cutover retired is a superseded item and stays out. */
  const mine = group.filter((r) => retiredIds.has(String(r.id)));
  const foreign = group.filter((r) => r.retired_at !== null && !retiredIds.has(String(r.id)));
  if (foreign.length) {
    console.error("REFUSING: " + id + " has " + foreign.length + " retired row(s) this process did " +
      "not retire. Un-retiring those would restore something another step removed.");
    process.exit(2);
  }
  if (!mine.length) { console.error("REFUSING: " + id + " has no row this process retired."); process.exit(2); }
  console.log("  " + id + "   group " + String(en[0].question_group_id).slice(0, 8) +
    "   " + mine.length + " row(s) to un-retire   (" + mine.map((r) => r.language).join(", ") + ")");
  target.push(...mine);
}

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written. " + target.length + " row(s) would be un-retired.");
  process.exit(0);
}

const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json",
  Prefer: "return=minimal" };
let wrote = 0;
for (const r of target) {
  /* status, visibility, pool and is_exam_scope are NAMED on the write (standing rule) */
  const res = await fetch(REST_URL + "/quiz_questions?id=eq." + r.id, { method: "PATCH", headers: H,
    body: JSON.stringify({ retired_at: null, status: r.status, visibility: r.visibility,
      pool: r.pool, is_exam_scope: r.is_exam_scope }) });
  if (!res.ok) { console.error("  PATCH FAILED " + String(r.id).slice(0, 8) + " " + (await res.text()).slice(0, 120)); continue; }
  wrote++;
}

/* ---- POST-CONDITIONS, both directions ---- */
const after = await getAll(KEY, "quiz_questions?select=id,status,retired_at,language,question_group_id" +
  "&certification_id=eq." + cert.id + "&order=id");
const byId = new Map(after.map((r) => [r.id, r]));
const notLive = target.filter((r) => !byId.get(r.id) || byId.get(r.id).retired_at !== null);
const targetIds = new Set(target.map((r) => r.id));
const stillRetired = [...retiredIds].filter((i) => !targetIds.has(i))
  .filter((i) => byId.get(i) && byId.get(i).retired_at === null);
console.log("");
console.log("POST-CONDITIONS");
console.log("  un-retired           " + wrote + " of " + target.length);
console.log("  every target live    " + (notLive.length === 0 ? "yes" : "NO -- " + notLive.length));
console.log("  other withheld rows STILL retired: " +
  (stillRetired.length === 0 ? "yes, all " + (retiredIds.size - target.length) + " of them"
    : "NO -- " + stillRetired.length + " came back and should not have"));
console.log("  status of the released rows: " +
  JSON.stringify(Object.fromEntries(target.map((r) => [r.language, (byId.get(r.id) || {}).status]))));
if (notLive.length || stillRetired.length) {
  console.error("A POST-CONDITION FAILED. Read " + rPath + " before doing anything else.");
  process.exitCode = 2;
}
