#!/usr/bin/env node
/**
 * build-s2-insert-set.mjs -- assemble the one artifact PROMPT-95 s2 says to insert.
 *
 * `--apply` writes it. DRY BY DEFAULT. Unknown flags exit 2. Writes a FILE, never the database.
 *
 * The ruling is *"everything else: insert"*, and "everything else" is a set defined by SUBTRACTION from four
 * other sets. A subtraction stated in prose is a subtraction nobody can check, so it is stated here as code
 * and every exclusion is counted and named:
 *
 *   + every SURVIVOR of batch 2, R2 and R3                     the 100 the director read
 *   - the 2 REJECTED by name                                   c590b702, 43882b06
 *   - the 3 superseded ORIGINALS of the s2 revisions           replaced by the re-gated versions
 *   + the 3 REVISED items, from the re-gated artifact          9e9fafd4, b25f378f, 6984516f
 *   - anything already INSERTED                                read from the bank, never assumed
 *
 * ============ ALREADY-INSERTED IS READ FROM THE BANK, NOT FROM A LIST ============
 *
 * 49 grounded rows are already in `quiz_questions`, including batch 1. A list of what went in is a second
 * copy of a fact that lives in the database, and this repository's whole record is of such copies going
 * stale. So the exclusion is computed from the rows themselves, matched on the stem's content id -- the same
 * id the artifacts carry -- and the count of matches is reported so a silent zero cannot pass for "none were
 * already in".
 *
 * ============ AND THE STEM ID IS THE KEY, WHICH IS WHY 3d1d332c IS NOT IN THE OUTPUT ============
 *
 * The revision rewrote that item's stem, so its content id moved to `9e9fafd4`. Both ids are asserted: the
 * old one must be present in the source artifacts and absent from the output, the new one the reverse. An
 * id-keyed subtraction that silently matched nothing would have inserted the item twice.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";

let APPLY = false, OUT = "AIMSF-S2-INSERT.json";
for (const a of process.argv.slice(2)) {
  let m;
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--out=(.+)$/.exec(a))) { OUT = m[1]; continue; }
  console.error("Unrecognised flag: " + a + ". Known: --apply, --out=. DRY by default.");
  process.exit(2);
}
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const KEY = requireKey(HERE);
const idOf = (t) => createHash("sha256").update(String(t || "").replace(/\s+/g, " ").trim())
  .digest("hex").slice(0, 8);

/* the three source families, named with what each is */
const SURVIVOR_FILES = ["AIMSF-ROLLOUT-B2.json", "AIMSF-R2-PROBE.json", "AIMSF-R2-REST.json",
  "AIMSF-R3-PROBE.json", "AIMSF-R3-REST.json"];
const REVISED_FILE = "AIMSF-S2-REVISED.json";
const REJECT = ["c590b702", "43882b06"];
/* the ids the revisions REPLACE, and the ids they became. Both halves asserted. */
const SUPERSEDED = [
  { was: "3d1d332c", now: "9e9fafd4", note: "the stem was rewritten, so the content id moved" },
  { was: "b25f378f", now: "b25f378f", note: "option B and the explanation only, so the id is unchanged" },
  { was: "6984516f", now: "6984516f", note: "explanation only, so the id is unchanged" },
];

/* ---------------------------------------------------------------- read the sources */
const src = { certification: null, model: null, standard: null, edition: null };
const survivors = new Map();   /* id8 -> record */
for (const f of SURVIVOR_FILES) {
  const p = join(ROOT, f);
  if (!existsSync(p)) { console.error("MISSING source artifact " + f); process.exit(2); }
  const art = JSON.parse(readFileSync(p, "utf8"));
  for (const k of Object.keys(src)) if (!src[k] && art[k]) src[k] = art[k];
  for (const r of art.items || []) {
    if (r.verdict !== "survivor") continue;
    const id = String(r.item_id || idOf(r.item && r.item.question_text)).slice(0, 8);
    if (!survivors.has(id)) survivors.set(id, { ...r, source_file: f });
  }
}
const revP = join(ROOT, REVISED_FILE);
if (!existsSync(revP)) {
  console.error("MISSING " + REVISED_FILE + ". Re-gate the revisions first:");
  console.error("  node --dns-result-order=ipv4first scripts/gen-grounded-items.mjs --cert=AIMS-F" +
    " --from=AIMSF-S2-REVISED-raw.json --exam-scope --out=" + REVISED_FILE);
  process.exit(2);
}
const revArt = JSON.parse(readFileSync(revP, "utf8"));
const revised = new Map();
for (const r of revArt.items || []) {
  if (r.verdict !== "survivor") continue;
  revised.set(String(r.item_id || idOf(r.item.question_text)).slice(0, 8), { ...r, source_file: REVISED_FILE });
}

/* ---------------------------------------------------------------- what is already in the bank */
const cert = (await getAll(KEY, "certifications?select=id,code&code=eq.AIMS-F"))[0];
if (!cert) { console.error("AIMS-F not found in certifications"); process.exit(2); }
const rows = await getAll(KEY, "quiz_questions?select=id,question_text,status,pool,is_exam_scope" +
  "&certification_id=eq." + cert.id + "&item_origin=eq.generated&language=eq.en");
