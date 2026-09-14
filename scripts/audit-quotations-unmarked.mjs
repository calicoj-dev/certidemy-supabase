#!/usr/bin/env node
/**
 * audit-quotations-unmarked.mjs - the runs that are NOT marked as quotation.
 *
 * READ-ONLY. Companion to audit-quotations.mjs, which measures the whole corpus.
 * This one answers the only question that decides anything: of the long ISO runs
 * in lesson prose, which are presented as OURS.
 *
 * BLOCKQUOTE DETECTION IS THE WHOLE CORRECTNESS PROBLEM HERE.
 * A first pass counted a line as quoted only if it STARTED with ">". Markdown
 * blockquotes have LAZY CONTINUATION: after a "> " line, a following non-blank
 * line belongs to the same quote even without the marker. Counting those as
 * prose would put already-quoted lines on the rewrite list - the opposite of the
 * job. State is tracked across lines here, and the two counts are reported
 * separately so the difference is visible rather than assumed.
 *
 *   node scripts/audit-quotations-unmarked.mjs [--min 20] [--band 12,24] [--sample 30]
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const l of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KNOWN = new Set(["--min", "--band", "--sample"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error(`Unrecognised flag: ${a}. READ-ONLY.`); process.exit(2); }
}
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const MIN = Number(arg("min", 20));
const [BAND_LO, BAND_HI] = String(arg("band", "12,24")).split(",").map(Number);
const SAMPLE = Number(arg("sample", 30));

const PDFS = {
  "19011:2026": "C:/Users/Juan/Documents/iso-19011-2026.pdf",
  "27001:2022": "C:/Users/Juan/Documents/ISO_IEC-270012022-ed.3.pdf",
  "42001:2023": "C:/Users/Juan/Documents/iso42001.pdf",
};
const norm = (s) => String(s ?? "").replace(/\u2019/g, "'").toLowerCase()
  .replace(/[^a-z0-9.\s'-]/g, " ").replace(/\s+/g, " ").trim();

const src = {};
for (const [k, p] of Object.entries(PDFS)) {
  const o = join(mkdtempSync(join(tmpdir(), "uq-")), "t.txt");
  execFileSync("pdftotext", ["-layout", p, o]);
  src[k] = " " + norm(readFileSync(o, "utf8")) + " ";
}
const gramsAt = (n) => {
  const g = new Set();
  for (const t of Object.values(src)) { const w = t.trim().split(" "); for (let i = 0; i + n <= w.length; i++) g.add(w.slice(i, i + n).join(" ")); }
  return g;
};
const G = gramsAt(Math.min(MIN, BAND_LO));

// THE SEED LENGTH MUST EQUAL THE GRAM INDEX LENGTH. The first version seeded
// with `floor` words - 20 when looking for long runs - against an index of
// 12-grams, so no seed could ever be found and the >=20 search returned ZERO
// marked and ZERO unmarked. A false all-clear, and it was only caught because
// 0/0 contradicted an earlier measurement of 49. Seed at SEED always, extend,
// then filter by length.
const SEED = Math.min(MIN, BAND_LO);
function runsIn(text, floor) {
  const w = norm(text).split(" ").filter(Boolean);
  const out = [];
  for (let i = 0; i < w.length; ) {
    if (i + SEED > w.length) break;
    const seed = w.slice(i, i + SEED).join(" ");
    if (!G.has(seed)) { i++; continue; }
    let best = 0, which = null;
    for (const [k, t] of Object.entries(src)) {
      if (!t.includes(" " + seed + " ")) continue;
      let n = SEED;
      while (i + n + 1 <= w.length && t.includes(" " + w.slice(i, i + n + 1).join(" ") + " ")) n++;
      if (n > best) { best = n; which = k; }
    }
    if (which) { if (best >= floor) out.push({ len: best, std: which, text: w.slice(i, i + best).join(" ") }); i += best; } else i++;
  }
  return out;
}

/** Markdown blockquote state, lazy continuation included. */
function quoteMask(lines) {
  const mask = [];
  let inQ = false;
  for (const raw of lines) {
    const t = raw.trim();
    if (/^>/.test(t)) inQ = true;
    else if (t === "") inQ = false;
    else if (/^(#{1,6}\s|::|\||[-*+]\s|\d+\.\s|```)/.test(t)) inQ = false;
    // otherwise: non-blank, non-block-start, immediately after a quote -> lazy
    // continuation, inQ stays as it is.
    mask.push(inQ);
  }
  return mask;
}

const db = createClient(process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: certs, error: cErr } = await db.from("certifications").select("id, code").in("code", ["ISMS-F", "ISMS-IA", "AIMS-F", "AIMS-IA"]);
if (cErr) { console.error(`READ FAILED: ${cErr.message}`); process.exit(1); }
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const { data: mods } = await db.from("modules").select("id, certification_id");
const mine = mods.filter((m) => codeOf.has(m.certification_id));
const certOf = new Map(mine.map((m) => [m.id, codeOf.get(m.certification_id)]));
const lessons = [];
for (let f = 0; ; f += 1000) {
  const { data, error } = await db.from("lessons").select("module_id, title, content_md")
    .in("module_id", mine.map((m) => m.id)).eq("language", "en").range(f, f + 999);
  if (error) { console.error(`READ FAILED lessons: ${error.message}`); process.exit(1); }
  if (!data?.length) break; lessons.push(...data); if (data.length < 1000) break;
}

const unmarked = [], marked = [], band = [];
let namedNearby = 0;
for (const l of lessons) {
  const lines = String(l.content_md || "").split(/\n/);
  const mask = quoteMask(lines);
  for (let i = 0; i < lines.length; i++) {
    const ctx = lines.slice(Math.max(0, i - 6), i + 2).join(" ");
    const names = /clause\s*\d|annex\s*[ab]|ISO\/IEC\s*\d|ISO\s*\d/i.test(ctx);
    for (const r of runsIn(lines[i], MIN)) {
      const rec = { cert: certOf.get(l.module_id), lesson: l.title, ...r, names, line: lines[i].trim() };
      (mask[i] ? marked : unmarked).push(rec);
      if (!mask[i] && names) namedNearby++;
    }
    for (const r of runsIn(lines[i], BAND_LO)) {
      if (r.len >= BAND_LO && r.len <= BAND_HI && !mask[i]) band.push({ cert: certOf.get(l.module_id), lesson: l.title, ...r, names });
    }
  }
}

console.log(`BLOCKQUOTE DETECTION, both counts so the fix is visible`);
console.log(`  lines with a >=${MIN}-word run, INSIDE a quote (lazy continuation counted): ${marked.length}`);
console.log(`  lines with a >=${MIN}-word run, in PROSE                                  : ${unmarked.length}`);
console.log(`  of those prose runs, a clause or standard is named within 6 lines         : ${namedNearby}\n`);

console.log(`THE UNMARKED RUNS (>=${MIN} words, not inside a blockquote)\n`);
unmarked.sort((a, b) => b.len - a.len).forEach((r, n) => {
  console.log(`${String(n + 1).padStart(3)}. ${r.len}w  ${r.cert}  "${r.lesson.slice(0, 44)}"  ISO ${r.std}  clause named nearby: ${r.names ? "YES" : "no"}`);
  console.log(`     "${r.text.slice(0, 190)}"`);
});

console.log(`\n\nTHE ${BAND_LO}-${BAND_HI} BAND - sample of ${SAMPLE}, prose only\n`);
const step = Math.max(1, Math.floor(band.length / SAMPLE));
band.filter((_, i) => i % step === 0).slice(0, SAMPLE).forEach((r, n) => {
  console.log(`${String(n + 1).padStart(3)}. ${r.len}w  ${r.cert}  ISO ${r.std}  named: ${r.names ? "YES" : "no"}  "${r.text.slice(0, 120)}"`);
});
console.log(`\nband population (prose, ${BAND_LO}-${BAND_HI} words): ${band.length}`);
console.log("READ-ONLY: nothing was written.");
