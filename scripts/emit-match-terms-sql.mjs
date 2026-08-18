// scripts/emit-match-terms-sql.mjs
//
// Turns an approved match-terms review file into a migration you paste in the
// SQL editor. It NEVER touches the database.
//
//   node scripts/emit-match-terms-sql.mjs --in ../fixtures/match-terms-SM-AI-I-D3.json --migration 227
//
// Reads `approved_terms` only. Anything left in `candidates` is ignored, so an
// unreviewed file emits an empty migration rather than applying every guess.
//
// ===================== THE FAILURE THIS GUARDS AGAINST =====================
//
// A match term that is too generic silently INFLATES a competitor's coverage.
// Every other failure mode in this engine shows up as a wrong-looking number.
// This one shows up as a BETTER-looking number, which is why it needs checks
// rather than vigilance.
//
// Three refusals, all fatal, none silent:
//
//   1. SINGLE-TOKEN TERMS. "Sprint" would match every Scrum document ever
//      written. Two significant tokens minimum.
//   2. TERMS THAT COLLIDE. If one term would match two different concepts, a
//      document mentioning it once credits both. Ambiguity here is silent
//      double-counting.
//   3. TERMS THAT RESTATE THE NAME. Already matched; adds nothing and hides a
//      concept that actually needed a term.
//
// A refusal prints the term and the reason and exits non-zero. Fix the review
// file, do not weaken the check.

import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};

const inPath = flag("in");
const migrationNo = flag("migration");
if (!inPath || !migrationNo) {
  console.error(
    "usage: node scripts/emit-match-terms-sql.mjs --in <review.json> --migration <NNN>",
  );
  process.exit(1);
}

const doc = JSON.parse(readFileSync(inPath, "utf8"));
const certCode = doc.certification;
const domain = doc.domain ?? "all";

const STOP = new Set(["the", "and", "of", "for", "to", "in", "a", "an", "with", "on", "by", "as", "is"]);
const toks = (s) =>
  s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((t) => t.length > 2 && !STOP.has(t));

// ------------------------------------------------------------- validation

const errors = [];
const warnings = [];
const termOwners = new Map(); // normalized term -> [concept slugs]
const approved = [];

for (const c of doc.concepts ?? []) {
  const terms = (c.approved_terms ?? []).map((t) => String(t).trim()).filter(Boolean);
  if (terms.length === 0) continue;

  if (c.in_core_scope === false) {
    warnings.push(
      `${c.slug}: terms approved on an EXTENDED-scope concept. No course in the ` +
        `base discipline can match it, so these buy nothing.`,
    );
  }

  const seen = new Set();
  for (const term of terms) {
    const norm = term.toLowerCase().replace(/\s+/g, " ");

    if (seen.has(norm)) {
      warnings.push(`${c.slug}: duplicate term "${term}" listed twice; kept once.`);
      continue;
    }
    seen.add(norm);

    const t = toks(term);
    if (t.length < 2) {
      errors.push(
        `${c.slug}: "${term}" has ${t.length} significant token(s). A single-token ` +
          `term matches half the documents on the internet.`,
      );
      continue;
    }
    if (norm === String(c.name).toLowerCase().replace(/\s+/g, " ")) {
      errors.push(`${c.slug}: "${term}" restates the concept name; it already matches.`);
      continue;
    }
    if (term.length > 90) {
      errors.push(`${c.slug}: "${term}" is ${term.length} chars. A sentence is not a term.`);
      continue;
    }

    const owners = termOwners.get(norm) ?? [];
    owners.push(c.slug);
    termOwners.set(norm, owners);
  }

  approved.push({ slug: c.slug, name: c.name, terms: [...seen].map((n) =>
    terms.find((t) => t.toLowerCase().replace(/\s+/g, " ") === n)) });
}

for (const [norm, owners] of termOwners) {
  if (owners.length > 1) {
    errors.push(
      `COLLISION: "${norm}" approved for ${owners.length} concepts (${owners.join(", ")}). ` +
        `One mention would credit all of them.`,
    );
  }
}

if (warnings.length) {
  console.log("WARNINGS:");
  for (const w of warnings) console.log("  ! " + w);
  console.log("");
}
if (errors.length) {
  console.error(`REFUSED -- ${errors.length} problem(s). Nothing emitted:`);
  for (const e of errors) console.error("  X " + e);
  console.error("\nFix the review file. Do not weaken the checks.");
  process.exit(1);
}
if (approved.length === 0) {
  console.error(
    `No approved_terms found in ${basename(inPath)}.\n` +
      `Copy good entries from "candidates" into "approved_terms" first -- ` +
      `candidates are ignored by design, so an unreviewed file emits nothing.`,
  );
  process.exit(1);
}

