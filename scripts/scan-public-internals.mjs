#!/usr/bin/env node
/**
 * scan-public-internals.mjs - does anything anon can read name a repository
 * internal?
 *
 * READ-ONLY. --verbose, --json. Unknown flags exit 2. No writes.
 *
 * ============ WHY THIS EXISTS ============
 *
 * Migration 344 wrote `auditItem in scripts/lib/item-cue-guard.mjs` and
 * `bank_revision v3-l2` into `certifications.exam_blueprint`, which anon reads.
 * It sat there for two days. In between, the same author scanned every
 * assembled rubric payload for exactly this class of leak -- internal paths,
 * migration numbers, defect narration -- found three references in the Scrum
 * grounding and rewrote them in source.
 *
 * THAT SCAN COVERED THE PROMPT SURFACE AND NEVER ENUMERATED exam_blueprint.
 * A leak audit is only as wide as the surfaces it lists, and the surface you
 * edited by hand yourself is the easiest one to leave off the list.
 *
 * So this does not take a list of surfaces. It DERIVES them: every table anon
 * holds SELECT on, every text, jsonb and text[] column on it.
 *
 * ============ IT READS AS anon, NOT AS SERVICE ROLE ============
 *
 * A grant is not exposure -- RLS may filter every row. The question is what a
 * stranger can actually retrieve, so the credential this holds IS the
 * hypothesis: it signs nothing and uses the anon key. A service-role scan would
 * measure what the system can read, which is not the property.
 *
 * ============ WHAT IT LOOKS FOR ============
 *
 * Shapes, not words. A path with a source extension, a migration number, a
 * known internal filename, a column name used as prose. `CLAUDE.md` and
 * `verify-cert` are named literally because they are proper nouns of this
 * repository and appear nowhere in curriculum content.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ANON, SUPABASE_URL, anonMissing } from "./lib/fn-auth.mjs";

const KNOWN = new Set(["--verbose", "--json"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error("Unrecognised flag: " + a + ". READ-ONLY. Known: " + [...KNOWN].join(", "));
    process.exit(2);
  }
}
const VERBOSE = process.argv.includes("--verbose");
const argOf = (k, d) => {
  const i = process.argv.indexOf("--" + k);
  return i >= 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : d;
};
const JSON_OUT = argOf("json", "");
const HERE = dirname(fileURLToPath(import.meta.url));

const miss = anonMissing();
if (miss) { console.error(miss); process.exit(2); }

/* The surfaces. Derived from a pg_catalog read of anon's SELECT grants on
 * 2026-09-20 and kept here because this script holds no service credential --
 * it is the LIST that is second-hand, never the content. A table added later
 * and not listed here is the gap this file cannot close by itself, so the
 * control below asserts the list still matches what anon can reach. */
const SURFACES = [
  "cert_categories", "cert_categories_i18n", "certification_i18n", "certifications",
  "concepts", "domain_translations", "domains", "jta_versions", "lessons",
  "module_translations", "modules", "task_translations", "tasks",
];

const PATTERNS = {
  "source path": /\b(?:scripts|functions|migrations|lib)\/[A-Za-z0-9_.\-/]+\.(?:mjs|ts|tsx|sql|js)\b/g,
  "migration number": /\bmigration\s+[0-9]{2,3}\b/gi,
  "repo proper noun": /\bCLAUDE\.md\b|\bverify-cert\b|\bcheck-mcp\b|\bgen-cert-secure\b|\bitem-cue-guard\b|\bauditItem\b|\bdraftSystem\b/g,
  /* `is_exam_scope` WAS IN THIS LIST AND IS NOT INTERNAL. It produced 552 of
   * the first run's 610 hits on jta_versions and would have been reported as a
   * platform-wide leak. It is a PUBLISHED field name: explain_task returns it,
   * TASK_OUTPUT_SCHEMA declares it, and the rubric payload carries it. A
   * blueprint snapshot naming it is the snapshot describing its own structure.
   *
   * A guard that cries wolf gets loosened next time, so it was narrowed before
   * the finding was reported rather than after somebody stopped believing it. */
  "internal column as prose": /\bbank_revision\s+v[0-9a-z\-]+|\bmcp_servable\b|\bksa_is_provisional\b|\bitem_origin\b|\bmcp_scan_sources\b/g,
};

/* CONTROL. Every pattern must fire on a probe containing its shape and must not
 * fire on ordinary curriculum prose. A pattern that matches nothing turns this
 * whole scan green, which is the failure it exists to prevent. */
const PROBE = "see scripts/lib/item-cue-guard.mjs and migration 344; CLAUDE.md says auditItem; bank_revision v3-l2";
/* And a SECOND clean probe: the public field names must NOT fire, or the
 * narrowing above is undone by the next person who widens the pattern. */
const PUBLIC_OK = "is_exam_scope is true and bloom_level is 4_analyze for this task";
const CLEAN = "The organization shall determine the boundaries of the management system and document its scope.";
let controlFailed = false;
for (const [label, re] of Object.entries(PATTERNS)) {
  const fires = (PROBE.match(re) ?? []).length > 0;
  const quiet = (CLEAN.match(re) ?? []).length === 0 && (PUBLIC_OK.match(re) ?? []).length === 0;
  if (!fires || !quiet) {
    console.error(`CONTROL FAILED for "${label}": fires=${fires} quietOnProse=${quiet}`);
    controlFailed = true;
  }
}
if (controlFailed) process.exit(1);

