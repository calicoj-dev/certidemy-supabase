// scripts/verify-invariants.mjs
//
// PLATFORM-WIDE INVARIANTS. Read-only. Exits non-zero on any failure, so it can
// gate a build.
//
//   node scripts/verify-invariants.mjs
//   node scripts/verify-invariants.mjs --json
//
// Distinct from verify-cert.mjs, which checks ONE certification's internal
// consistency. These are cross-cutting properties that no single certification
// owns, and every one of them was added because it caught something real or
// because its absence let something real through:
//
//   1. CONCEPT COVERAGE -- every concept has a lesson teaching it.
//      Passing today across all 11 certifications. Frozen now precisely BECAUSE
//      it passes: a certification that later ships with untaught concepts would
//      surface in a partner-facing build plan as "no lesson teaches this",
//      promising licensed material that does not exist.
//
//   2. DRIFT RULE SELF-MATCH -- every regex rule matches its own legacy term.
//      Migration 220 shipped rule 11 with \b, which is BACKSPACE in Postgres.
//      The rule was dead and found nothing. The smoke test passed, because a
//      rule that never fires never produces a false positive. ONLY this check
//      can see a dead rule, and a dead rule looks exactly like a clean document.
//
//   3. DRIFT RULE GROUNDING -- every rule cites an authority citation.
//      NOT NULL in the schema, verified here because a rule grounded in model
//      training knowledge rather than standard text is the attribution failure
//      that produced false "ISO 19011 requires..." claims.
//
//   4. BLUEPRINT WEIGHTS -- domain weights sum to 100 per certification.
//      Every divergence computed against a broken blueprint would be
//      confidently wrong.
//
//   5. ORPHAN CONCEPTS -- every concept is reachable from at least one task.
//      An unlinked concept is unreachable from the JTA, so crediting a source
//      with covering it credits something the blueprint does not assert.
//
//   6. MATCH TERM COLLISIONS -- no term is approved for two concepts.
//      One mention would credit both. Silent double-counting, and it inflates a
//      competitor's readiness -- the one failure in this engine that looks like
//      a good result rather than a bug.

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = "pctynukndxnmnxiqpgck";
const BASE = `https://${PROJECT_REF}.supabase.co/rest/v1`;
const asJson = process.argv.includes("--json");

function loadKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  for (const c of [join(HERE, "..", ".env"), join(HERE, "..", "..", ".env")]) {
    if (!existsSync(c)) continue;
    const m = readFileSync(c, "utf8").match(/^\s*SUPABASE_SERVICE_ROLE_KEY\s*=\s*"?([^"\n\r]+)"?/m);
    if (m) return m[1].trim();
  }
  return null;
}
const KEY = loadKey();
if (!KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY not set.\n  $env:SUPABASE_SERVICE_ROLE_KEY = "<key>"');
  process.exit(1);
}

async function get(path) {
  const res = await fetch(`${BASE}/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} on ${path}: ${await res.text()}`);
  return res.json();
}

const results = [];
const record = (name, failures, detail) =>
  results.push({ name, pass: failures.length === 0, failures, detail });

// ------------------------------------------------------------------- pull

const certs = await get("certifications?select=id,code,status&order=code");
const certById = new Map(certs.map((c) => [c.id, c]));
const concepts = await get("concepts?select=id,slug,name,certification_id,match_terms");
const tasks = await get("tasks?select=id,certification_id,domain_id");
const domains = await get("domains?select=id,code,certification_id,weight_pct");
const taskConcepts = await get("task_concepts?select=task_id,concept_id");
const lessonConcepts = await get("lesson_concepts?select=concept_id");
const rules = await get(
  "drift_rules?select=id,legacy_term,match_mode,pattern,lang,is_active,authority_citation_id",
);

// ---------------------------------------------- 1. concept coverage

{
  const taught = new Set(lessonConcepts.map((l) => l.concept_id));
  const failures = concepts
    .filter((c) => !taught.has(c.id))
    .map((c) => `${certById.get(c.certification_id)?.code ?? "?"} / ${c.slug}`);
  record("concept coverage", failures, `${concepts.length} concepts across ${certs.length} certifications`);
}

