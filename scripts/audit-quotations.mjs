#!/usr/bin/env node
/**
 * audit-quotations.mjs - how much of our ISO-derived corpus is ISO's words?
 *
 * READ-ONLY. No --apply, no writes. Unknown flags exit 2.
 *
 *   node scripts/audit-quotations.mjs [--min 5] [--top 40] [--curve]
 *
 * WHY. AIGRM-I_BOK states the rule: "we teach the concepts from public summaries
 * and never reproduce standard clauses verbatim... the same facts-not-expression
 * discipline that governed the Scrum work, applied a notch more carefully for
 * ISO." ISMS-IA's JTA then quotes Amendment 1:2024 verbatim. That was found by
 * accident while looking for something else, and nobody knows whether it is one
 * instance or fifty. This measures it.
 *
 * IT MATTERS MORE FOR AN MCP THAN FOR A STUDENT. A learner reading one lesson
 * that quotes eight words of a clause is fair quotation by any reading. A
 * machine endpoint that will return that lesson on demand, in bulk, to anyone
 * who asks, is redistribution at a different scale - and the JTAs are exactly
 * what an MCP would expose as structured metadata.
 *
 * THE THRESHOLD IS THE WHOLE PROBLEM AND IT IS MEASURED, NOT CHOSEN.
 * "risk treatment process", "documented information", "interested parties" are
 * the standard's words AND the only words for those things - there is no
 * paraphrase of "documented information" that a candidate would recognise. So a
 * low N measures the vocabulary of the field, not copying. --curve reports the
 * count at every N so the elbow is visible rather than asserted.
 *
 * WHAT IT CANNOT DO. It finds CONTIGUOUS runs. Close paraphrase that reorders a
 * clause is invisible to it, and so is a sentence that tracks the standard's
 * structure in different words. A clean result here is evidence, not proof.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, readdirSync, mkdtempSync } from "node:fs";
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
const KNOWN = new Set(["--min", "--top", "--curve"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}. READ-ONLY; no --apply exists.`);
    process.exit(2);
  }
}
const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const MIN = Number(arg("min", 5));
const TOP = Number(arg("top", 40));
const CURVE = process.argv.includes("--curve");

const PDFS = {
  "19011:2026": "C:/Users/Juan/Documents/iso-19011-2026.pdf",
  "27001:2022": "C:/Users/Juan/Documents/ISO_IEC-270012022-ed.3.pdf",
  "42001:2023": "C:/Users/Juan/Documents/iso42001.pdf",
};

/** Words only, lowercase, punctuation gone. Clause numbers are KEPT - "6.1.3"
 *  is a word here, because a run that includes the clause number is stronger
 *  evidence of copying than one that does not. */
const norm = (s) => String(s ?? "")
  .replace(/\u2019/g, "'")
  .toLowerCase()
  .replace(/[^a-z0-9.\s'-]/g, " ")
  .replace(/\s+/g, " ")
  .trim();

function pdfWords(path) {
  const out = join(mkdtempSync(join(tmpdir(), "qa-")), "t.txt");
  execFileSync("pdftotext", ["-layout", path, out]);
  return norm(readFileSync(out, "utf8"));
}

console.log("QUOTATION AUDIT - contiguous word runs shared with the ISO sources");
console.log("(contiguous only: close paraphrase that reorders a clause is invisible here)\n");

const sources = {};
for (const [k, p] of Object.entries(PDFS)) {
  if (!existsSync(p)) { console.error(`missing PDF: ${p}`); process.exit(2); }
  sources[k] = " " + pdfWords(p) + " ";
  console.log(`  loaded ISO ${k}: ${sources[k].split(" ").length - 2} words`);
}

// Fast rejection: the set of MIN-grams across all three standards.
const grams = new Set();
for (const text of Object.values(sources)) {
  const w = text.trim().split(" ");
  for (let i = 0; i + MIN <= w.length; i++) grams.add(w.slice(i, i + MIN).join(" "));
}
console.log(`  ${grams.size} distinct ${MIN}-grams indexed\n`);

/** Longest run starting at i, and which standard it came from. */
function longestRun(w, i) {
  if (i + MIN > w.length) return null;
  const seed = w.slice(i, i + MIN).join(" ");
  if (!grams.has(seed)) return null;
  let best = MIN, which = null;
  for (const [k, text] of Object.entries(sources)) {
    if (!text.includes(" " + seed + " ")) continue;
    let n = MIN;
    while (i + n + 1 <= w.length && text.includes(" " + w.slice(i, i + n + 1).join(" ") + " ")) n++;
    if (n >= best) { best = n; which = k; }
  }
  return which ? { len: best, std: which, text: w.slice(i, i + best).join(" ") } : null;
}

function scan(label, kind, body) {
  const w = norm(body).split(" ").filter(Boolean);
  const hits = [];
  for (let i = 0; i < w.length; ) {
    const r = longestRun(w, i);
    if (r) { hits.push({ ...r, label, kind }); i += r.len; } else i++;
  }
  return hits;
}

// ---------------------------------------------------------------- corpus
const ISO_CERTS = ["ISMS-F", "ISMS-IA", "AIMS-F", "AIMS-IA"];
const all = [];

// FILES: JTAs, BoKs, scheme documents. These are what an MCP would expose as
// structured metadata, so they are scanned first and reported separately.
const fileSets = [
  ["JTA", join(ROOT, "jta"), (f) => /_JTA_|_BoK|_BOK/i.test(f) && f.endsWith(".md")],
  ["BoK", ROOT, (f) => /^BOK-|_BOK\.md$/i.test(f)],
  ["scheme", ROOT, (f) => /^SCHEME-/.test(f) && f.endsWith(".md")],
];
for (const [kind, dir, pick] of fileSets) {
  if (!existsSync(dir)) continue;
  for (const f of readdirSync(dir).filter(pick)) {
    if (!ISO_CERTS.some((c) => f.includes(c))) continue;
    all.push(...scan(f, kind, readFileSync(join(dir, f), "utf8")));
  }
}

// DATABASE: lessons, concepts, tasks, items.
const db = createClient(
  process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } });

