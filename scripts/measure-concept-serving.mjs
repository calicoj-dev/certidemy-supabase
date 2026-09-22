#!/usr/bin/env node
/**
 * measure-concept-serving.mjs -- serving percentages FROM THE ENDPOINT.
 *
 * READ-ONLY. Takes --json. Unknown flags exit 2. Writes nothing to the database.
 *
 * ============ WHY IT IS NOT A DATABASE QUERY ============
 *
 * Every serving figure quoted this week came from querying mcp.concept as an
 * admin. That reports what the GATE decided. The claim being made is that an
 * unauthenticated partner receives the rows, and from 364 until 365 that claim
 * was false for every non-English row while the view said 100 percent.
 *
 * So this holds no credential and counts what courseware-read actually returns.
 *
 * ============ THE ENDPOINT HAS NO OFFSET, AND limit CAPS AT 200 ============
 *
 * AISM-I has 226 concepts. One call returns 200 and HTTP 200, which is the
 * cap wearing the costume of an answer -- this repository's oldest recorded
 * defect, and it would silently understate the very number it is here to
 * produce.
 *
 * There is no cursor on this resource, so the corpus is partitioned by
 * `task_code` and de-duplicated by slug. Every concept is reachable from a
 * task (verify-invariants asserts exactly that over 1,730 rows), so the
 * partition is total.
 *
 * AND THE PARTITION IS ASSERTED, NOT TRUSTED. The de-duplicated slug count is
 * compared against the database's own count of live concepts for that
 * certification, and a mismatch THROWS. A partition that silently missed a
 * task would otherwise produce a smaller denominator and a HIGHER serving
 * percentage -- the direction that flatters.
 *
 * The database is used for the DENOMINATOR CHECK only. Every served/withheld
 * decision in the output came off the wire.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--json"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY; takes --json only.");
    process.exit(2);
  }
}
const JSON_OUT = process.argv.includes("--json");

const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is needed for the denominator check only."); process.exit(2); }

const FN = "https://pctynukndxnmnxiqpgck.supabase.co/functions/v1/courseware-read";
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* Persistence separates a real refusal from pooler exhaustion -- the endpoint
 * answers {"error":"read failed"} for both. See check-mcp-wire.mjs. */
async function fn(body) {
  let lastRes = null, lastErr = null;
  for (let i = 0; i < 5; i++) {
    if (i > 0) await sleep(1200 * i * i);
    try {
      const r = await fetch(FN, {
        method: "POST",
        headers: { "content-type": "application/json", "x-mcp-client": "measure-concept-serving" },
        body: JSON.stringify(body), signal: AbortSignal.timeout(45000),
      });
      const text = await r.text();
      let json = null; try { json = JSON.parse(text); } catch { /* below */ }
      lastRes = { status: r.status, json, text };
      if (r.status < 500) return lastRes;
    } catch (e) { lastErr = e; }
  }
  return lastRes ?? { status: 0, json: null, text: String(lastErr?.message || lastErr) };
}

/* countWhere, not a fetch-and-length. Asking the server for a count is the
 * only form that cannot be truncated. */
async function countWhere(path) {
  const r = await fetch(REST + "/" + path + "&limit=1", {
    headers: { apikey: KEY, Authorization: "Bearer " + KEY, Prefer: "count=exact" },
  });
  if (!r.ok) throw new Error("count failed on " + path + ": HTTP " + r.status);
  const n = Number(String(r.headers.get("content-range") || "").split("/")[1]);
  if (!Number.isFinite(n)) throw new Error("no parseable content-range on " + path);
  return n;
}

const CERTS = ["AIE-I", "AIGRM-I", "AIHR-I", "AIMS-F", "AIMS-IA", "AISM-I",
               "ISMS-F", "ISMS-IA", "SD-AI-I", "SM-AI-I", "SM-AI-II", "SPO-AI-I"];
const LANGS = ["es-419", "pt-BR"];