// ---------------------------------------- 2 & 3. drift rule health

{
  // Same Postgres-to-JS translation as regex.ts. NOT \b: JS word boundaries are
  // ASCII-only and fail on a term whose first or last character is accented,
  // which is most of the future es-419 and pt-BR ruleset.
  const W = "\\p{L}\\p{N}_";
  const toJs = (p) =>
    p
      .replace(/\\m/g, `(?<![${W}])`)
      .replace(/\\M/g, `(?![${W}])`)
      .replace(/\\y/g, `(?:(?<![${W}])|(?![${W}]))`);

  const dead = [];
  for (const r of rules.filter((x) => x.is_active && x.match_mode === "regex")) {
    if (!r.pattern) {
      dead.push(`${r.lang} "${r.legacy_term}": regex mode with null pattern`);
      continue;
    }
    try {
      if (!new RegExp(toJs(r.pattern), "iu").test(r.legacy_term)) {
        dead.push(`${r.lang} "${r.legacy_term}": /${r.pattern}/ does not match its own term`);
      }
    } catch (err) {
      dead.push(`${r.lang} "${r.legacy_term}": ${err.message}`);
    }
  }
  record("drift rule self-match", dead, `${rules.filter((r) => r.is_active).length} active rules`);

  const ungrounded = rules
    .filter((r) => r.is_active && !r.authority_citation_id)
    .map((r) => `${r.lang} "${r.legacy_term}"`);
  record("drift rule grounding", ungrounded, "every rule cites actual standard text");
}

// ------------------------------------------------- 4. blueprint weights

{
  const byCert = new Map();
  for (const d of domains) {
    byCert.set(d.certification_id, (byCert.get(d.certification_id) ?? 0) + Number(d.weight_pct));
  }
  const failures = [];
  for (const [certId, sum] of byCert) {
    if (Math.abs(sum - 100) > 0.01) {
      failures.push(`${certById.get(certId)?.code ?? certId}: weights sum to ${sum}, not 100`);
    }
  }
  record("blueprint weights", failures, `${byCert.size} certifications`);
}

// ------------------------------------------------- 5. orphan concepts

{
  const linked = new Set(taskConcepts.map((t) => t.concept_id));
  const failures = concepts
    .filter((c) => !linked.has(c.id))
    .map((c) => `${certById.get(c.certification_id)?.code ?? "?"} / ${c.slug}`);
  record("concept reachability", failures, "every concept reachable from a task");
}

// --------------------------------------------- 6. match term collisions

{
  const owners = new Map();
  for (const c of concepts) {
    for (const term of c.match_terms ?? []) {
      const key = `${c.certification_id}::${String(term).toLowerCase().replace(/\s+/g, " ")}`;
      const arr = owners.get(key) ?? [];
      arr.push(c.slug);
      owners.set(key, arr);
    }
  }
  const failures = [];
  for (const [key, slugs] of owners) {
    if (slugs.length > 1) {
      failures.push(`"${key.split("::")[1]}" claimed by ${slugs.join(", ")}`);
    }
  }
  const termCount = concepts.reduce((n, c) => n + (c.match_terms?.length ?? 0), 0);
  record("match term uniqueness", failures, `${termCount} terms authored`);
}

// ----------------------------------------------------------------- report

if (asJson) {
  console.log(JSON.stringify({ pass: results.every((r) => r.pass), results }, null, 2));
} else {
  console.log("PLATFORM INVARIANTS\n");
  for (const r of results) {
    console.log(`  ${r.pass ? "pass" : "FAIL"}  ${r.name.padEnd(24)} ${r.detail}`);
    // Failures are listed in full up to a limit. A truncated failure list makes
    // people fix the visible ones and re-run, which is slower than showing them.
    for (const f of r.failures.slice(0, 25)) console.log(`          - ${f}`);
    if (r.failures.length > 25) console.log(`          ... ${r.failures.length - 25} more`);
  }
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} invariants hold`);
}

process.exit(results.every((r) => r.pass) ? 0 : 1);
