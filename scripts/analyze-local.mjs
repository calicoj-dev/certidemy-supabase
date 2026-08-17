// scripts/analyze-local.mjs
//
// Local calibration harness. Runs the pure engine against text fixtures on disk
// and prints a report per document.
//
// Requires Node 22.18+ / 24 -- it imports the .ts modules directly using native
// type stripping. No build step, no tsx, no bundler. Deno-style explicit .ts
// extensions resolve correctly in Node.
//
//   node scripts/analyze-local.mjs                     # all fixtures
//   node scripts/analyze-local.mjs csm sbok            # by name substring
//   node scripts/analyze-local.mjs --rules rules.json  # real ruleset from the DB
//
// Fixtures are .txt only. PDFs are converted once by scripts/pdf-to-text.mjs so
// that the text the engine sees is the text that gets hashed -- hashing the PDF
// would hash bytes the engine never reads.

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { analyze } from "../functions/_shared/analyzer/engine.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "..", "..", "fixtures", "calibration");

// ---------------------------------------------------------------- arguments

const argv = process.argv.slice(2);
const rulesFlag = argv.indexOf("--rules");
const rulesPath = rulesFlag !== -1 ? argv[rulesFlag + 1] : null;
// Guard the -1 case: without --rules, rulesFlag + 1 is 0, which would silently
// drop the FIRST positional filter and quietly run every fixture instead of the
// one that was asked for.
const rulesValueIndex = rulesFlag === -1 ? -1 : rulesFlag + 1;
const filters = argv.filter(
  (a, i) => !a.startsWith("--") && i !== rulesValueIndex,
);

// ------------------------------------------------------------------- ruleset
//
// Real rules come from the database via:
//
//   copy (select id, rule_class, lang, legacy_term, current_term, match_mode,
//                pattern, severity, authority_source_id, authority_citation_id,
//                rationale
//           from public.drift_rules where is_active)
//   to stdout with (format csv, header);
//
// then shaped to JSON. Until that exists, the built-in set below mirrors
// migration 220 so the harness runs standalone. IT IS A MIRROR, NOT A SOURCE.
// The database is the source of truth; if these disagree, this file is wrong.

const BUILTIN_RULES = [
  ["Development Team", "Developers", "phrase", null, "high"],
  ["self-organizing", "self-managing", "regex", "self[- ]?organi[sz](ing|ation|e|ed)", "high"],
  ["servant-leader", "true leader who serves", "regex", "servant[- ]?leader", "high"],
  ["potentially releasable", "usable Increment", "phrase", null, "medium"],
  ["Scrum roles", "accountabilities", "regex", "(three roles|3 roles|Scrum roles|roles, events, artifacts)", "medium"],
  ["Development Team size three to nine", "typically 10 or fewer people", "regex", "(three to nine|3 to 9|3-9|nine members|9 members)", "medium"],
  ["time-box", "timebox", "regex", "time[- ]box", "low"],
  ["Sprint Planning meeting", "Sprint Planning", "phrase", null, "low"],
  ["Daily Sprint", "Daily Scrum", "phrase", null, "high"],
  ["Daily Standup", "Daily Scrum", "regex", "daily[- ]?stand[- ]?up", "medium"],
  ["Sprint Zero", null, "regex", "sprint[- ]?(zero|0)\\M", "low"],
  ["ScrumMaster", "Scrum Master", "regex", "\\mScrumMaster\\M", "low"],
].map(([legacyTerm, currentTerm, matchMode, pattern, severity], i) => ({
  id: `builtin-${String(i + 1).padStart(2, "0")}`,
  ruleClass: i >= 8 ? "non_canonical" : "superseded",
  lang: "en",
  legacyTerm,
  currentTerm,
  matchMode,
  pattern,
  severity,
  authoritySourceId: "builtin",
  authorityCitationId: "builtin",
  rationale: null,
}));

const rules = rulesPath ? JSON.parse(readFileSync(rulesPath, "utf8")) : BUILTIN_RULES;

// ----------------------------------------------------------------- blueprint
//
// SM-AI-I domain weights. Replace with a live BlueprintReader pull once the
// edge function exists; the shape is deliberately identical.

const BLUEPRINT = {
  referenceKind: "certidemy_certification",
  referenceId: "11111111-1111-1111-1111-111111111111",
  lang: "en",
  code: "SM-AI-I",
  title: "Scrum Master I - AI",
  domains: [
    { id: "d1", code: "D1", title: "Agile and Scrum foundations", weightPct: 12.5 },
    { id: "d2", code: "D2", title: "Scrum events and facilitation", weightPct: 22.5 },
    { id: "d3", code: "D3", title: "Scrum artifacts and commitments", weightPct: 25.0 },
    { id: "d4", code: "D4", title: "Product Backlog and planning", weightPct: 17.5 },
    { id: "d5", code: "D5", title: "Scrum Master accountability and coaching", weightPct: 22.5 },
  ],
  tasks: [],
};

