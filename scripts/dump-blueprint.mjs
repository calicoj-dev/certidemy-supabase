// scripts/dump-blueprint.mjs
//
// Pull a live blueprint out of the database into JSON for the local harness,
// so the harness stops relying on a hardcoded copy.
//
//   node scripts/dump-blueprint.mjs                     # SM-AI-I, en
//   node scripts/dump-blueprint.mjs --cert SPO-AI-I
//   node scripts/dump-blueprint.mjs --cert SM-AI-I --lang es-419
//
// SAME LIABILITY THE RULESET HAD. analyze-local.mjs carried a hand-typed
// SM-AI-I blueprint with five domain weights. The moment a migration changes a
// weight, that copy is wrong and every divergence the harness reports is
// measured against a reference that does not exist. This script exists to make
// that copy unused.
//
// Uses the real BlueprintReader, so the firewall allowlist is exercised on
// every dump rather than only in production.

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { BlueprintReader } from "../functions/_shared/analyzer/reader.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "pctynukndxnmnxiqpgck";

const argv = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = argv.indexOf(`--${n}`);
  return i === -1 ? d : argv[i + 1];
};

const code = flag("cert", "SM-AI-I");
const lang = flag("lang", "en");
const outPath = flag("out", join(HERE, "..", "..", "fixtures", `blueprint-${code}-${lang}.json`));

function loadKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  for (const c of [join(HERE, "..", ".env"), join(HERE, "..", "..", ".env")]) {
    if (!existsSync(c)) continue;
    const m = readFileSync(c, "utf8").match(
      /^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?([^"\n\r]+)"?/m,
    );
    if (m) return m[1].trim();
  }
  return null;
}

const KEY = loadKey();
if (!KEY) {
  console.error(
    'SUPABASE_SERVICE_ROLE_KEY not found.\n  $env:SUPABASE_SERVICE_ROLE_KEY = "<key>"\n' +
      "Project Settings -> API. It is a secret; do not commit it.",
  );
  process.exit(1);
}

const reader = new BlueprintReader({
  restUrl: `https://${PROJECT_REF}.supabase.co/rest/v1`,
  apiKey: KEY,
});

const blueprint = await reader.loadByCode(code, lang);

writeFileSync(outPath, JSON.stringify(blueprint, null, 2), "utf8");

const weightSum = blueprint.domains.reduce((s, d) => s + d.weightPct, 0);
const examScope = blueprint.tasks.filter((t) => t.isExamScope).length;
const linked = blueprint.concepts.filter((c) => c.taskIds.length > 0).length;
const links = blueprint.concepts.reduce((s, c) => s + c.taskIds.length, 0);

console.log(`wrote ${blueprint.code} (${lang}) -> ${outPath}`);
console.log(`  domains   ${blueprint.domains.length}  weights sum ${weightSum}`);
console.log(`  tasks     ${blueprint.tasks.length}  exam-scope ${examScope}`);
console.log(`  concepts  ${blueprint.concepts.length}  linked ${linked}  links ${links}`);
console.log(`  reuse     ${links - linked} (links beyond one per concept)`);
console.log(`  tables read: ${[...new Set(reader.accessLog)].join(", ")}`);

// A concept with no task link is unreachable: nothing in the JTA claims it, so
// matching a source against it would credit coverage the blueprint does not
// actually assert.
const orphans = blueprint.concepts.length - linked;
if (orphans > 0) {
  console.log(`\n  WARNING: ${orphans} concept(s) have no task link.`);
  console.log(`  An unlinked concept is unreachable from the JTA. Coverage credited`);
  console.log(`  against it would be coverage of something the blueprint does not assert.`);
}
