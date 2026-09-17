#!/usr/bin/env node
/**
 * measure-ksa-provisional.mjs - what would filtering `ksa_is_provisional` in
 * mcp.task actually withhold?
 *
 * READ-ONLY. --json only. Unknown flags exit 2. No --apply.
 *
 * ============ THE QUESTION ============
 *
 * `mcp.task` filters `tt.is_provisional = false and tt.review_status =
 * 'approved'`. `task_translations` ALSO carries `ksa_is_provisional`, which
 * `mcp.task` does not look at -- so a translation whose STATEMENT is approved
 * can serve KSAs that are still marked provisional.
 *
 * Two columns, two facts: `is_provisional` is about the translated STATEMENT,
 * `ksa_is_provisional` about the translated knowledge/skills/abilities. They
 * were populated by different passes, which is why they disagree.
 *
 * ============ THIS SCRIPT PAGINATES, AND THE REASON IS A FRESH SCAR ========
 *
 * The first measurement of this question asked PostgREST for `limit=10000` and
 * printed "task_translations rows: 1000". PostgREST caps a page at 1000 and
 * says nothing; the request did not fail and the number looked like an answer.
 * Every per-certification figure derived from it was a floor presented as a
 * total.
 *
 * CLAUDE.md already records this exact defect against `limit=5000` silently
 * truncating the leak scan and hiding a whole lesson group. It is the same
 * mistake, in the same repository, against the same API, eight days later.
 *
 * So: pages to exhaustion AND asserts the total against `count=exact` from the
 * server. A page loop with no count assertion is the same bug with more code.
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--json", "--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const JSON_OUT = arg("json", "");

const HERE = dirname(fileURLToPath(import.meta.url));
for (const p of [join(HERE, ".env"), join(HERE, "..", ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }
const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY };

async function raw(path, extra = {}) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + path, { headers: { ...H, ...extra }, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return { rows: JSON.parse(t), range: r.headers.get("content-range") };
    } catch (e) { last = e; }
  }
  throw last;
}

/** Page to exhaustion, then ASSERT the total against the server's own count. */
async function all(path) {
  const PAGE = 1000;
  const out = [];
  for (let from = 0; ; from += PAGE) {
    const { rows } = await raw(path, { Range: from + "-" + (from + PAGE - 1) });
    out.push(...rows);
    if (rows.length < PAGE) break;
  }
  const { range } = await raw(path + (path.includes("?") ? "&" : "?") + "limit=1", { Prefer: "count=exact" });
  const total = Number(String(range || "").split("/")[1]);
  if (!Number.isFinite(total)) throw new Error("no exact count for " + path);
  if (out.length !== total) {
    throw new Error("PAGINATION SHORT: fetched " + out.length + " of " + total + " for " + path);
  }
  return { rows: out, total };
}

const certs = (await all("certifications?select=id,code")).rows;
const byId = new Map(certs.map((c) => [c.id, c.code]));
const tasks = (await all("tasks?select=id,certification_id,is_exam_scope")).rows;
const certOf = new Map(tasks.map((t) => [t.id, byId.get(t.certification_id)]));

const tt = await all("task_translations?select=task_id,language,is_provisional,ksa_is_provisional,review_status,statement,knowledge,skills,abilities");
console.log("");
console.log("task_translations: " + tt.rows.length + " rows, count=exact agrees");

const hasKsa = (r) => !!(String(r.knowledge || "").trim() || String(r.skills || "").trim() || String(r.abilities || "").trim());
const servedNow = (r) => r.is_provisional === false && r.review_status === "approved";

const agg = new Map();
for (const r of tt.rows) {
  const k = (certOf.get(r.task_id) ?? "?") + " / " + r.language;
  const a = agg.get(k) ?? { n: 0, now: 0, ksaProv: 0, withKsa: 0, lost: 0, lostWithKsa: 0 };
  a.n++;
  if (hasKsa(r)) a.withKsa++;
  if (servedNow(r)) {
    a.now++;
    if (r.ksa_is_provisional === true) { a.lost++; if (hasKsa(r)) a.lostWithKsa++; }
  }
  if (r.ksa_is_provisional === true) a.ksaProv++;
  agg.set(k, a);
}

console.log("");
console.log("WHAT mcp.task SERVES TODAY, AND WHAT ADDING THE SECOND FILTER WOULD TAKE");
console.log("");
console.log("  cert / language          rows  served  ksa_prov  would LOSE  of those, carry KSA text");
let totLost = 0, totLostKsa = 0, totNow = 0;
for (const [k, a] of [...agg.entries()].sort()) {
  totLost += a.lost; totLostKsa += a.lostWithKsa; totNow += a.now;
  console.log("  " + k.padEnd(24) + String(a.n).padStart(4) + String(a.now).padStart(8) +
    String(a.ksaProv).padStart(10) + String(a.lost).padStart(12) + String(a.lostWithKsa).padStart(26));
}
console.log("");
console.log("  TOTAL served today " + totNow + "; filtering ksa_is_provisional would withhold " +
  totLost + " (" + totLostKsa + " of them carrying actual KSA text)");

/* THE THIRD OPTION nobody has costed: filter the KSA COLUMNS rather than the
 * ROW. A translation whose statement is approved still serves its statement;
 * only knowledge/skills/abilities go null until reviewed. */
let colOnly = 0;
for (const r of tt.rows) if (servedNow(r) && r.ksa_is_provisional === true && hasKsa(r)) colOnly++;
console.log("");
console.log("  If the KSA COLUMNS were nulled instead of the row withheld:");
console.log("    task statements still served : " + totNow);
console.log("    rows losing only their KSAs  : " + colOnly);

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({
    total: tt.rows.length,
    per: [...agg.entries()].map(([k, a]) => ({ key: k, ...a })),
    served_today: totNow, would_lose: totLost, would_lose_with_ksa: totLostKsa,
    column_only_affected: colOnly,
  }, null, 1) + "\n");
  console.log("");
  console.log("wrote " + JSON_OUT);
}