// ------------------------------------------------------------- the manifest
//
// scripts/calibration-manifest.json is the regression baseline and IS
// COMMITTED. It replaces two things that used to live in this file:
//
//   1. A hardcoded EXPECTED map, which drifted from reality silently.
//   2. Language detection by filename substring -- which is exactly what let
//      the AulaUtil bug hide: the document was routed as es-419, every rule was
//      en, zero rules ran, and the engine reported cleanPass=true on a
//      competitor syllabus containing four legacy terms.
//
// Language is now DECLARED, never guessed.

const manifest = JSON.parse(readFileSync(join(HERE, "calibration-manifest.json"), "utf8"));
const byFile = new Map(manifest.fixtures.map((f) => [f.file, f]));

// ---------------------------------------------------------------------- run

if (!existsSync(FIXTURES)) {
  console.error(`fixtures directory not found: ${FIXTURES}`);
  process.exit(1);
}

let files = readdirSync(FIXTURES).filter((f) => f.endsWith(".txt"));
if (filters.length) {
  files = files.filter((f) => filters.some((q) => f.toLowerCase().includes(q.toLowerCase())));
}

if (files.length === 0) {
  console.error("no .txt fixtures matched. Run scripts/pdf-to-text.mjs first.");
  process.exit(1);
}

const summary = [];

for (const file of files) {
  const raw = readFileSync(join(FIXTURES, file), "utf8");
  const hash = createHash("sha256").update(raw, "utf8").digest("hex");
  const name = basename(file, ".txt");
  const spec = byFile.get(file);
  if (!spec) {
    console.log("=".repeat(78));
    console.log(`${name}\n  SKIPPED -- not in calibration-manifest.json. Add it before it can be asserted.`);
    continue;
  }
  const lang = spec.lang;

  const out = analyze({
    rawText: raw,
    sourceLang: lang,
    blueprint: BLUEPRINT,
    rules,
    frameworkExpected: "scrum_guide_2020",
  });

  const drift = out.findings.filter((f) => f.findingType === "drift");
  const notes = out.findings.filter((f) => f.findingType === "structural_note");
  const gaps = out.findings.filter((f) => f.findingType === "reverse_gap");
  const wd = out.findings.filter((f) => f.findingType === "weight_divergence");
  const review = out.findings.filter((f) => f.requiresHumanReview);

  console.log("=".repeat(78));
  console.log(`${name}`);
  console.log(`  sha256      ${hash.slice(0, 16)}...  ${out.normalized.wordCount} words  lang=${lang}`);
  console.log(
    `  gates       density=${out.gates.densityOk ? "ok" : "FAIL"}` +
      `  framework=${out.gates.frameworkDetected}(${out.gates.frameworkConfidence.toFixed(2)})` +
      `  match=${out.gates.frameworkMatch}`,
  );
  console.log(
    `  verdict     suppressed=${out.gates.coverageSuppressed}` +
      `  reason=${out.gates.suppressionReason ?? "-"}` +
      `  coverage=${out.coveragePct ?? "null"}` +
      `  cleanPass=${out.cleanPass}`,
  );
  console.log(
    `  findings    drift=${drift.length} weight=${wd.length} reverseGap=${gaps.length} ` +
      `notes=${notes.length} needsReview=${review.length}`,
  );

  if (out.rejectedRules.length) {
    console.log(`  REJECTED RULES (${out.rejectedRules.length}):`);
    for (const r of out.rejectedRules) console.log(`    ! ${r.legacyTerm}: ${r.reason}`);
  }

  for (const f of drift) console.log(`    [drift ${f.severity}] ${f.label}`);
  for (const f of notes) console.log(`    [note  ${f.severity}] ${f.label}`);

  // ------------------------------------------------------------ assertions
  const checks = [];
  const add = (label, want, got) =>
    checks.push({ label, want, got, ok: JSON.stringify(want) === JSON.stringify(got) });

  add("sha256", spec.sha256_16, hash.slice(0, 16));
  add("suppression", spec.expect_suppression, out.gates.suppressionReason);
  add("framework", spec.expect_framework, out.gates.frameworkDetected);
  add("drift", spec.expect_drift, drift.length);
  add("cleanPass", spec.expect_clean_pass, out.cleanPass);

  for (const c of checks) {
    const mark = c.ok ? "pass" : "FAIL";
    const detail = c.ok ? `${c.got}` : `want=${c.want} got=${c.got}`;
    console.log(`  ${mark.padEnd(5)} ${c.label.padEnd(12)} ${detail}`);
  }

  if (typeof spec.hand_drift === "number" && spec.hand_drift !== drift.length) {
    console.log(
      `  note  hand_drift    hand=${spec.hand_drift} engine=${drift.length} ` +
        `-- an anchor, not an oracle; read the matched spans before changing a rule`,
    );
  }

  summary.push({ name, ok: checks.every((c) => c.ok) });
}

console.log("=".repeat(78));
const failed = summary.filter((s) => !s.ok);
console.log(
  `calibration: ${summary.length - failed.length}/${summary.length} fixtures match baseline` +
    `  (engine ${manifest.engine_baseline}, ruleset ${manifest.ruleset_baseline})`,
);
if (failed.length) {
  for (const f of failed) console.log(`  FAIL ${f.name}`);
  console.log(
    "\nA failure is a REGRESSION unless a migration or code change deliberately\n" +
      "caused it -- in which case update calibration-manifest.json in the SAME commit.",
  );
  process.exit(1);
}
