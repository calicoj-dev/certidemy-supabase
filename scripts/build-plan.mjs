// scripts/build-plan.mjs
//
// Prints the readiness report and build plan for one document against one
// certification. This is the deliverable in text form -- the partner-facing
// renderer is a projection of exactly this structure.
//
//   node scripts/dump-blueprint.mjs --cert SM-AI-I --lessons
//   node scripts/build-plan.mjs --doc tuv --cert SM-AI-I \
//        --rules ../fixtures/drift-rules.json
//   node scripts/build-plan.mjs --doc tuv --cert SM-AI-I --rules ... --full

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { analyze } from "../functions/_shared/analyzer/engine.ts";
import { buildReadinessReport, buildPlan } from "../functions/_shared/analyzer/report.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIXTURES = join(HERE, "..", "..", "fixtures");
const CALIB = join(FIXTURES, "calibration");

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};
const docFilter = flag("doc");
const certCode = flag("cert", "SM-AI-I");
const rulesPath = flag("rules");
const full = argv.includes("--full");

if (!docFilter || !rulesPath) {
  console.error(
    "usage: node scripts/build-plan.mjs --doc <name> --cert <CODE> --rules <rules.json> [--full]",
  );
  process.exit(1);
}

const bpPath = join(FIXTURES, `blueprint-${certCode}-en.json`);
if (!existsSync(bpPath)) {
  console.error(`no blueprint at ${bpPath}\nRun: node scripts/dump-blueprint.mjs --cert ${certCode} --lessons`);
  process.exit(1);
}
const blueprint = JSON.parse(readFileSync(bpPath, "utf8"));
const rules = JSON.parse(readFileSync(rulesPath, "utf8"));

const manifest = JSON.parse(readFileSync(join(HERE, "calibration-manifest.json"), "utf8"));
const byFile = new Map(manifest.fixtures.map((f) => [f.file, f]));

const file = readdirSync(CALIB).find(
  (f) => f.endsWith(".txt") && f.toLowerCase().includes(docFilter.toLowerCase()),
);
if (!file) {
  console.error(`no fixture matching "${docFilter}"`);
  process.exit(1);
}
const spec = byFile.get(file);
if (!spec) {
  console.error(`${file} is not in calibration-manifest.json`);
  process.exit(1);
}

const raw = readFileSync(join(CALIB, file), "utf8");
const analysis = analyze({
  rawText: raw,
  sourceLang: spec.lang,
  blueprint,
  rules,
  frameworkExpected: spec.expect_framework === "sbok" ? null : spec.expect_framework,
});

const report = buildReadinessReport(analysis, blueprint);
const plan = buildPlan(report);

const line = (n = 74) => "=".repeat(n);
// Partner-facing copy. "1 tasks" and "1 of these are" read as a bug and
// undermine a report whose whole claim is care about detail.
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const s = report.summary;

console.log(line());
console.log(`READINESS REPORT  ${basename(file, ".txt")}  ->  ${report.certificationCode}`);
console.log(line());

if (!report.measurable) {
  console.log(`\nNot measurable: ${report.notMeasurableReason}.`);
  console.log(`Terminology and structural findings are still valid and listed below.\n`);
} else {
  // The denominator is stated FIRST and in words. A bare percentage invites an
  // argument about the number; the counts invite a conversation about the work.
  console.log(`
Our scheme assesses ${s.conceptsTotal} concepts across ${s.tasksTotal} tasks.
Your syllabus addresses ${s.conceptsAddressed} of them.

  ${plural(s.tasksAddressed, "task", "tasks")} fully addressed
  ${plural(s.tasksPartial, "task", "tasks")} partly addressed
  ${plural(s.tasksAbsent, "task", "tasks")} not addressed
  ${plural(s.conceptsToAdd, "concept", "concepts")} to add${
    s.extendedConcepts > 0
      ? `  (${s.extendedConcepts} of ${s.extendedConcepts === 1 ? "these is an" : "these are"} AI-augmentation
                        ${s.extendedConcepts === 1 ? "topic" : "topics"} no course in the base discipline teaches --
                        we supply the material for ${s.extendedConcepts === 1 ? "it" : "all of them"})`
      : ""
  }

Weighted readiness: ${s.readinessPct}%
`);

  console.log("By domain");
  for (const d of report.domains) {
    const pct = d.tasksTotal === 0 ? 0 : Math.round((d.tasksAddressed / d.tasksTotal) * 100);
    console.log(
      `  ${d.code}  ${String(d.weightPct).padStart(5)}%  ` +
        `${String(d.tasksAddressed).padStart(2)}/${String(d.tasksTotal).padEnd(2)} tasks  ` +
        `${String(d.conceptsAddressed).padStart(3)}/${String(d.conceptsTotal).padEnd(3)} concepts  ` +
        `${String(pct).padStart(3)}%  ${d.title}`,
    );
  }
}

if (plan.length > 0) {
  console.log(`\n${line()}`);
  console.log(`BUILD PLAN  ${plural(plan.length, "task needs", "tasks need")} work, heaviest domain first`);
  console.log(line());
  const show = full ? plan : plan.slice(0, 8);
  for (const item of show) {
    console.log(
      `\n${item.taskCode}  [${item.domainCode} ${item.domainWeightPct}%]` +
        (item.isExtended ? "  (AI-augmentation -- expected to be absent)" : ""),
    );
    console.log(`  ${item.taskStatement}`);
    for (const c of item.missingConcepts) {
      console.log(`    - ${c.name}`);
      if (c.noMaterial) {
        console.log(`        !! no lesson teaches this concept -- gap in OUR curriculum`);
      } else {
        for (const l of c.lessons.slice(0, 2)) console.log(`        teach with: ${l.title}`);
      }
    }
  }
  if (!full && plan.length > show.length) {
    console.log(`\n  ... ${plan.length - show.length} more tasks. Re-run with --full.`);
  }
}

if (report.beyondScope.length > 0) {
  console.log(`\n${line()}`);
  console.log(`BEYOND OUR SCOPE  ${plural(report.beyondScope.length, "topic", "topics")} you teach that we do not assess`);
  console.log(line());
  console.log(`This is your differentiation, not a finding against you.\n`);
  for (const b of report.beyondScope.slice(0, 12)) {
    console.log(`  - ${b.label}${b.sourceWeightPct ? ` (${b.sourceWeightPct}%)` : ""}`);
  }
}

const drift = report.integrity.filter((f) => f.findingType === "drift");
if (drift.length > 0) {
  console.log(`\n${line()}`);
  console.log(`TERMINOLOGY  ${plural(drift.length, "finding", "findings")}`);
  console.log(line());
  for (const f of drift) console.log(`  [${f.severity}] ${f.label}`);
}

const noMaterial = plan.flatMap((i) => i.missingConcepts.filter((c) => c.noMaterial));
if (noMaterial.length > 0) {
  console.log(`\n${line()}`);
  console.log(`WARNING: ${plural(noMaterial.length, "missing concept has", "missing concepts have")} NO lesson.`);
  console.log(`This report would promise a partner material that does not exist.`);
  console.log(`Either the blueprint was dumped without --lessons, or the curriculum`);
  console.log(`has a hole. Check before sending this to anyone.`);
}
