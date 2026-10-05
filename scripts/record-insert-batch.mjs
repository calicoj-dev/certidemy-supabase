#!/usr/bin/env node
/* PROMPT-131: R5's 42 rows were inserted through gen-grounded-items --apply --from --ids rather than
 * insert-pilot-drafts, which is the path that WRITES <SLUG>-INSERTED.json. The rows are right; the
 * LEDGER entry is missing, and --only-new, check-duplicate-pairs and backfill-rescue-solver all read it.
 * This writes the entry from the live rows, resolving every id by stem hash. It changes no bank row.
 * --apply to write, dry by default. */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
let APPLY = false, CERT = null, FROM = null, ACCEPT = null, SLUG = null, AT = null;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  let m;
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if ((m = /^--from=(.+)$/.exec(a))) { FROM = m[1]; continue; }
  if ((m = /^--accept=(.+)$/.exec(a))) { ACCEPT = m[1]; continue; }
  if ((m = /^--slug=(.+)$/.exec(a))) { SLUG = m[1]; continue; }
  if ((m = /^--at=(.+)$/.exec(a))) { AT = m[1]; continue; }
  console.error("unrecognised flag: " + a);
  console.error("this script opts into WRITING: --apply (dry by default).");
  console.error("  --cert=<CODE> --from=<artifact> --accept=<accept list> --slug=<SLUG> --at=<ISO stamp>");
  process.exit(2);
}
if (!CERT || !FROM || !ACCEPT || !SLUG || !AT) { console.error("--cert, --from, --accept, --slug and --at are all required."); process.exit(2); }

const art = JSON.parse(readFileSync(join(ROOT, FROM), "utf8"));
const byItem = new Map((art.items || []).map((r) => [r.item_id, r]));
const acc = JSON.parse(readFileSync(join(ROOT, ACCEPT), "utf8")).accepts;
const KEY = requireKey(HERE);
const cert = (await getAll(KEY, "certifications?select=id&code=eq." + CERT))[0];
const qs = await getAll(KEY, "quiz_questions?select=id,question_text&certification_id=eq." + cert.id +
  "&language=eq.en&retired_at=is.null&order=id");
const stemId = new Map(qs.map((q) => [q.id, itemIdOfStem(q.question_text)]));

const insPath = join(ROOT, SLUG + "-INSERTED.json");
const rec = existsSync(insPath) ? JSON.parse(readFileSync(insPath, "utf8")) : { batches: [] };
const already = new Set(rec.batches.flatMap((b) => (b.rows || []).map((r) => r.item_id)));

const rows = [], bad = [];
for (const x of acc) {
  if (already.has(x.item_id)) { bad.push(x.item_id + ": already in a recorded batch -- refusing to double-record"); continue; }
  const it = byItem.get(x.item_id);
  if (!it) { bad.push(x.item_id + ": not in " + FROM); continue; }
  const hits = qs.filter((q) => stemId.get(q.id) === x.item_id);
  if (hits.length !== 1) { bad.push(x.item_id + ": resolves to " + hits.length + " live row(s)"); continue; }
  rows.push({ id: hits[0].id, item_id: x.item_id, report_number: x.report_number,
    task: it.task_code, anchor: it.item.key_support_clause, source: it.item.source_id });
}
for (const b of bad) console.log("  " + b);
if (bad.length) { console.error("REFUSING: nothing written."); process.exit(2); }
console.log(SLUG + "-INSERTED.json: " + rec.batches.length + " batch(es), " + already.size + " row(s) recorded");
console.log("  this batch: " + rows.length + " row(s) from " + FROM + ", all resolved by stem hash");
if (!APPLY) { console.log("DRY. Nothing written. --apply to write."); process.exit(0); }

rec.batches.push({ at: AT, cert: CERT, from: FROM, accept_list: ACCEPT,
  note: "LEDGER WRITTEN AFTER THE FACT, PROMPT-131: inserted through gen-grounded-items --apply --from " +
    "--ids, which does not record a batch. Rows verified live and resolved by stem hash.",
  ids: rows.map((r) => r.id), rows });
writeFileSync(insPath, JSON.stringify(rec, null, 1) + "\n");

/* post-condition, both directions: this batch is readable back, and no earlier batch moved. */
const back = JSON.parse(readFileSync(insPath, "utf8"));
const mine = back.batches[back.batches.length - 1];
const earlierBefore = JSON.stringify(rec.batches.slice(0, -1));
const earlierAfter = JSON.stringify(back.batches.slice(0, -1));
const okMine = mine.rows.length === rows.length &&
  rows.every((r) => mine.rows.some((x) => x.item_id === r.item_id && x.id === r.id));
console.log("  recorded " + mine.rows.length + " row(s); readable back: " + (okMine ? "yes" : "NO"));
console.log("  earlier batches unchanged: " + (earlierBefore === earlierAfter ? "yes" : "NO"));
if (!okMine || earlierBefore !== earlierAfter) process.exitCode = 1;
