// scripts/scan-fit.mjs
//
// THE MULTI-CERTIFICATION SCAN.
//
// Runs one source document against EVERY Certidemy blueprint and ranks the fit:
//
//   "Your course is 71% ready for SM-AI-I, 22% for SPO-AI-I."
//
//   node scripts/dump-blueprint.mjs --all
//   node scripts/scan-fit.mjs --rules ../fixtures/drift-rules.json
//   node scripts/scan-fit.mjs --rules ../fixtures/drift-rules.json tuv
//
// ===================== WHY THIS IS THE PRODUCT =====================
//
// A training provider's real question is not "how much of SM-AI-I do I cover".
// It is "which of your certifications is my course already closest to". Nobody
// has been able to answer that for them, because answering it needs a
// task-level JTA with a concept layer beneath it -- a scheme that exists as a
// PDF can yield a topic list and nothing more.
//
// And it is nearly free. Normalisation, density, framework detection, drift and
// weighting are computed ONCE on the text. Only concept matching is
// per-certification, and it is lexical.
//
// ===================== WHAT THE NUMBER IS NOT =====================
//
// Fit is NOT "how good their course is". A pure-Scrum course scores low against
// SM-AI-I partly because SM-AI-I deliberately assesses AI-augmentation concepts
// no Scrum course teaches (scope_tag = extended), and partly because our
// blueprint is finer-grained than any syllabus -- it names anti-patterns a
// syllabus would never list.
//
// Both of those are the PRODUCT, not a deficiency in their course. This script
// therefore reports core-scope fit separately from extended, and never blends
// them into one figure.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { analyze } from "../functions/_shared/analyzer/engine.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "..", "..", "fixtures");
const CALIB = join(FIXTURES, "calibration");

const argv = process.argv.slice(2);
const flagIdx = argv.indexOf("--rules");
const rulesPath = flagIdx === -1 ? null : argv[flagIdx + 1];
const filters = argv.filter((a, i) => !a.startsWith("--") && i !== (flagIdx === -1 ? -1 : flagIdx + 1));

if (!rulesPath) {
  console.error("usage: node scripts/scan-fit.mjs --rules ../fixtures/drift-rules.json [name-filter]");
  process.exit(1);
}
const rules = JSON.parse(readFileSync(rulesPath, "utf8"));

// ----------------------------------------------------------- blueprints

const blueprints = readdirSync(FIXTURES)
  .filter((f) => /^blueprint-.+\.json$/.test(f))
  .map((f) => JSON.parse(readFileSync(join(FIXTURES, f), "utf8")))
  .sort((a, b) => a.code.localeCompare(b.code));

if (blueprints.length === 0) {
  console.error("no blueprints found. Run: node scripts/dump-blueprint.mjs --all");
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(join(HERE, "calibration-manifest.json"), "utf8"));
const byFile = new Map(manifest.fixtures.map((f) => [f.file, f]));

let files = readdirSync(CALIB).filter((f) => f.endsWith(".txt"));
if (filters.length) {
  files = files.filter((f) => filters.some((q) => f.toLowerCase().includes(q.toLowerCase())));
}

console.log(`${blueprints.length} blueprints x ${files.length} documents\n`);

for (const file of files) {
  const spec = byFile.get(file);
  if (!spec) {
    console.log(`${basename(file, ".txt")}\n  SKIPPED -- not in calibration-manifest.json\n`);
    continue;
  }

  const raw = readFileSync(join(CALIB, file), "utf8");
  const hash = createHash("sha256").update(raw, "utf8").digest("hex").slice(0, 12);

  const rows = [];
  let shared = null;

  for (const bp of blueprints) {
    const out = analyze({
      rawText: raw,
      sourceLang: spec.lang,
      blueprint: bp,
      rules,
      frameworkExpected: spec.expect_framework === "sbok" ? null : spec.expect_framework,
    });

    // Gates and drift are identical across blueprints -- same text, same rules.
    // Captured once so the report shows them as document properties rather than
    // repeating them eleven times as if they varied.
    if (shared === null) {
      shared = {
        words: out.normalized.wordCount,
        framework: out.gates.frameworkDetected,
        drift: out.findings.filter((f) => f.findingType === "drift").length,
        suppressed: out.gates.suppressionReason,
      };
    }

    const c = out.concepts;
    rows.push({
      code: bp.code,
      coverage: out.coveragePct,
      strong: c?.counts.strong ?? 0,
      probable: c?.counts.probable ?? 0,
      concepts: bp.concepts?.length ?? 0,
      suppressed: out.gates.suppressionReason,
    });
  }

  rows.sort((a, b) => (b.coverage ?? -1) - (a.coverage ?? -1));

  console.log("=".repeat(70));
  console.log(`${basename(file, ".txt")}`);
  console.log(
    `  ${shared.words} words | lang ${spec.lang} | framework ${shared.framework} | ` +
      `${shared.drift} drift findings${shared.suppressed ? ` | SUPPRESSED: ${shared.suppressed}` : ""}`,
  );
  console.log(`  sha256 ${hash}`);
  console.log("");

  if (rows[0].suppressed) {
    console.log(`  Coverage withheld for every blueprint (${rows[0].suppressed}).`);
    console.log(`  Drift and structural findings are unaffected and still reported.`);
    console.log("");
    continue;
  }

  for (const r of rows) {
    const bar = "#".repeat(Math.round((r.coverage ?? 0) / 2));
    console.log(
      `  ${r.code.padEnd(10)} ${String(r.coverage ?? "-").padStart(5)}%  ` +
        `${bar.padEnd(26)} ${r.strong}s ${r.probable}p of ${r.concepts}`,
    );
  }

  const best = rows[0];
  const gap = rows.length > 1 ? (best.coverage ?? 0) - (rows[1].coverage ?? 0) : 0;
  console.log("");
  console.log(
    `  closest fit: ${best.code}` +
      (gap >= 3
        ? `, clear of ${rows[1].code} by ${gap.toFixed(1)} points`
        : `, but ${rows[1]?.code} is within ${gap.toFixed(1)} points -- not a decisive fit`),
  );
  console.log("");
}

console.log("=".repeat(70));
console.log("Fit is not a quality judgement. A low score against an AI-augmented");
console.log("certification partly reflects extended-scope concepts no course in the");
console.log("base discipline teaches -- which is the differentiator, not a defect.");
