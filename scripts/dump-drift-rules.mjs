// scripts/dump-drift-rules.mjs
//
// Pull the live drift ruleset out of the database into JSON for the local
// harness, so the harness stops relying on its built-in mirror.
//
//   node scripts/dump-drift-rules.mjs
//   node scripts/dump-drift-rules.mjs --lang es-419
//   node scripts/dump-drift-rules.mjs --out ../fixtures/drift-rules.json
//
// THE MIRROR IS A LIABILITY. analyze-local.mjs carries a hardcoded copy of
// migration 220 so it can run standalone. The moment the database ruleset is
// edited, that copy is wrong and the harness is calibrating an engine against
// rules that are not the rules. This script exists to make the mirror unused.
//
// No dependencies. Node 18+ has fetch; service_role bypasses RLS, which is why
// the analyzer tables need no policy for this to work.
//
// CREDENTIALS: set SUPABASE_SERVICE_ROLE_KEY in the environment, or put it in a
// .env file beside this script's parent. It is a secret -- never commit it,
// never paste it into a chat.

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { getAll, requireKey } from "./_pg.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

const argv = process.argv.slice(2);
function flag(name, fallback = null) {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
}
const lang = flag("lang", null);
const outPath = flag("out", join(HERE, "..", "..", "fixtures", "drift-rules.json"));

const KEY = requireKey(HERE);
const get = (path) => getAll(KEY, path);

const cols = [
  "id",
  "rule_class",
  "lang",
  "legacy_term",
  "current_term",
  "match_mode",
  "pattern",
  "severity",
  "authority_source_id",
  "authority_citation_id",
  "rationale",
].join(",");

let query = `drift_rules?select=${cols}&is_active=eq.true&order=severity,legacy_term`;
if (lang) query += `&lang=eq.${encodeURIComponent(lang)}`;

const rows = await get(query);

const rules = rows.map((r) => ({
  id: r.id,
  ruleClass: r.rule_class,
  lang: r.lang,
  legacyTerm: r.legacy_term,
  currentTerm: r.current_term,
  matchMode: r.match_mode,
  pattern: r.pattern,
  severity: r.severity,
  authoritySourceId: r.authority_source_id,
  authorityCitationId: r.authority_citation_id,
  rationale: r.rationale,
}));

// --------------------------------------------------- the self-match check
//
// Mirrors the SQL invariant and the one inside regex.ts. Running it HERE too
// means a broken pattern is caught at dump time rather than surfacing as a
// document that mysteriously has no findings.
//
// Postgres \m and \M are translated the same way regex.ts does it: Unicode-aware
// lookarounds, NOT \b. JavaScript's \b is ASCII-only and fails on a term whose
// first or last character is accented -- which is most of the es-419 and pt-BR
// ruleset waiting to be written.

const W = "\\p{L}\\p{N}_";
function toJs(pattern) {
  return pattern
    .replace(/\\m/g, `(?<![${W}])`)
    .replace(/\\M/g, `(?![${W}])`)
    .replace(/\\y/g, `(?:(?<![${W}])|(?![${W}]))`);
}

const dead = [];
for (const r of rules) {
  if (r.matchMode !== "regex" || !r.pattern) continue;
  try {
    const re = new RegExp(toJs(r.pattern), "iu");
    if (!re.test(r.legacyTerm)) {
      dead.push({ term: r.legacyTerm, pattern: r.pattern, reason: "does not match its own term" });
    }
  } catch (err) {
    dead.push({ term: r.legacyTerm, pattern: r.pattern, reason: err.message });
  }
}

writeFileSync(outPath, JSON.stringify(rules, null, 2), "utf8");

const byLang = rules.reduce((acc, r) => ((acc[r.lang] = (acc[r.lang] ?? 0) + 1), acc), {});
const byClass = rules.reduce((acc, r) => ((acc[r.ruleClass] = (acc[r.ruleClass] ?? 0) + 1), acc), {});

console.log(`wrote ${rules.length} rules -> ${outPath}`);
console.log(`  by lang :`, byLang);
console.log(`  by class:`, byClass);

if (dead.length) {
  console.log(`\nDEAD RULES (${dead.length}) -- these find NOTHING and look like a clean document:`);
  for (const d of dead) console.log(`  ! ${d.term}  /${d.pattern}/  ${d.reason}`);
  process.exit(1);
}
console.log("  self-match: all regex rules match their own legacy term");