const { data: certs, error: cErr } = await db.from("certifications").select("id, code").in("code", ISO_CERTS);
if (cErr) { console.error(`READ FAILED: ${cErr.message}`); process.exit(1); }
const codeOf = new Map(certs.map((c) => [c.id, c.code]));
const ids = certs.map((c) => c.id);

const page = async (table, cols, extra = (q) => q) => {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await extra(db.from(table).select(cols).in("certification_id", ids)).range(from, from + 999);
    if (error) { console.error(`READ FAILED ${table}: ${error.message}`); process.exit(1); }
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
};

// lessons reach a certification through modules, not directly.
const mods = await page("modules", "id, certification_id");
const certOfModule = new Map(mods.map((m) => [m.id, m.certification_id]));
{
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("lessons")
      .select("module_id, title, content_md")
      .in("module_id", mods.map((m) => m.id))
      .eq("language", "en").range(from, from + 999);
    if (error) { console.error(`READ FAILED lessons: ${error.message}`); process.exit(1); }
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  for (const l of rows)
    all.push(...scan(`${codeOf.get(certOfModule.get(l.module_id))}/${(l.title || "").slice(0, 40)}`, "lesson", l.content_md));
}
for (const c of await page("concepts", "certification_id, slug, description"))
  all.push(...scan(`${codeOf.get(c.certification_id)}/${c.slug}`, "concept", c.description));
for (const t of await page("tasks", "certification_id, code, statement, knowledge, skills, abilities"))
  all.push(...scan(`${codeOf.get(t.certification_id)}/${t.code}`, "task", [t.statement, t.knowledge, t.skills, t.abilities].join(" ")));
for (const q of await page("quiz_questions", "certification_id, pool, question_text, explanation, options", (x) => x.eq("language", "en").is("retired_at", null)))
  all.push(...scan(`${codeOf.get(q.certification_id)}/${q.pool}`, "item",
    [q.question_text, q.explanation, (q.options || []).map((o) => o.text).join(" ")].join(" ")));

// ---------------------------------------------------------------- report
if (CURVE) {
  console.log("THE THRESHOLD CURVE - runs at or above each length");
  console.log("(the elbow is where field vocabulary stops and copying starts)\n");
  for (let n = MIN; n <= 25; n++) {
    const c = all.filter((h) => h.len >= n).length;
    if (c === 0) { console.log(`  >=${String(n).padStart(2)} words : 0`); break; }
    console.log(`  >=${String(n).padStart(2)} words : ${String(c).padStart(5)}  ${"#".repeat(Math.min(60, Math.round(Math.log2(c + 1) * 6)))}`);
  }
  console.log("");
}

const byKind = {};
for (const h of all) {
  byKind[h.kind] ??= { n: 0, max: 0, long: 0 };
  byKind[h.kind].n++;
  byKind[h.kind].max = Math.max(byKind[h.kind].max, h.len);
  if (h.len >= 12) byKind[h.kind].long++;
}
console.log("BY LOCATION");
for (const [k, v] of Object.entries(byKind).sort((a, b) => b[1].long - a[1].long || b[1].max - a[1].max))
  console.log(`  ${k.padEnd(8)} ${String(v.n).padStart(5)} runs, longest ${String(v.max).padStart(3)} words, ${String(v.long).padStart(4)} at >=12`);

console.log("\nLONGEST RUNS");
for (const h of all.sort((a, b) => b.len - a.len).slice(0, TOP))
  console.log(`  ${String(h.len).padStart(3)}w  ${h.kind.padEnd(7)} ${h.label.slice(0, 38).padEnd(38)} ISO ${h.std}\n        "${h.text.slice(0, 150)}"`);

console.log(`\n${all.length} runs of >=${MIN} words across ${new Set(all.map((h) => h.label)).size} documents.`);
console.log("READ-ONLY: nothing was written.");
