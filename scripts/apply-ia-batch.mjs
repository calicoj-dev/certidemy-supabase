#!/usr/bin/env node
/**
 * apply-ia-batch.mjs - score and apply one AIMS-IA / ISMS-IA rewrite batch.
 *
 *   node scripts/apply-ia-batch.mjs --file ISMS-AIMS-IA-BATCH-B.json [--apply]
 *
 * DRY BY DEFAULT. Unknown flags exit 2.
 *
 * ONE INSTRUMENT FOR B, C AND D, so the three cannot drift apart. Every batch
 * is scored on the same rule and asserted against the same post-conditions.
 *
 * ============ WHAT IT REFUSES ON ============
 *
 *   a proposal that FIRES the gate            -- the whole point of the batch
 *   a row that fires and did not fire before  -- the AIMS-F failure mode
 *   an opening clause or suffix shared by more than 5 rewritten rows
 *   a proposal byte-identical to another in the same batch
 *   a slug that is not live in the certification named
 *
 * It writes NO hash column. An English edit moves concept_row_en_hash and
 * withholds the translations; re-syncing here would blindfold the gate that
 * exists to force a re-read.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { buildSources, score, firesUnion, assertCanary, W,
         MIN_RUN, MIN_COV, ABS_RUN } from "./lib/leak-score.mjs";

const KNOWN = new Set(["--apply", "--file"]);
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (!a.startsWith("--")) continue;
  if (!KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". Known: --file <json> [--apply]"); process.exit(2); }
  if (a === "--file") i++;
}
const APPLY = argv.includes("--apply");
const fi = argv.indexOf("--file");
if (fi < 0 || !argv[fi + 1]) { console.error("--file <batch.json> is required"); process.exit(2); }
const FILE = argv[fi + 1];

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

async function rest(path, init) {
  let last;
  for (let i = 0; i < 8; i++) {
    try {
      const r = await fetch(BASE + "/" + path, { ...init, headers: { ...H, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return t ? JSON.parse(t) : null;
    } catch (e) { last = e; }
  }
  throw new Error(path + ": " + last?.message);
}
async function allRows(path) {
  const out = []; let from = 0, total = null;
  for (;;) {
    const r = await fetch(BASE + "/" + path, { headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
    const page = await r.json(); out.push(...page);
    if (page.length < 500) break; from += 500;
  }
  if (!Number.isFinite(total)) throw new Error("no content-range on " + path);
  if (out.length !== total) throw new Error("PAGING INCOMPLETE on " + path + ": " + out.length + " of " + total);
  return out;
}
const enHash = (n, d) => createHash("md5")
  .update(String(n ?? "").replaceAll(String.fromCharCode(13), "") + "|" +
          String(d ?? "").replaceAll(String.fromCharCode(13), ""))
  .digest("hex").slice(0, 16);

const batch = JSON.parse(readFileSync(join(ROOT, FILE), "utf8"));
const rows = batch.rows_detail;
if (!Array.isArray(rows) || !rows.length) { console.error("REFUSING: no rows_detail in " + FILE); process.exit(2); }
if (batch.rows !== rows.length) {
  console.error("REFUSING: " + FILE + " declares " + batch.rows + " rows and holds " + rows.length);
  process.exit(2);
}
console.log("batch " + batch.batch + ": " + rows.length + " row(s) from " + FILE);

const sources = buildSources();
const can = assertCanary(sources);
console.log("canary " + can.maxRun + "w/" + can.maxCov.toFixed(2) + " OK   rule (run>=" +
            MIN_RUN + " AND cov>=" + MIN_COV + ") OR (run>=" + ABS_RUN + ")");

const certs = await allRows("certifications?select=id,code");
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const live = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);

/* ---------------------------------------------------------- score & check */
let fail = 0;
const plan = [];
console.log("");
console.log("slug".padEnd(56) + "chars  CURRENT        PROPOSED");
for (const r of rows) {
  const row = live.find((c) => c.slug === r.slug && codeOf.get(c.certification_id) === r.cert);
  if (!row) { console.error("REFUSING: " + r.cert + " has no live concept " + r.slug); process.exit(2); }
  const a = score(row.description, sources), b = score(r.proposed, sources);
  const af = firesUnion(a), bf = firesUnion(b);
  if (bf) fail++;
  console.log(r.slug.slice(0, 55).padEnd(56) + String(r.proposed.length).padStart(4) + "   " +
    (a.unionRun + "w/" + a.unionCov.toFixed(2) + (af ? " FIRE" : "    ")).padEnd(15) +
    (b.unionRun + "w/" + b.unionCov.toFixed(2) + (bf ? " FIRE  <-- INTRODUCED" : "")));
  if (bf) {
    const m = b.merged.slice().sort((x, y) => y.len - x.len)[0];
    console.log("        span: " + JSON.stringify(m.text) + "   [" + b.source + "]");
  }
  if (row.description !== r.proposed) plan.push({ id: row.id, cert: r.cert, slug: r.slug, before: row.description, after: r.proposed });
}

