/**
 * backfill-writer-attribution.mjs -- repair item_grounding.model, which was written from the
 * artifact's top-level `model` (the BASE DEFAULT) rather than the writer that was actually used.
 *
 * WRITES with `--apply`; dry by default. Unknown flags exit 2. Ruled PROMPT-141 s1.
 *
 *   --cert <CODE>   restrict to one certification (default: every certification)
 *   --apply         write. Dry by default.
 *
 * ============ THE SOURCE OF TRUTH IS THE ARTIFACT'S SPEND BLOCK, PER ITEM ============
 *
 * Each live grounded row is matched to the artifact that produced it BY ITEM ID -- the content hash of
 * its English stem -- and the writer comes from that artifact's `spend.writer_model` via
 * lib/writer-attribution.mjs. The top-level `model` is never read: it is the field that was wrong.
 *
 * A row whose artifact cannot be found, or whose id appears in two artifacts naming DIFFERENT writers,
 * is LEFT ALONE and listed. Ruled PROMPT-141 s1: "Those rows stay as they are and get listed. Don't
 * guess." A backfill that guesses replaces a known-wrong constant with an unknown-wrong one.
 */
import { readFileSync, writeFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { requireKey, getAll, REST_URL } from "./_pg.mjs";
import { itemIdOfStem } from "./lib/item-id.mjs";
import { writerModelOf } from "./lib/writer-attribution.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const PREIMAGE = join(ROOT, "ATTRIBUTION-BACKFILL-PREIMAGE.json");

let APPLY = false, CERT = null, m;
for (const a of process.argv.slice(2)) {
  if (a === "--apply") { APPLY = true; continue; }
  if ((m = /^--cert=(.+)$/.exec(a))) { CERT = m[1]; continue; }
  if (a === "--cert") continue;
  if (/^[A-Z][A-Z0-9-]+$/.test(a) && !CERT) { CERT = a; continue; }
  console.error("backfill-writer-attribution: unrecognised flag " + a);
  console.error("This script opts into WRITING: --apply (dry by default). See CLAUDE.md s15 --");
  console.error("the other family opts into SAFETY with --dry. Flags: --cert=<CODE>, --apply.");
  process.exitCode = 2; process.exit();
}

const KEY = requireKey(HERE);

/* ---- 1. every artifact's (item_id -> writer) map ---- */
const files = readdirSync(ROOT).filter((f) => /\.json$/.test(f) &&
  !/^(ACCEPT-|ATTRIBUTION-)/.test(f));
const writerOf = new Map();      /* item_id -> writer */
const conflict = new Map();      /* item_id -> Set(writers) */
const seenIn = new Map();        /* item_id -> file that supplied it */
const anyArtifact = new Map();   /* item_id -> file, EVEN when the writer is unresolvable */
let artifactsRead = 0;
for (const f of files) {
  let j;
  try { j = JSON.parse(readFileSync(join(ROOT, f), "utf8")); } catch { continue; }
  if (!j || !Array.isArray(j.items)) continue;
  const w = writerModelOf(j);
  for (const it of j.items) {
    const id = it && (it.item_id || it.id);
    if (!id) continue;
    if (!anyArtifact.has(id)) anyArtifact.set(id, f);
  }
  if (!w) continue;
  artifactsRead++;
  for (const it of j.items) {
    const id = it && (it.item_id || it.id);
    if (!id) continue;
    const prev = writerOf.get(id);
    if (prev && prev !== w) {
      if (!conflict.has(id)) conflict.set(id, new Set([prev]));
      conflict.get(id).add(w);
      continue;
    }
    if (!prev) { writerOf.set(id, w); seenIn.set(id, f); }
  }
}
console.log("ARTIFACTS   " + artifactsRead + " with a resolvable writer; " + writerOf.size +
  " distinct item id(s); " + conflict.size + " id(s) named by two writers");

/* ---- 2. the live rows ---- */
const certs = (await getAll(KEY, "certifications?select=id,code&order=id"))
  .filter((c) => !CERT || c.code === CERT);
if (CERT && !certs.length) { console.error("no certification " + CERT); process.exitCode = 2; process.exit(); }

const gr = await getAll(KEY, "item_grounding?select=question_id,model&order=question_id");
const grBy = new Map(gr.map((g) => [g.question_id, g]));

const plan = [];                 /* rows that will change */
const unresolved = [];           /* artifact not found */
const ambiguous = [];            /* two artifacts disagree */
const already = [];              /* already correct */
for (const c of certs) {
  const qs = await getAll(KEY, "quiz_questions?select=id,question_text,item_origin,language,retired_at" +
    "&certification_id=eq." + c.id + "&language=eq.en&item_origin=eq.grounded&order=id");
  for (const q of qs) {
    const g = grBy.get(q.id);
    if (!g) continue;
    const id = itemIdOfStem(q.question_text);
    if (conflict.has(id)) { ambiguous.push({ cert: c.code, qid: q.id, item_id: id, old: g.model,
      writers: [...conflict.get(id)] }); continue; }
    const want = writerOf.get(id);
    if (!want) {
      unresolved.push({ cert: c.code, qid: q.id, item_id: id, old: g.model,
        /* two different situations, and lumping them hides which one a row is in */
        why: anyArtifact.has(id) ? "artifact " + anyArtifact.get(id) + " names it, writer unresolvable"
          : "NO artifact on disk names this id" });
      continue;
    }
    if (g.model === want) { already.push({ cert: c.code, item_id: id, model: want }); continue; }
    plan.push({ cert: c.code, qid: q.id, item_id: id, old: g.model, next: want, from: seenIn.get(id) });
  }
}

/* ---- 3. the dry-run report: certification x (old -> new) ---- */
const tally = new Map();
for (const p of plan) {
  const k = p.cert + " | " + String(p.old) + " -> " + p.next;
  tally.set(k, (tally.get(k) || 0) + 1);
}
console.log("");
console.log("WOULD CHANGE   " + plan.length + " row(s)   [English grounded rows; siblings carry no grounding row]");
for (const [k, v] of [...tally.entries()].sort()) console.log("  " + String(v).padStart(5) + "  " + k);
console.log("");
console.log("ALREADY CORRECT          " + already.length);
console.log("LEFT ALONE, writer not established  " + unresolved.length);
const byWhy = new Map();
for (const u of unresolved) {
  const k = u.cert + " | " + u.why;
  byWhy.set(k, (byWhy.get(k) || 0) + 1);
}
for (const [k, v] of [...byWhy.entries()].sort()) console.log("  " + String(v).padStart(5) + "  " + k);
console.log("LEFT ALONE, ambiguous    " + ambiguous.length);
for (const a of ambiguous.slice(0, 20)) {
  console.log("    " + a.cert.padEnd(9) + a.item_id + "   stays " + a.old + "   claimed by " + a.writers.join(" and "));
}

if (!APPLY) {
  console.log("");
  console.log("DRY RUN. Nothing written, and no pre-image saved. Re-run with --apply.");
  process.exitCode = 0;
} else {
  if (existsSync(PREIMAGE)) {
    console.error("");
    console.error("REFUSING: " + PREIMAGE.split(/[\\/]/).pop() + " already exists, so a previous backfill's");
    console.error("pre-image would be overwritten and its undo lost. Move it aside deliberately.");
    process.exitCode = 2; process.exit();
  }
  /* THE PRE-IMAGE GOES DOWN BEFORE THE FIRST WRITE, so an interrupted run is still undoable. */
  writeFileSync(PREIMAGE, JSON.stringify({
    _what: "Pre-image for backfill-writer-attribution, ruled PROMPT-141 s1. Each entry is the value " +
      "item_grounding.model held BEFORE the backfill. To undo: PATCH each question_id back to `old`.",
    ruled_in: "PROMPT-141 s1",
    rows: plan.length,
    left_alone: { no_artifact: unresolved.length, ambiguous: ambiguous.length },
    preimage: plan.map((p) => ({ question_id: p.qid, item_id: p.item_id, old: p.old, next: p.next })),
  }, null, 1) + "\n");
  console.log("");
  console.log("pre-image saved: " + PREIMAGE.split(/[\\/]/).pop() + "   " + plan.length + " row(s)");

  const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
  let wrote = 0, failed = 0;
  for (const p of plan) {
    const r = await fetch(REST_URL + "/item_grounding?question_id=eq." + p.qid, {
      method: "PATCH", headers: H, body: JSON.stringify({ model: p.next }),
    });
    if (!r.ok) {
      console.error("  FAILED " + p.item_id + " HTTP " + r.status + " " + (await r.text()).slice(0, 120));
      failed++; continue;
    }
    wrote++;
  }
  console.log("wrote " + wrote + " of " + plan.length + (failed ? "   FAILED " + failed : ""));
  if (failed) process.exitCode = 2;

  /* ---- 4. READ BACK, independently: count by certification x model ---- */
  const after = await getAll(KEY, "item_grounding?select=question_id,model&order=question_id");
  const aBy = new Map(after.map((g) => [g.question_id, g]));
  console.log("");
  console.log("READ BACK   certification x model, live grounded English rows");
  let sonnet = 0, opus = 0, other = 0;
  for (const c of certs) {
    const qs = await getAll(KEY, "quiz_questions?select=id&certification_id=eq." + c.id +
      "&language=eq.en&item_origin=eq.grounded&order=id");
    const t = {};
    for (const q of qs) {
      const g = aBy.get(q.id);
      if (!g) continue;
      const k = g.model || "(null)";
      t[k] = (t[k] || 0) + 1;
      if (/sonnet/.test(k)) sonnet++; else if (/opus/.test(k)) opus++; else other++;
    }
    console.log("  " + c.code.padEnd(9) + Object.entries(t).sort().map(([k, v]) => k + "=" + v).join("  "));
  }
  console.log("");
  console.log("  TOTAL   sonnet " + sonnet + "   opus " + opus + "   other " + other);
  const mismatch = plan.filter((p) => (aBy.get(p.qid) || {}).model !== p.next);
  console.log("  rows that did not take the new value: " + mismatch.length + " (must be 0)");
  if (mismatch.length) process.exitCode = 2;
}
