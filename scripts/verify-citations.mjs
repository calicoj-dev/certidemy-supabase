#!/usr/bin/env node
/**
 * verify-citations.mjs - does every clause an item cites actually EXIST?
 *
 * WHY THIS EXISTS
 * ---------------
 * ISMS-IA's secure bank cited ISO 19011:2018 in 63 items while the 2026 PDF sat
 * in the project folder. The cause was structural: groundingFor() was called
 * once in item-pipeline.mjs, inside draftSystem, and critiqueSystem - which
 * holds rule 7, FALSE ATTRIBUTION, and rewrites citations - received nothing.
 * Fixed by e7b161a on 2026-08-11 20:59:54 UTC.
 *
 * That was caught by hand, by reading a PDF. This script is the mechanical
 * version, and it runs over every certification rather than the one that
 * happened to be looked at.
 *
 * WHAT IT CHECKS, AND WHAT IT CANNOT
 * ----------------------------------
 * IT CHECKS EXISTENCE, NOT MEANING. "Clause 6.7 exists in ISO 19011:2026" is
 * mechanical. "Clause 6.7 says what this item claims it says" is not, and no
 * amount of parsing gets there. A clean run means every cited address is real.
 * It does NOT mean the claims are true. That distinction is the whole reason a
 * bank re-read is a separate, more expensive step.
 *
 * EDITION CHECKING IS THE SHARPER HALF. A clause number that exists in both
 * editions of a standard tells you nothing; a superseded EDITION TOKEN is
 * unambiguous. Those are reported separately and are never false positives.
 *
 * ATTRIBUTION IS THE HARD PART AND IT FAILS OPEN. An item naming two standards
 * in one sentence cannot have its clause references attributed mechanically, so
 * those are counted as AMBIGUOUS and excluded from the flag list rather than
 * guessed at. Undercounting is the correct direction for a gate that is meant
 * to be believed.
 *
 * USAGE
 *   cd C:\Users\Juan\Documents\certidemy\supabase
 *   node scripts/verify-citations.mjs --all
 *   node scripts/verify-citations.mjs --cert ISMS-F [--lang en] [--pool secure]
 *   node scripts/verify-citations.mjs --index      (dump the parsed structures)
 *
 * READ-ONLY. This script writes nothing, anywhere. It has no --apply because it
 * has nothing to apply. Unknown flags exit 2 - see CLAUDE.md on the two flag
 * conventions in this directory.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync, mkdtempSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..");

for (const p of [join(HERE, ".env"), join(REPO_ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

// ---------------------------------------------------------------- flags
const KNOWN = new Set(["--all", "--cert", "--lang", "--pool", "--index", "--limit"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unknown flag ${a}.`);
    console.error("This script is READ-ONLY and takes no --apply and no --dry.");
    console.error("Valid: --all | --cert CODE | --lang xx | --pool secure|practice | --index");
    process.exit(2);
  }
}
const arg = (k, d) => {
  const i = process.argv.indexOf(`--${k}`);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const has = (k) => process.argv.includes(`--${k}`);

// The parser and the resolver live in scripts/lib/citation-index.mjs so that
// verify-cert.mjs runs the SAME code as an invariant. Two copies of a parser
// whose false-positive modes cost this much to find is the mirrored-pair defect.
import { buildIndex, analyseText, newSink, sourcesAvailable, loadExemptions } from "./lib/citation-index.mjs";

if (!sourcesAvailable()) {
  console.error("The three ISO PDFs or pdftotext are unavailable - cannot verify anything.");
  process.exit(3);
}

// ---------------------------------------------------------------- main
const index = buildIndex();

if (has("index")) {
  for (const [k, v] of Object.entries(index)) {
    const leaves = [...v.annex].filter((x) => x.split(".").length === 3);
    console.log(`ISO ${k}: ${v.clauses.size} clause addresses, ${v.annex.size} annex addresses ` +
      `(${leaves.length} three-part, e.g. controls)`);
    console.log(`   clauses: ${[...v.clauses].sort().slice(0, 14).join(" ")} ...`);
    console.log(`   annex  : ${[...v.annex].sort().slice(0, 14).join(" ")} ...`);
  }
  process.exit(0);
}

const db = createClient(
  process.env.SUPABASE_URL || "https://pctynukndxnmnxiqpgck.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const { data: certs, error: cerr } = await db.from("certifications").select("id, code, name").order("code");
if (cerr) { console.error(cerr.message); process.exit(1); }
const only = arg("cert", null);
const targets = certs.filter((c) => (only ? c.code === only : has("all") || false));
if (!targets.length) { console.error("Pass --all or --cert CODE."); process.exit(2); }

const EXEMPT = await loadExemptions(db);
const LANG = arg("lang", null);
const POOL = arg("pool", null);

console.log("CITATION EXISTENCE CHECK - every cited clause resolved against the PDF");
console.log("(existence, not meaning: a clean row does not mean the claims are true)\n");

const grand = { checked: 0, missing: 0, edition: 0, unknownStd: 0, ambiguous: 0, unattributed: 0 };
const allFlags = [];

for (const cert of targets) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    let q = db.from("quiz_questions")
      .select("id, task_id, language, pool, question_group_id, question_text, options, explanation, correct_answer")
      .eq("certification_id", cert.id).is("retired_at", null).eq("status", "approved")
      .order("id").range(from, from + 999);
    if (LANG) q = q.eq("language", LANG);
    if (POOL) q = q.eq("pool", POOL);
    const { data, error } = await q;
    if (error) { console.error(`${cert.code}: ${error.message}`); process.exit(1); }
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }

  const sink = newSink();
  const perItem = new Map();
  for (const q of rows) {
    const before = { m: sink.missing.length, e: sink.edition.length };
    const opts = Array.isArray(q.options) ? q.options : [];
    const text = [q.question_text, q.explanation || "", ...opts.map((o) => o.text || "")].join("\n");
    analyseText(text, index, sink, EXEMPT.get(q.question_group_id) || null);
    if (sink.missing.length > before.m || sink.edition.length > before.e) {
      perItem.set(q.id, { lang: q.language, pool: q.pool });
    }
  }

  const bad = sink.missing.length + sink.edition.length;
  const tag = bad ? "FLAG" : (sink.unknownStd.length ? "note" : " ok ");
  console.log(
    `${tag}  ${cert.code.padEnd(10)} ${String(rows.length).padStart(5)} rows  ` +
    `${String(sink.checked).padStart(5)} refs checked  ` +
    `${String(sink.missing.length).padStart(4)} nonexistent  ` +
    `${String(sink.edition.length).padStart(3)} wrong-edition  ` +
    `${String(sink.misattributed.length).padStart(4)} misattrib?  ${String(sink.unattributed).padStart(5)} unattributed`
  );

  const tally = (arr, key) => {
    const m = new Map();
    for (const x of arr) m.set(key(x), (m.get(key(x)) || 0) + 1);
    return [...m].sort((a, b) => b[1] - a[1]);
  };
  for (const [k, n] of tally(sink.edition, (x) => `${x.raw} -> expected ${x.expected}`).slice(0, 6))
    console.log(`         EDITION  ${String(n).padStart(4)}x  ${k}`);
  for (const [k, n] of tally(sink.missing, (x) => `${x.kind} ${x.n}  ("${x.ref}", sentence named ${x.named})`).slice(0, 14))
    console.log(`         NONEXISTENT  ${String(n).padStart(4)}x  ${k}`);
  for (const [k, n] of tally(sink.misattributed, (x) => `"${x.ref}" named ${x.named} but exists in ${x.elsewhere}`).slice(0, 6))
    console.log(`         misattrib?   ${String(n).padStart(4)}x  ${k}`);
  for (const [k, n] of tally(sink.unknownStd, (x) => x.raw).slice(0, 5))
    console.log(`         unknown standard  ${String(n).padStart(4)}x  ${k}`);
  if (bad) allFlags.push({ cert: cert.code, items: perItem.size, missing: sink.missing.length, edition: sink.edition.length });

  grand.checked += sink.checked;
  grand.missing += sink.missing.length;
  grand.edition += sink.edition.length;
  grand.unknownStd += sink.unknownStd.length;
  grand.misattributed = (grand.misattributed||0) + sink.misattributed.length;
  grand.exempted = (grand.exempted||0) + sink.exempted;
  grand.ambiguous += sink.ambiguous;
  grand.unattributed += sink.unattributed;
}

console.log(`\nTOTAL  ${grand.checked} references resolved against the three PDFs`);
console.log(`       ${grand.missing} cite an address that does not exist`);
console.log(`       ${grand.edition} cite a superseded or wrong edition`);
console.log(`       ${grand.misattributed} exist elsewhere but not in the standard named alongside them (candidates, not defects)`);
console.log(`       ${grand.exempted} exempted by citation_exemptions (correct in context - see migration 305)`);
console.log(`       ${grand.ambiguous} ambiguous (two standards in one sentence - not guessed at)`);
console.log(`       ${grand.unattributed} unattributed (no standard named nearby)`);
if (allFlags.length) {
  console.log("\nBANKS WITH FLAGS - rows needing a human read:");
  for (const f of allFlags) console.log(`  ${f.cert.padEnd(10)} ${String(f.items).padStart(4)} rows  (${f.missing} missing, ${f.edition} edition)`);
}
process.exit(grand.missing + grand.edition ? 1 : 0);