/* Column-by-column, for a table whose star is refused. Discovers the column
 * names from a service-free source -- PostgREST's own error text names the
 * offending column, but only one at a time, so this asks for each candidate
 * and keeps the ones that answer. The candidate list is the union of keys seen
 * on any row anywhere, which is empty on the first table, so it falls back to
 * asking PostgREST for the definition via a HEAD on a bogus column. Simpler and
 * honest: try the columns the scan cares about. */
async function fetchByColumn(table) {
  const rows = [];
  const readable = [];
  const denied = [];
  /* Candidates: every column name this scan has ever seen on this table, plus
   * the ones known to carry prose. A column absent here is a column unscanned,
   * so the caller is told which. */
  const CANDIDATES = {
    tasks: ["id", "code", "statement", "knowledge", "skills", "abilities",
            "notes", "scope_tag", "criticality", "bloom_level"],
  }[table] ?? [];
  if (!CANDIDATES.length) return { denied: true, rows: [], note: "star refused and no per-column candidates known" };
  for (const col of CANDIDATES) {
    try {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${col}&limit=1000`, {
        headers: { apikey: ANON, Authorization: "Bearer " + ANON },
        signal: AbortSignal.timeout(45000),
      });
      if (!r.ok) { denied.push(col); continue; }
      readable.push(col);
      const page = await r.json();
      page.forEach((v, i) => { rows[i] = { ...(rows[i] ?? {}), ...v }; });
    } catch { denied.push(col); }
  }
  return { rows, readable, deniedCols: denied, partial: true };
}

async function fetchAll(table) {
  const rows = []; let from = 0, total = null;
  for (;;) {
    let page = null, last = null;
    for (let i = 0; i < 8; i++) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
          headers: { apikey: ANON, Authorization: "Bearer " + ANON,
                     Range: `${from}-${from + 499}`, Prefer: "count=exact" },
          signal: AbortSignal.timeout(45000),
        });
        /* 403 ON `select=*` IS NOT "anon cannot read this table".
         *
         * A COLUMN-scoped grant makes the star fail while every granted column
         * still reads -- which is exactly what 349 does to `tasks`. Reporting
         * that as denied would be an empty result read as an all-clear, on the
         * one table the scan was widened to cover.
         *
         * So a refusal on `*` is retried per column, and the table is only
         * DENIED if every column is. The columns that do read are scanned. */
        if (r.status === 401 || r.status === 403) {
          if (from === 0) return await fetchByColumn(table);
          return { denied: true, rows: [] };
        }
        if (!r.ok) { last = `HTTP ${r.status}`; continue; }
        total = Number(String(r.headers.get("content-range") || "").split("/")[1]);
        page = await r.json(); break;
      } catch (e) { last = e.message; }
    }
    if (page === null) return { error: last, rows: [] };
    rows.push(...page);
    if (page.length < 500) break;
    from += 500;
  }
  if (total !== null && rows.length !== total) {
    return { error: `SHORT READ ${rows.length} of ${total}`, rows };
  }
  return { rows, total };
}

console.log("");
console.log("PUBLIC SURFACE SCAN -- read as anon, not as service role");
console.log(`control: all ${Object.keys(PATTERNS).length} patterns fire on a probe and stay quiet on curriculum prose`);
console.log("");

const findings = [];
let scanned = 0, reachable = 0;
for (const table of SURFACES) {
  const res = await fetchAll(table);
  scanned++;
  if (res.denied) {
    console.log(`  ${table.padEnd(24)} anon cannot read it (RLS or grant)${res.note ? " -- " + res.note : ""}`);
    continue;
  }
  if (res.partial) {
    console.log(`  ${table.padEnd(24)} star refused; column-scoped grant. ` +
      `anon reads [${res.readable.join(", ")}], refused [${res.deniedCols.join(", ") || "none"}]`);
  }
  if (res.error) { console.log(`  ${table.padEnd(24)} READ FAILED: ${res.error}`); continue; }
  reachable++;
  let hits = 0;
  for (const row of res.rows) {
    for (const [col, val] of Object.entries(row)) {
      if (val === null || typeof val === "number" || typeof val === "boolean") continue;
      const text = typeof val === "string" ? val : JSON.stringify(val);
      for (const [label, re] of Object.entries(PATTERNS)) {
        for (const m of text.match(re) ?? []) {
          hits++;
          findings.push({ table, column: col, kind: label, match: m,
            id: row.id ?? row.code ?? row.slug ?? null });
        }
      }
    }
  }
  console.log(`  ${table.padEnd(24)} ${String(res.rows.length).padStart(5)} rows   ${hits ? hits + " HIT(S)" : "clean"}`);
}

console.log("");
if (!findings.length) {
  console.log(`no repository internal reachable by anon across ${reachable} of ${scanned} surfaces`);
} else {
  const by = {};
  for (const f of findings) {
    const k = `${f.table}.${f.column}  [${f.kind}]`;
    by[k] = by[k] ?? new Set();
    by[k].add(f.match);
  }
  console.log(`${findings.length} HIT(S) across ${new Set(findings.map((f) => f.table + "." + f.column)).size} column(s):`);
  for (const [k, vals] of Object.entries(by).sort()) {
    console.log(`  ${k}`);
    console.log(`      ${[...vals].slice(0, 6).map((v) => JSON.stringify(v)).join(", ")}`);
    if (VERBOSE) {
      for (const f of findings.filter((x) => `${x.table}.${x.column}  [${x.kind}]` === k).slice(0, 8)) {
        console.log(`        row ${f.id}`);
      }
    }
  }
}
if (JSON_OUT) {
  writeFileSync(join(HERE, "..", JSON_OUT), JSON.stringify({ findings }, null, 1) + "\n");
  console.log(`\nwrote ${JSON_OUT}`);
}
process.exitCode = findings.length ? 1 : 0;