/* Expected live-concept count per certification, from the database. */
const certRows = await (async () => {
  const r = await fetch(REST + "/certifications?select=id,code", {
    headers: { apikey: KEY, Authorization: "Bearer " + KEY },
  });
  return r.json();
})();
const idOf = new Map(certRows.map((c) => [c.code, c.id]));

const expected = new Map();
for (const c of CERTS) {
  expected.set(c, await countWhere("concepts?select=id&retired_at=is.null&certification_id=eq." + idOf.get(c)));
}

async function taskCodes(cert) {
  const r = await fn({ resource: "task", certification: cert, language: "en", limit: 200 });
  if (r.status !== 200) throw new Error("task read failed for " + cert + ": HTTP " + r.status);
  return [...new Set((r.json.rows || []).map((t) => t.task_code))];
}

async function conceptsFor(cert, lang, total) {
  const seen = new Map();
  /* One call where the whole corpus provably fits under the cap, partitioned
   * otherwise. The threshold is the CAP, not a guess about size. */
  if (total < 200) {
    const r = await fn({ resource: "concept", certification: cert, language: lang, limit: 200 });
    if (r.status !== 200) throw new Error(cert + "/" + lang + ": HTTP " + r.status + " " + (r.json?.error ?? ""));
    for (const row of r.json.rows || []) seen.set(row.slug, row.description_is_fallback === true);
    await sleep(300);
  } else {
    for (const code of await taskCodes(cert)) {
      const r = await fn({ resource: "concept", certification: cert, language: lang, task_code: code, limit: 200 });
      if (r.status !== 200) throw new Error(cert + "/" + lang + "/" + code + ": HTTP " + r.status);
      if ((r.json.rows || []).length >= 200) throw new Error("task " + code + " filled the cap; the partition is too coarse");
      for (const row of r.json.rows || []) seen.set(row.slug, row.description_is_fallback === true);
      await sleep(300);
    }
  }
  return seen;
}

console.log("");
console.log("CONCEPT SERVING, MEASURED AT THE ENDPOINT -- no credential");
console.log("");
console.log("  cert        lang      concepts  translated  fallback   serving");

const out = [];
let bad = 0;
for (const cert of CERTS) {
  const total = expected.get(cert);
  for (const lang of LANGS) {
    let seen;
    try { seen = await conceptsFor(cert, lang, total); }
    catch (e) { console.log("  " + cert.padEnd(11) + lang.padEnd(9) + "FAILED  " + e.message); bad++; continue; }

    /* THE DENOMINATOR CHECK. A partition that missed rows would raise the
     * percentage, so this must throw rather than warn. */
    if (seen.size !== total) {
      console.log("  " + cert.padEnd(11) + lang.padEnd(9) +
        "SHORT READ  saw " + seen.size + " of " + total + " -- figure withheld");
      bad++;
      continue;
    }
    const fallback = [...seen.values()].filter(Boolean).length;
    const served = seen.size - fallback;
    const pct = (100 * served / seen.size).toFixed(1);
    console.log("  " + cert.padEnd(11) + lang.padEnd(9) +
      String(total).padStart(8) + String(served).padStart(12) +
      String(fallback).padStart(10) + (pct + "%").padStart(10));
    out.push({ cert, lang, concepts: total, translated: served, fallback, serving_pct: Number(pct) });
  }
}

const totalConcepts = out.reduce((a, r) => a + r.concepts, 0);
const totalServed = out.reduce((a, r) => a + r.translated, 0);
console.log("");
console.log("  " + out.length + " of " + (CERTS.length * LANGS.length) + " pairs measured; " +
  totalServed + " of " + totalConcepts + " renderings translated on the wire (" +
  (100 * totalServed / totalConcepts).toFixed(1) + "%)");

if (JSON_OUT) {
  writeFileSync(join(ROOT, "CONCEPT-SERVING-ON-THE-WIRE.json"),
    JSON.stringify({ measured: new Date().toISOString(), source: "courseware-read, unauthenticated", rows: out }, null, 2), "utf8");
  console.log("  wrote CONCEPT-SERVING-ON-THE-WIRE.json");
}
if (bad) { console.error("  " + bad + " pair(s) could not be measured."); process.exit(1); }
