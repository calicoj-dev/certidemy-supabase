#!/usr/bin/env node
/**
 * iso-passage-census.mjs - how many DISTINCT stretches of ISO text does the
 * corpus reproduce, as opposed to how many times it reproduces one.
 *
 * READ-ONLY. Writes nothing but --json. Unknown flags exit 2.
 *
 * ============ WHY THE RUN COUNT IS THE WRONG NUMBER ============
 *
 * 484 English runs of >=10 words across the four ISO certifications. That
 * number sizes the DETECTION, not the REPAIR. If clause 10.2 is quoted in six
 * lessons, six runs are one editorial decision made six times -- and if a
 * seventh lesson quotes fifteen words of the same clause the shorter run is not
 * a separate passage either, it is a shorter cut of the same one.
 *
 * So the runs are mapped back to their POSITION IN THE STANDARD and merged.
 * Two runs belong to the same passage when they overlap the same stretch of the
 * same document, whatever their lengths and whatever lessons they came from.
 *
 * This is the same mistake family as the GROUP BY over a nullable key in
 * CLAUDE.md: a count taken at the wrong grain reads as a finding. "484 passages
 * to repair" would have been a plan built on it.
 *
 * ============ WHAT IT CANNOT TELL YOU ============
 *
 * Merging is positional, so two ADJACENT quotations from the same clause with a
 * sentence of Certidemy's prose between them merge into one passage if their
 * spans touch. That undercounts editorial decisions slightly and never
 * overcounts them, which is the safe direction for a number someone is about to
 * budget against.
 */
import { readFileSync, existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PDFS, sourcesAvailable } from "./lib/citation-index.mjs";