const inBank = new Map();
for (const r of rows) inBank.set(idOf(r.question_text), r);

/* ---------------------------------------------------------------- assemble, counting every exclusion */
let fails = 0;
const excluded = { rejected: [], superseded: [], alreadyIn: [] };
const out = [];
for (const [id, r] of survivors) {
  if (REJECT.includes(id)) { excluded.rejected.push(id); continue; }
  if (SUPERSEDED.some((s) => s.was === id)) { excluded.superseded.push(id); continue; }
  if (inBank.has(id)) { excluded.alreadyIn.push(id); continue; }
  out.push(r);
}
for (const s of SUPERSEDED) {
  if (!survivors.has(s.was)) {
    console.error("ABORT: superseded id " + s.was + " is not a survivor in any source artifact, so the " +
      "subtraction removes nothing and the revision would be inserted alongside its original");
    fails++;
  }
  const rr = revised.get(s.now);
  if (!rr) {
    console.error("ABORT: revised id " + s.now + " is not a survivor in " + REVISED_FILE);
    fails++; continue;
  }
  if (inBank.has(s.now)) { excluded.alreadyIn.push(s.now); continue; }
  out.push(rr);
}

/* ---- every item must carry a recorded solver verdict, or --reuse-solver will refuse the whole run ---- */
const noVerdict = out.filter((r) => !r.solver);
if (noVerdict.length) {
  console.error("ABORT: " + noVerdict.length + " item(s) carry no recorded solver verdict. --reuse-solver " +
    "would refuse the run, and inserting them under a fresh judgement nobody read is the thing that flag " +
    "exists to prevent.");
  fails++;
}
/* ---- and no duplicate stems, because two rows with one stem is a duplicate item in the bank ---- */
const seen = new Map();
for (const r of out) {
  const id = String(r.item_id || idOf(r.item.question_text)).slice(0, 8);
  if (seen.has(id)) { console.error("ABORT: duplicate id " + id + " in the insert set"); fails++; }
  seen.set(id, r);
}

/* ---------------------------------------------------------------- report */
console.log("PROMPT-95 s2 insert set");
console.log("");
console.log("  survivors read from " + SURVIVOR_FILES.length + " artifact(s)   " + survivors.size);
console.log("  - REJECTED by name                            " + excluded.rejected.length +
  "   " + excluded.rejected.join(", "));
console.log("  - SUPERSEDED by an s2 revision                 " + excluded.superseded.length +
  "   " + excluded.superseded.join(", "));
console.log("  - already in the bank (read from the rows)     " + excluded.alreadyIn.length);
console.log("  + revised, re-gated                           " + SUPERSEDED.length +
  "   " + SUPERSEDED.map((s) => s.now).join(", "));
console.log("  = TO INSERT                                   " + out.length);
console.log("");
console.log("  grounded rows already in the bank: " + rows.length + "   (status/pool/exam-scope as read:");
{
  const by = {};
  for (const r of rows) {
    const k = r.status + " / " + r.pool + " / exam_scope=" + r.is_exam_scope;
    by[k] = (by[k] || 0) + 1;
  }
  for (const [k, v] of Object.entries(by)) console.log("    " + v + "  " + k);
}
console.log("  )");
console.log("");
for (const s of SUPERSEDED) {
  console.log("  supersede " + s.was + " -> " + s.now + "   " + s.note +
    "   [old present in sources: " + survivors.has(s.was) + ", new in output: " +
    out.some((r) => String(r.item_id || "").slice(0, 8) === s.now) + "]");
}
console.log("");
const byTask = {};
for (const r of out) byTask[r.task_code] = (byTask[r.task_code] || 0) + 1;
console.log("  PER TASK: " + Object.entries(byTask).sort((a, b) => a[0].localeCompare(b[0]))
  .map(([k, v]) => k + ":" + v).join("  "));

if (fails) {
  console.error("");
  console.error("NOTHING WRITTEN. " + fails + " abort condition(s).");
  process.exit(1);
}
if (!APPLY) {
  console.log("");
  console.log("DRY RUN -- nothing written. Re-run with --apply to write " + OUT + ".");
  process.exit(0);
}
writeFileSync(join(ROOT, OUT), JSON.stringify({
  certification: src.certification, model: src.model, standard: src.standard, edition: src.edition,
  note: "PROMPT-95 s2 insert set. Assembled by build-s2-insert-set.mjs from the batch-2, R2 and R3 gated " +
    "artifacts, minus the two rejections and the three superseded originals, plus the three re-gated " +
    "revisions, minus anything already in the bank (read from the rows, not from a list). Every item " +
    "carries the solver verdict it was approved on; the CODE gates re-run at insert, because the library " +
    "moved under these anchors.",
  items: out,
}, null, 1) + "\n", "utf8");
console.log("");
console.log("wrote " + OUT + "   " + out.length + " item(s)");
console.log("Insert with:  node --dns-result-order=ipv4first scripts/gen-grounded-items.mjs --cert=AIMS-F" +
  " --from=" + OUT + " --reuse-solver --exam-scope --apply --out=AIMSF-S2-INSERTED.json");
