#!/usr/bin/env node
/**
 * measure-blockquote-omission.mjs - could the MCP omit blockquoted clause text
 * and declare it, the way it already omits checkpoints?
 *
 * READ-ONLY. --json only. Unknown flags exit 2.
 *
 * ============ THE OPTION BEING TESTED ============
 *
 * `courseware-read` already serves less than the app: it replaces `content_md`
 * with PUBLISHED_BLOCKS, so ::checkpoint never leaves the function. The
 * proposal is to extend that to blockquoted clause text -- omit it, report the
 * omission, leave the lesson whole for learners.
 *
 * It is strictly better than converting IF the lessons survive the omission.
 * Converting a blockquote rewrites the lesson for every learner to satisfy a
 * surface most of them never touch, and on an auditor certification reading the
 * clause may be the skill being taught.
 *
 * ============ WHAT KILLS IT ============
 *
 * A LEAD-IN THAT DANGLES. "The clause reads:" followed by nothing is worse than
 * either converting or withholding -- it is a visible hole that reads as a bug,
 * and an agent relaying it would report the lesson as broken.
 *
 * So this counts, for every blockquote carrying an ISO run:
 *
 *   DANGLING   the preceding line ends in a colon, or announces a quotation
 *              ("reads", "states", "says", "puts it", "as follows"). Omitting
 *              the quote leaves the announcement pointing at nothing.
 *   ORPHANING  the blockquote is the only non-empty content of its block.
 *              Omitting it leaves an empty block.
 *   SAFE       preceded by self-contained prose that still reads without it.
 *
 * If DANGLING + ORPHANING is most of the 48, the option is dead and the
 * measurement says so rather than the plan pretending otherwise.
 */
import { readFileSync, existsSync, writeFileSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { blocks, solid } from "./lib/guide-runs.mjs";
import { PDFS, sourcesAvailable } from "./lib/citation-index.mjs";

const KNOWN = new Set(["--json", "--cert", "--verbose"]);
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
const CERT = arg("cert", "ISMS-IA");
const VERBOSE = process.argv.includes("--verbose");

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
      if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 160));
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
const grams = new Set();
for (const p of Object.values(PDFS)) {
  const w = norm(pdfText(p)).split(" ").filter(Boolean);
  for (let i = 0; i + 5 <= w.length; i++) grams.add(w.slice(i, i + 5).join(" "));
}
function longestRun(t) {
  const w = norm(t).split(" ").filter(Boolean);
  let b = 0;
  for (let i = 0; i + 5 <= w.length; i++) {
    if (!grams.has(w.slice(i, i + 5).join(" "))) continue;
    let n = 5;
    while (i + n + 1 <= w.length && grams.has(w.slice(i + n + 1 - 5, i + n + 1).join(" "))) n++;
    if (n > b) b = n;
    i += n - 1;
  }
  return b;
}

/* A lead-in that cannot stand without what follows it. */
const ANNOUNCES = /(reads|states|says|puts it|worth quoting|as follows|is explicit|is direct|in full|verbatim|quote)\s*[:.]?\s*$/i;
const ENDS_COLON = /:\s*$/;

const certs = await g("certifications?select=id,code");
const id = certs.find((c) => c.code === CERT)?.id;
if (!id) { console.error("no certification " + CERT); process.exit(2); }
const mods = await g("modules?select=id&certification_id=eq." + id);
const rows = await g("lessons?select=id,slug,mcp_servable,content_md&language=eq.en&module_id=in.(" +
  mods.map((m) => m.id).join(",") + ")");

const findings = [];
for (const r of rows) {
  const bs = blocks(r.content_md);
  for (let bi = 0; bi < bs.length; bi++) {
    const sol = solid(bs[bi]);
    for (let li = 0; li < sol.length; li++) {
      const t = sol[li].text;
      if (!t.trim().startsWith(">")) continue;
      const run = longestRun(t);
      if (run < 10) continue;

      /* The preceding NON-BLOCKQUOTE line in the same block, if any. */
      let prev = null;
      for (let k = li - 1; k >= 0; k--) {
        if (!sol[k].text.trim().startsWith(">")) { prev = sol[k].text.trim(); break; }
      }
      /* Would omitting every quoted line empty this block? */
      const nonQuote = sol.filter((l) => !l.text.trim().startsWith(">"));
      const orphaning = nonQuote.length === 0;
      const dangling = prev !== null && (ENDS_COLON.test(prev) || ANNOUNCES.test(prev));

      findings.push({
        slug: r.slug, servable: r.mcp_servable, block: bi, line: li, run_words: run,
        verdict: orphaning ? "ORPHANING" : dangling ? "DANGLING" : "SAFE",
        lead_in: prev ? prev.slice(0, 160) : null,
        quote: t.trim().slice(0, 140),
      });
    }
  }
}

const by = { SAFE: 0, DANGLING: 0, ORPHANING: 0 };
for (const f of findings) by[f.verdict]++;

console.log("");
console.log(CERT + ": blockquotes carrying an ISO run of 10+ words");
console.log("  total " + findings.length);
console.log("    SAFE       " + String(by.SAFE).padStart(3) + "   preceded by prose that stands without the quote");
console.log("    DANGLING   " + String(by.DANGLING).padStart(3) + "   lead-in ends in a colon or announces a quotation");
console.log("    ORPHANING  " + String(by.ORPHANING).padStart(3) + "   the quote is the only content of its block");
console.log("");
const dead = by.DANGLING + by.ORPHANING;
console.log("  omission would leave a visible hole in " + dead + " of " + findings.length +
  " (" + Math.round(100 * dead / (findings.length || 1)) + "%)");

if (VERBOSE) {
  for (const v of ["DANGLING", "ORPHANING", "SAFE"]) {
    const sel = findings.filter((f) => f.verdict === v);
    if (!sel.length) continue;
    console.log("");
    console.log("  == " + v + " (" + sel.length + ") ==");
    for (const f of sel.slice(0, 12)) {
      console.log("    " + f.slug + " b" + f.block + "l" + f.line + "  " + f.run_words + "w");
      console.log("      lead-in: " + (f.lead_in ?? "(none -- first line of its block)"));
      console.log("      quote  : " + f.quote);
    }
  }
}

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({ cert: CERT, counts: by, findings }, null, 1) + "\n");
  console.log("");
  console.log("wrote " + JSON_OUT);
}