const KNOWN = new Set(["--json", "--min", "--cert", "--top", "--lang"]);
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
const MIN = Number(arg("min", "10"));
const TOP = Number(arg("top", "12"));
const LANG = arg("lang", "en");
const ONLY = arg("cert", "");
const JSON_OUT = arg("json", "");
const SEED = 5;

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
async function g(p) {
  let last;
  for (let i = 0; i < 12; i++) {
    try {
      const r = await fetch(BASE + "/" + p, { headers: H, signal: AbortSignal.timeout(60000) });
      const t = await r.text();
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 200));
      return JSON.parse(t);
    } catch (e) { last = e; }
  }
  throw last;
}
const norm = (s) => String(s || "").toLowerCase()
  .replace(/[‘’]/g, "'").replace(/[^a-z0-9' ]+/g, " ").replace(/\s+/g, " ").trim();
function pdfText(p) {
  const o = join(mkdtempSync(join(tmpdir(), "iso-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  return readFileSync(o, "utf8");
}

if (!sourcesAvailable()) { console.error("standards not on disk"); process.exit(2); }

/* ---- the standards, kept as WORD ARRAYS so a run can be located, not just matched */
const STD = {};
const seedPos = new Map();      // 5-gram -> [{std, at}]
for (const [label, path] of Object.entries(PDFS)) {
  const w = norm(pdfText(path)).split(" ").filter(Boolean);
  STD[label] = w;
  for (let i = 0; i + SEED <= w.length; i++) {
    const k = w.slice(i, i + SEED).join(" ");
    if (!seedPos.has(k)) seedPos.set(k, []);
    seedPos.get(k).push({ std: label, at: i });
  }
}
const grams = new Set(seedPos.keys());
console.log("");
console.log("index: " + grams.size + " " + SEED + "-grams across " + Object.keys(STD).length + " standards");
if (grams.size < 10000) { console.error("index too small to trust"); process.exit(1); }

/** Every run of >= MIN words in `text`, located in the standard it came from. */
function locatedRuns(text) {
  const w = norm(text).split(" ").filter(Boolean);
  const out = [];
  for (let i = 0; i + SEED <= w.length; i++) {
    const seed = w.slice(i, i + SEED).join(" ");
    if (!grams.has(seed)) continue;
    let n = SEED;
    while (i + n + 1 <= w.length && grams.has(w.slice(i + n + 1 - SEED, i + n + 1).join(" "))) n++;
    if (n >= MIN) {
      const run = w.slice(i, i + n);
      /* Locate it. Take the longest exact alignment among candidate positions;
       * a run can seed in more than one standard and the right home is the one
       * that actually contains all of it. */
      let home = null;
      for (const c of seedPos.get(seed) ?? []) {
        const sw = STD[c.std];
        let k = 0;
        while (k < run.length && c.at + k < sw.length && sw[c.at + k] === run[k]) k++;
        if (!home || k > home.len) home = { std: c.std, at: c.at, len: k };
      }
      if (home) out.push({ words: n, text: run.join(" "), std: home.std, from: home.at, to: home.at + home.len });
    }
    i += n - 1;
  }
  return out;
}

/* --------------------------------------------------------------- the corpus */
const CERTS = ONLY ? [ONLY] : ["ISMS-F", "AIMS-F", "ISMS-IA", "AIMS-IA"];
const certs = await g("certifications?select=id,code");
const idOf = Object.fromEntries(certs.map((c) => [c.code, c.id]));

const hits = [];
for (const code of CERTS) {
  const mods = await g("modules?select=id&certification_id=eq." + idOf[code]);
  const rows = await g("lessons?select=id,slug,content_md&language=eq." + LANG +
    "&module_id=in.(" + mods.map((m) => m.id).join(",") + ")");
  for (const r of rows) for (const h of locatedRuns(r.content_md)) hits.push({ cert: code, slug: r.slug, ...h });
}
console.log("raw runs >=" + MIN + "w (" + LANG + "): " + hits.length);

/* ------------------------------------------------- merge into distinct passages */
const byStd = {};
for (const h of hits) (byStd[h.std] ||= []).push(h);
const passages = [];
for (const [std, list] of Object.entries(byStd)) {
  list.sort((a, b) => a.from - b.from);
  let cur = null;
  for (const h of list) {
    if (cur && h.from <= cur.to) {         // overlapping or touching
      cur.to = Math.max(cur.to, h.to);
      cur.instances.push(h);
    } else {
      if (cur) passages.push(cur);
      cur = { std, from: h.from, to: h.to, instances: [h] };
    }
  }
  if (cur) passages.push(cur);
}
for (const p of passages) {
  p.words = p.to - p.from;
  p.text = STD[p.std].slice(p.from, p.to).join(" ");
  p.certs = [...new Set(p.instances.map((i) => i.cert))];
  p.lessons = [...new Set(p.instances.map((i) => i.cert + "/" + i.slug))];
}
passages.sort((a, b) => b.instances.length - a.instances.length || b.words - a.words);

console.log("");
console.log("=".repeat(76));
console.log("DISTINCT PASSAGES: " + passages.length + "   (from " + hits.length + " runs)");
console.log("reuse factor: " + (hits.length / (passages.length || 1)).toFixed(2) + " runs per passage");
console.log("=".repeat(76));

/* per certification: distinct passages that appear in it, and how many are ITS OWN */
console.log("");
console.log("cert        runs   distinct passages   passages unique to it");
for (const code of CERTS) {
  const mine = passages.filter((p) => p.certs.includes(code));
  const only = mine.filter((p) => p.certs.length === 1);
  const runs = hits.filter((h) => h.cert === code).length;
  console.log("  " + code.padEnd(10) + String(runs).padStart(4) + "   " +
    String(mine.length).padStart(17) + "   " + String(only.length).padStart(21));
}

console.log("");
console.log("SHARED ACROSS CERTIFICATIONS: " + passages.filter((p) => p.certs.length > 1).length +
  " passage(s) appear in more than one");
console.log("REPEATED WITHIN THE CORPUS  : " + passages.filter((p) => p.instances.length > 1).length +
  " passage(s) are quoted more than once");

console.log("");
console.log("THE MOST-REUSED PASSAGES (repair once, fixes many):");
for (const p of passages.slice(0, TOP)) {
  console.log("  x" + String(p.instances.length).padStart(2) + "  " + String(p.words).padStart(3) + "w  " +
    p.std + "  [" + p.certs.join(",") + "]");
  console.log("        \"" + p.text.slice(0, 116) + "\"");
}

const singles = passages.filter((p) => p.instances.length === 1).length;
console.log("");
console.log("  quoted once only: " + singles + " of " + passages.length +
  " (" + Math.round(100 * singles / (passages.length || 1)) + "%)");

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify(passages.map((p) => ({
    std: p.std, words: p.words, text: p.text, instances: p.instances.length,
    certs: p.certs, lessons: p.lessons,
  })), null, 1) + "\n");
  console.log("  wrote " + JSON_OUT);
}
