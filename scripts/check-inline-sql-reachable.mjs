#!/usr/bin/env node
/**
 * check-inline-sql-reachable.mjs -- can the role that runs the edge function's
 * SQL actually REACH every function that SQL names?
 *
 * READ-ONLY, no writes, exits 2 on an unknown flag. Run BEFORE deploying.
 *
 * ============ THE OUTAGE THIS EXISTS FOR ============
 *
 * `courseware-read` was deployed calling `extensions.unaccent(...)`. Every
 * search returned HTTP 500 {"error":"read failed"} in every language,
 * deterministically.
 *
 *   role          USAGE on extensions    EXECUTE on unaccent
 *   mcp_reader    FALSE                  true
 *
 * EXECUTE WAS TRUE -- extension functions are granted to PUBLIC -- and the call
 * was refused at the SCHEMA DOOR before the ACL was ever consulted.
 *
 * ============ AND THE CHECK ALREADY EXISTED FOR THE OTHER HALF ============
 *
 * `scripts/sql/check-view-function-grant-gap.sql` asks exactly this question
 * about functions called inside `mcp` VIEWS, and CLAUDE.md records the rule it
 * came from: a reachability check asks `has_function_privilege` AND
 * `has_schema_privilege`, and reports WHICH gate is shut, because the two need
 * opposite fixes.
 *
 * It covers views. It does not cover SQL ASSEMBLED IN TYPESCRIPT AND SENT OVER
 * THE WIRE, which is where the search query lives -- a second call site that no
 * enumeration of views can see. Same shape as "the reader list is not the
 * resource map", one layer out.
 *
 * ============ WHAT IT CANNOT DO ============
 *
 * Static: it reads schema-qualified `schema.fn(` literals out of the source. A
 * name built at runtime is invisible to it, and an UNQUALIFIED call is invisible
 * too -- deliberately, because an unqualified call is a different defect that
 * `search_path` decides, and reporting it here would conflate two questions.
 * The extraction is asserted non-empty, because a regex that matches nothing
 * turns the whole script green.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const KNOWN = new Set(["--verbose"]);
for (const a of process.argv.slice(2)) {
  if (a.startsWith("--") && !KNOWN.has(a)) { console.error("Unrecognised flag: " + a + ". READ-ONLY."); process.exit(2); }
}
const VERBOSE = process.argv.includes("--verbose");
const HERE = dirname(fileURLToPath(import.meta.url)), ROOT = join(HERE, "..");
for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is not set"); process.exit(2); }

/* The roles the courseware path actually connects as. Named, not inferred:
 * a role list guessed from a config file is the thing that goes stale. */
const ROLES = ["mcp_reader", "mcp_holder"];

/* Sources whose SQL is assembled in TypeScript and executed by those roles. */
const SOURCES = [
  join(ROOT, "functions", "_shared", "courseware-query.ts"),
  join(ROOT, "functions", "courseware-read", "index.ts"),
];

/* Schemas whose functions are worth asserting. `pg_catalog` and bare SQL
 * built-ins need no grant and would be noise. */
const WATCH = new Set(["mcp", "public", "extensions"]);

const found = new Map();   // "schema.fn" -> Set(file)
for (const f of SOURCES) {
  if (!existsSync(f)) { console.error("missing source: " + f); process.exit(2); }
  const src = readFileSync(f, "utf8");
  /* Strip line comments first: this file's own header names
   * `extensions.unaccent` while describing the outage, and a checker that
   * flagged its own explanation would be the guard crying wolf. */
  const code = src.split(/\r?\n/).filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  for (const m of code.matchAll(/\b([a-z_][a-z0-9_]*)\.([a-z_][a-z0-9_]*)\s*\(/gi)) {
    const schema = m[1].toLowerCase(), fn = m[2].toLowerCase();
    if (!WATCH.has(schema)) continue;
    const key = schema + "." + fn;
    if (!found.has(key)) found.set(key, new Set());
    found.get(key).add(f.slice(ROOT.length + 1));
  }
}

/* THE EXTRACTOR ASSERTS ITSELF. A regex that matches nothing reports a clean
 * sweep, which is the failure this repository has recorded against its own
 * fragment extractor. */
if (found.size === 0) {
  console.error("");
  console.error("EXTRACTOR FOUND NOTHING. Either the sources moved or the pattern broke.");
  console.error("A clean result from an extractor that matched nothing is not a clean result.");
  process.exit(2);
}

const BASE = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "content-type": "application/json" };

/* Resolve each name to a real function and ask both gates, per role. */
const names = [...found.keys()];
const sql =
  "select n.nspname || '.' || p.proname as fname, r.rolname, " +
  "has_function_privilege(r.rolname, p.oid, 'EXECUTE') as can_execute, " +
  "has_schema_privilege(r.rolname, n.nspname, 'USAGE') as can_use_schema " +
  "from pg_proc p join pg_namespace n on n.oid = p.pronamespace " +
  "cross join (select unnest($1::text[]) as rolname) r " +
  "where n.nspname || '.' || p.proname = any($2::text[])";

/* PostgREST cannot run arbitrary SQL, so this asks through a helper the repo
 * already exposes if present, and otherwise reports UNVERIFIABLE rather than
 * passing. An absent instrument is a result, not a clean sweep. */
let rows = null;
try {
  const r = await fetch(BASE + "/rpc/mcp_check_reachable", {
    method: "POST", headers: H,
    body: JSON.stringify({ p_roles: ROLES, p_names: names }),
  });
  if (r.ok) rows = await r.json();
} catch { /* fall through */ }

console.log("");
console.log("INLINE SQL REACHABILITY -- functions named in TypeScript-assembled SQL");
console.log("  roles: " + ROLES.join(", "));
console.log("  functions found: " + names.length + "   <- the denominator");
for (const k of names.sort()) {
  if (VERBOSE) console.log("    " + k.padEnd(28) + [...found.get(k)].join(", "));
}

if (!rows) {
  console.log("");
  console.log("  UNVERIFIABLE -- no mcp_check_reachable() RPC on this database.");
  console.log("  The names above were extracted; their reachability was NOT tested.");
  console.log("  That is a RESULT, not a pass: run the SQL in");
  console.log("  scripts/sql/check-inline-sql-reachable.sql instead, or add the helper.");
  console.log("");
  console.log("  Names to check by hand:");
  for (const k of names.sort()) console.log("    " + k);
  process.exit(2);
}

let fail = 0;
for (const row of rows) {
  const ok = row.can_execute === true && row.can_use_schema === true;
  if (!ok) fail++;
  const why = row.can_execute !== true
    ? "no EXECUTE"
    : row.can_use_schema !== true
      ? "NO USAGE ON SCHEMA -- refused at the schema door before the ACL is read"
      : "";
  console.log("  " + (ok ? "PASS  " : "FAIL  ") + row.fname.padEnd(28) + row.rolname.padEnd(12) + why);
}
console.log("");
if (fail) { console.log("UNREACHABLE: " + fail + ". Deploying this would 500 every call."); process.exit(1); }
console.log("REACHABLE: every function the inline SQL names is callable by every role that runs it.");
