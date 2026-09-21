#!/usr/bin/env node
/**
 * scan-concept-iso.mjs
 *
 * How much of `concepts.description` reproduces ISO wording, in English.
 *
 * READ-ONLY. No --apply, no writes. Unknown flags exit 2.
 *
 * WHY THIS RUNS BEFORE ANY TRANSLATION DECISION
 *   Translating text that has to be repaired is the ordering mistake this
 *   project already paid for once: repair first, translate second. A concept
 *   description DEFINES a term that a standard also defines, which is exactly
 *   the shape most likely to reproduce the standard's own wording.
 *
 * SAME MACHINERY AS scan-iso-leaks, DELIBERATELY. Same PDFs, same SEED, same
 * threshold from `mcp_leak_policy`, same longest-contiguous-run measure. A
 * second implementation of the leak measure would be a mirrored pair, and the
 * two would disagree eventually.
 */

import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PDFS, sourcesAvailable, pdftotextAvailable } from "./lib/citation-index.mjs";

for (const a of process.argv.slice(2)) {
  if (a !== "--json") {
    console.error("unknown flag: " + a + " -- this script is READ-ONLY and takes --json only");
    process.exit(2);
  }
}
const JSON_OUT = process.argv.includes("--json");

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

if (!pdftotextAvailable()) {
  console.error("pdftotext IS NOT ON PATH. Refusing: an absent source yields an empty");
  console.error("index, and an empty index reports every description clean.");
  process.exit(2);
}
if (!sourcesAvailable()) {
  console.error("THE STANDARDS ARE NOT ON DISK. Refusing to scan.");
  for (const [k, p] of Object.entries(PDFS)) console.error("  " + k.padEnd(12) + (existsSync(p) ? "ok" : "MISSING"));
  process.exit(2);
}

async function all(path) {
  const rows = []; let from = 0, total = null;
  for (;;) {
    let page = null;
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(REST + "/" + path, {
          headers: { ...H, Range: from + "-" + (from + 499), Prefer: "count=exact" },
          signal: AbortSignal.timeout(60000),
        });
        if (!r.ok) throw new Error("HTTP " + r.status);
        total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
        page = await r.json(); break;
      } catch (e) { if (i === 7) throw e; }
    }
    rows.push(...page);
    if (page.length < 500) break;
    from += 500;
  }
  if (total !== null && rows.length !== total) throw new Error("SHORT READ on " + path + ": " + rows.length + " of " + total);
  return rows;
}

const SEED = 5;
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "ci-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8");
}

/* Exported so gen-concept-repair-queue reuses THIS index and THIS measure.
 * A second implementation would be a mirrored pair and the two would
 * disagree eventually -- the failure this repository keeps paying for. */
export const grams = new Set();
for (const [label, path] of Object.entries(PDFS)) {
  const w = norm(pdfText(path)).split(" ").filter(Boolean);
  if (w.length < 1000) { console.error("  " + label + " extracted " + w.length + " words -- refusing"); process.exit(1); }
  for (let i = 0; i + SEED <= w.length; i++) grams.add(w.slice(i, i + SEED).join(" "));
}
/* CONTROL. An empty index reports everything clean. The floor is deliberately
 * LOW and is only a smoke check: the real control is the positive canary
 * below, which proves the measure can actually fire. A guessed gram count
 * aborted this script's first run against a perfectly good index of 41,425 --
 * a literal standing in for a property, again. */
if (grams.size < 5000) { console.error("index holds only " + grams.size + " grams -- not credible"); process.exit(2); }

export function longestRun(text) {
  const w = norm(text).split(" ").filter(Boolean);
  let best = 0, bestText = "";
  for (let i = 0; i + SEED <= w.length; i++) {
    if (!grams.has(w.slice(i, i + SEED).join(" "))) continue;
    let n = SEED;
    while (i + n + 1 <= w.length && grams.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    if (n > best) { best = n; bestText = w.slice(i, i + n).join(" "); }
    i += n - 1;
  }
  return { best, bestText };
}
/* POSITIVE CONTROL. A sentence lifted verbatim from a held standard must score
 * at or above the threshold; if it does not, the measure is not working and a
 * clean result means nothing. */
const CANARY = "the organization shall determine external and internal issues that are relevant to its purpose";
const canary = longestRun(CANARY).best;

const policy = await all("mcp_leak_policy?select=threshold_words");
const THRESHOLD = policy[0].threshold_words;
if (canary < THRESHOLD) {
  console.error("POSITIVE CONTROL FAILED: a verbatim ISO sentence scored " + canary +
    " against a threshold of " + THRESHOLD + ". The index or the measure is broken.");
  process.exit(2);
}

export { all, THRESHOLD };

/* Only report when executed directly; importing must not run the scan. */
const IS_MAIN = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (!IS_MAIN) { /* imported for grams/longestRun/THRESHOLD */ } else {
const certs = Object.fromEntries((await all("certifications?select=id,code")).map((c) => [c.id, c.code]));
const rows = await all("concepts?select=id,slug,name,description,certification_id");
if (!rows.length) { console.error("read 0 concepts -- the probe cannot see the table"); process.exit(2); }

const scored = rows.map((r) => {
  const d = r.description ?? "";
  const { best, bestText } = longestRun(d);
  return { ...r, cert: certs[r.certification_id] ?? "?", words: norm(d).split(" ").filter(Boolean).length, run: best, bestText };
});

const byCert = scored.reduce((m, r) => { (m[r.cert] ||= []).push(r); return m; }, {});
const over = scored.filter((r) => r.run >= THRESHOLD);

if (JSON_OUT) { console.log(JSON.stringify({ threshold: THRESHOLD, canary, total: rows.length, over: over.length, byCert }, null, 2)); process.exit(0); }

console.log("");
console.log("  index " + grams.size + " grams | threshold " + THRESHOLD + "w | positive control scored " + canary + "w");
console.log("  " + rows.length + " concepts, " + scored.filter((r) => !r.description).length + " with no description");
console.log("");
console.log("  cert          n   no-desc   median words   max run   >= threshold");
for (const [c, rs] of Object.entries(byCert).sort()) {
  const ws = rs.map((r) => r.words).sort((a, b) => a - b);
  const med = ws.length ? ws[Math.floor(ws.length / 2)] : 0;
  const mx = Math.max(...rs.map((r) => r.run));
  const ov = rs.filter((r) => r.run >= THRESHOLD).length;
  console.log("  " + c.padEnd(12) + String(rs.length).padStart(4) + String(rs.filter((r) => !r.description).length).padStart(9) +
    String(med).padStart(14) + String(mx).padStart(10) + String(ov).padStart(15));
}
console.log("");
console.log("  " + over.length + " of " + rows.length + " description(s) reach the leak threshold");
for (const r of over.sort((a, b) => b.run - a.run).slice(0, 20)) {
  console.log("    " + String(r.run).padStart(3) + "w  " + r.cert.padEnd(10) + r.slug.slice(0, 34).padEnd(36) + '"' + r.bestText.slice(0, 60) + '"');
}
const dist = [0, 5, 8, 10, 12, 15, 20];
console.log("");
console.log("  run-length distribution");
for (let i = 0; i < dist.length; i++) {
  const lo = dist[i], hi = dist[i + 1] ?? 999;
  const n = scored.filter((r) => r.run >= lo && r.run < hi).length;
  console.log("    " + String(lo).padStart(3) + "-" + String(hi === 999 ? "+" : hi - 1).padEnd(4) + String(n).padStart(6));
}
}