/* THE COLLISION GUARD, both ends. A batch written from one analysis per group
 * is exactly the situation it exists for. */
const open = rows.map((r) => W(r.proposed).slice(0, 5).join(" "));
const tail = rows.map((r) => W(r.proposed).slice(-5).join(" "));
const dup = (a) => { const m = {}; for (const x of a) m[x] = (m[x] || 0) + 1; return Object.entries(m).filter(([, n]) => n > 5); };
const dupAny = (a) => { const m = {}; for (const x of a) m[x] = (m[x] || 0) + 1; return Object.entries(m).filter(([, n]) => n > 1); };
const texts = rows.map((r) => r.proposed);
const identical = dupAny(texts);
console.log("");
console.log("openings shared by >5 rows: " + JSON.stringify(dup(open)));
console.log("suffixes shared by >5 rows: " + JSON.stringify(dup(tail)));
console.log("byte-identical proposals:   " + JSON.stringify(identical.map(([, n]) => n)));
if (dup(open).length || dup(tail).length) { console.error("REFUSING: shared opening or suffix over the limit"); fail++; }
if (identical.length) { console.error("REFUSING: two proposals are byte-identical"); fail++; }

const L = rows.map((r) => r.proposed.length).sort((a, b) => a - b);
console.log("length: min " + L[0] + "  median " + L[Math.floor(L.length / 2)] + "  max " + L[L.length - 1]);
console.log("rows to write: " + plan.length + "   proposals firing: " + rows.filter((r) => firesUnion(score(r.proposed, sources))).length);

if (fail) { console.error(""); console.error(fail + " blocking problem(s). Nothing written."); process.exit(1); }
if (!APPLY) { console.log(""); console.log("DRY RUN. Nothing written. Re-run with --apply."); process.exit(0); }

/* ------------------------------------------------------------------ write */
const ids = new Set(plan.map((p) => p.id));
const touched = new Set(plan.map((p) => p.cert));
const untouched = live.filter((c) => touched.has(codeOf.get(c.certification_id)) && !ids.has(c.id))
  .sort((a, b) => a.id.localeCompare(b.id)).map((c) => c.id + "|" + c.name + "|" + c.description);
const untouchedHash = createHash("sha256").update(untouched.join("\n")).digest("hex").slice(0, 16);

console.log("");
console.log("APPLYING " + plan.length + " row(s)...");
for (const p of plan) {
  const back = await rest("concepts?id=eq." + p.id, {
    method: "PATCH", headers: { Prefer: "return=representation" },
    body: JSON.stringify({ description: p.after }),
  });
  if (!back?.[0] || back[0].description !== p.after) throw new Error("read-back mismatch on " + p.slug);
}

console.log("");
console.log("POST-CONDITIONS");
let pf = 0;
const ok = (l, c, d) => { console.log("  " + (c ? "PASS  " : "FAIL  ") + l + (d ? "   " + d : "")); if (!c) pf++; };
const after = (await allRows("concepts?select=id,slug,name,description,certification_id,retired_at"))
  .filter((c) => !c.retired_at);
ok("every row carries its new text", plan.every((p) => after.find((c) => c.id === p.id)?.description === p.after));
const ua = after.filter((c) => touched.has(codeOf.get(c.certification_id)) && !ids.has(c.id))
  .sort((a, b) => a.id.localeCompare(b.id)).map((c) => c.id + "|" + c.name + "|" + c.description);
ok("every untouched row in the affected certifications is byte-identical",
   createHash("sha256").update(ua.join("\n")).digest("hex").slice(0, 16) === untouchedHash);
ok("no written row fires", plan.every((p) => !firesUnion(score(p.after, sources))));

const trs = await allRows("concept_translations?select=concept_id,language,en_hash,is_provisional");
const byId = new Map(after.map((c) => [c.id, c]));
const wh = {}; let serving = 0;
for (const t of trs) {
  const c = byId.get(t.concept_id);
  if (!c || !ids.has(c.id)) continue;
  if (t.en_hash === enHash(c.name, c.description)) continue;
  const code = codeOf.get(c.certification_id);
  wh[code] = (wh[code] || 0) + 1;
  if (!t.is_provisional) serving++;
}
console.log("");
console.log("  translations withheld by this batch: " + JSON.stringify(wh) + "   of which SERVING: " + serving);
console.log("  These resolve at retranslation. This script writes no hash column.");

writeFileSync(join(ROOT, "BATCH-" + batch.batch + "-APPLIED.json"), JSON.stringify({
  applied: "2026-09-22", batch: batch.batch, rows: plan.length,
  slugs: plan.map((p) => ({ cert: p.cert, slug: p.slug })),
  withheld: wh, serving_withheld: serving, untouchedHash,
}, null, 2), "utf8");
console.log("");
if (pf) { console.error(pf + " post-condition(s) FAILED."); process.exit(1); }
console.log("Batch " + batch.batch + " applied: " + plan.length + " row(s).");