// ------------------------------------------------------------------ emit

const sqlLit = (s) => "'" + String(s).replace(/'/g, "''") + "'";
const totalTerms = approved.reduce((n, c) => n + c.terms.length, 0);

const lines = [];
lines.push(`-- ${migrationNo}_match_terms_${certCode.toLowerCase().replace(/-/g, "_")}_${domain.toLowerCase()}.sql`);
lines.push("--");
lines.push(`-- Match terms for ${certCode} ${domain}: ${totalTerms} terms across ${approved.length} concepts.`);
lines.push("--");
lines.push("-- Terms are the surface forms a real document prints, kept separate from the");
lines.push("-- analytic concept name. GROUNDED IN OUR OWN LESSON PROSE -- every term below");
lines.push("-- was proposed from a heading or bold span in a lesson that teaches the concept,");
lines.push("-- then reviewed by hand. None were invented.");
lines.push("--");
lines.push("-- Emitted by scripts/emit-match-terms-sql.mjs, which refuses single-token terms,");
lines.push("-- terms colliding across concepts, and terms restating the name. Those three are");
lines.push("-- the ways a term silently INFLATES a competitor's coverage -- the one failure in");
lines.push("-- this engine that looks like a good result.");
lines.push("--");
lines.push(`-- Source review file: ${basename(inPath)}`);
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push("--");
lines.push("-- AFTER RUNNING THIS, re-dump the blueprint and re-run the harness:");
lines.push("--   node scripts/dump-blueprint.mjs");
lines.push("--   node scripts/analyze-local.mjs --rules ../fixtures/drift-rules.json \\");
lines.push("--        --blueprint ../fixtures/blueprint-SM-AI-I-en.json");
lines.push("-- A LARGE jump in coverage is a reason to check the terms, not to celebrate.");
lines.push("--");
lines.push("-- ASCII-only. Editor-first.");
lines.push("");

for (const c of approved) {
  lines.push(`-- ${c.slug}: ${c.name}`);
  lines.push(`update public.concepts c`);
  lines.push(`set match_terms = array[${c.terms.map(sqlLit).join(", ")}]`);
  lines.push(`from public.certifications cert`);
  lines.push(`where cert.id = c.certification_id`);
  lines.push(`  and cert.code = ${sqlLit(certCode)}`);
  lines.push(`  and c.slug = ${sqlLit(c.slug)};`);
  lines.push("");
}

lines.push("-- =====================================================================");
lines.push("-- VERIFICATION - run these ONE AT A TIME.");
lines.push("-- =====================================================================");
lines.push("");
lines.push(`-- 1) expect ${approved.length} rows, ${totalTerms} terms total`);
lines.push("-- select c.slug, cardinality(c.match_terms) as terms, c.match_terms");
lines.push("--   from public.concepts c");
lines.push("--   join public.certifications cert on cert.id = c.certification_id");
lines.push(`--  where cert.code = ${sqlLit(certCode)} and cardinality(c.match_terms) > 0`);
lines.push("--  order by c.slug;");
lines.push("");
lines.push("-- 2) COLLISION RECHECK against the live table, not just this file.");
lines.push("--    A term added here may collide with one added in an earlier batch.");
lines.push("--    Expect ZERO rows.");
lines.push("-- select lower(term) as term, count(*) as concepts, array_agg(c.slug) as slugs");
lines.push("--   from public.concepts c, unnest(c.match_terms) as term");
lines.push("--   join public.certifications cert on cert.id = c.certification_id");
lines.push(`--  where cert.code = ${sqlLit(certCode)}`);
lines.push("--  group by lower(term) having count(*) > 1;");

const outPath = flag("out", `${migrationNo}_match_terms_${certCode.toLowerCase().replace(/-/g, "_")}_${domain.toLowerCase()}.sql`);
const sql = lines.join("\n") + "\n";
writeFileSync(outPath, sql, "utf8");

console.log(`emitted ${totalTerms} terms across ${approved.length} concepts -> ${outPath}`);
console.log(`  run it in the SQL editor, then commit the .sql as the versioned record.`);
