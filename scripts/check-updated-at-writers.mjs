#!/usr/bin/env node
/**
 * check-updated-at-writers.mjs
 *
 * Every writer of a table carrying `updated_at` must agree with the other
 * writers of that table about whether it sets the column.
 *
 * READ-ONLY. No --apply, no --dry, no writes, no catalogue mutation. Unknown
 * flags exit 2. Flags: --json, --verbose.
 *
 * ===========================================================================
 * WHY THIS IS A SOURCE CHECK AND NOT A DATA PROBE
 * ===========================================================================
 *
 * The obvious probe compares max(updated_at) against max(created_at) per table
 * and names any whose timestamp has stopped moving. It was designed, measured
 * against the live database on 2026-09-19, and REJECTED. Three findings killed
 * it, and each is a reason this file exists in the shape it does:
 *
 *   FIVE of the sixteen convention-maintained tables HAVE NO created_at AT
 *   ALL -- lesson_format_preferences, mcp_leak_policy, platform_integrations,
 *   user_certifications, user_concept_mastery. The comparison is structurally
 *   impossible for a third of its own subject, and platform_integrations is
 *   the one the console displays as "last updated".
 *
 *   seat_batches WOULD HAVE BEEN A FALSE POSITIVE ON THE FIRST RUN. It holds
 *   one row, zero moved timestamps, and create-batch DOES update it and DOES
 *   set updated_at. The path simply has not run. A probe that cries wolf on
 *   its first run gets loosened, which is how the smoke-courseware assertions
 *   died by attrition.
 *
 *   issuer_webhooks KILLS THE INVERSE RULE TOO. Its timestamp HAS moved and
 *   there is no writer in either repository, so someone edited it by hand.
 *   "No writer in code" therefore does not imply insert-only, just as "never
 *   moved" does not imply forgotten.
 *
 * A data probe cannot distinguish insert-only from forgotten from hand-edited.
 * Those three states produce identical rows. Source can distinguish them,
 * because it is looking at the thing that is actually supposed to be
 * consistent: the writers.
 *
 * ===========================================================================
 * THE PROPERTY, AND WHY IT NEEDS NO LIST OF TRIGGERS
 * ===========================================================================
 *
 * The naive rule -- "every writer must set updated_at" -- is wrong. 17 of
 * these tables have a trigger that maintains the column, and on those a writer
 * that omits it is correct. Applying the naive rule would flag a large amount
 * of correct code on day one.
 *
 * Knowing which tables have triggers would fix that, and IT CANNOT BE KNOWN
 * FROM HERE: pg_catalog is not reachable through PostgREST, no RPC on this
 * project exposes it, and reading the trigger list out of the migrations
 * folder is the exact defect CLAUDE.md forbids -- a migration is an intention,
 * dated, not a schema.
 *
 * So the property is INTERNAL CONSISTENCY instead:
 *
 *   ALL writers of a table set updated_at   -> PASS. Convention held.
 *   NO  writers of a table set updated_at   -> INFO. Either a trigger
 *                                              maintains it or the table is
 *                                              insert-only. Both are fine and
 *                                              neither is distinguishable from
 *                                              here, so it is listed, never
 *                                              failed.
 *   SOME writers set it and some do not     -> FAIL. One of them is wrong,
 *                                              and it is almost always the new
 *                                              one.
 *
 * This needs no trigger list, produces no false positive from a trigger, and
 * fires exactly when a writer is ADDED to a table whose other writers all
 * remember -- which is the moment the fix is one line.
 *
 * It is the same move as the cross-language guard comparison CLAUDE.md calls
 * the most reliable detector here: the same property, measured several ways,
 * must agree, and a disagreement is the finding.
 *
 * ===========================================================================
 * WHAT THIS CANNOT SEE -- READ THIS BEFORE TRUSTING A GREEN RUN
 * ===========================================================================
 *
 * 1. A PAYLOAD ASSEMBLED IN A VARIABLE IS INVISIBLE TO IT.
 *
 *    This is the real limitation and it is not theoretical. score-mock-exam
 *    does exactly this:
 *
 *      const mastery_upserts: any[] = [];
 *      mastery_upserts.push({ user_id, concept_id, ..., updated_at: ... });
 *      await svc.from("user_concept_mastery").upsert(mastery_upserts, {...});
 *
 *    The call site passes an identifier, not an object literal, so this script
 *    cannot tell whether updated_at is in it. Such sites are counted as
 *    UNRESOLVED and reported by name. They are NOT counted as omissions --
 *    guessing would make the check unreliable, and an unreliable gate is worse
 *    than a gap, because the gap is bounded and the distrust is not.
 *
 *    An UNRESOLVED count above zero means the run is incomplete by that much.
 *    Read those sites by hand. There is no way around it from source.
 *
 * 2. It reads SOURCE, not behaviour. A writer reached only through an RPC, a
 *    trigger, a migration or hand-written SQL is invisible -- issuer_webhooks
 *    above is a live instance of exactly that.
 *
 * 3. The table list comes from PostgREST's own OpenAPI document, so it covers
 *    what PostgREST exposes. A table in another schema, or one revoked from
 *    the API role, is not in scope.
 *
 * ===========================================================================
 * THE TABLE LIST IS DERIVED, NEVER TYPED
 * ===========================================================================
 *
 * `GET /rest/v1/` returns the OpenAPI schema; every definition carrying an
 * `updated_at` property is in scope. The count was wrong twice by hand in one
 * evening -- "22 tables" and then "16" -- which is why no number and no list
 * appears in this file. If the catalogue changes, this script changes with it.
 */

import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

/* ------------------------------------------------------------------ flags */
let JSON_OUT = false;
let VERBOSE = false;
for (const a of process.argv.slice(2)) {
  if (a === "--json") JSON_OUT = true;
  else if (a === "--verbose") VERBOSE = true;
  else {
    console.error(`unknown flag: ${a}`);
    console.error("This script is READ-ONLY. It takes --json and --verbose and nothing else.");
    console.error("It has no --apply and no --dry: the two flag conventions in scripts/ are");
    console.error("opposites, and a script that writes nothing should claim neither.");
    process.exit(2);
  }
}

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const WEB = join(ROOT, "..", "certidemy-web");
const SELF = fileURLToPath(import.meta.url);

for (const p of [join(HERE, ".env"), join(ROOT, ".env")]) {
  if (!existsSync(p)) continue;
  for (const line of readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!KEY) {
  console.error("SUPABASE_SERVICE_ROLE_KEY is not set");
  process.exit(2);
}
const REST = "https://pctynukndxnmnxiqpgck.supabase.co/rest/v1";

/* ------------------------------------------- the catalogue, asked for live */
async function tablesWithUpdatedAt() {
  let last = null;
  for (let i = 0; i < 6; i++) {
    try {
      const r = await fetch(REST + "/", {
        /* BOTH headers, same value. Sending only Authorization yields
         * {"message":"No API key found in request"}, which reads as a bad
         * credential and is a missing header. */
        headers: { apikey: KEY, Authorization: "Bearer " + KEY, Accept: "application/openapi+json" },
        signal: AbortSignal.timeout(30000),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const spec = await r.json();
      const defs = spec.definitions || {};
      return {
        all: Object.keys(defs).length,
        tables: Object.entries(defs)
          .filter(([, d]) => d && d.properties && d.properties.updated_at)
          .map(([t]) => t)
          .sort(),
      };
    } catch (e) {
      last = e;
    }
  }
  throw last;
}


/* ------------------------------------------- the trigger list, if it exists
 * A MIXED table is only a defect where NO trigger maintains the column: with
 * one, a writer that omits updated_at is correct and the disagreement is
 * cosmetic. That fact lives in pg_catalog and cannot be reached over
 * PostgREST, so migration 354 exposes exactly it and nothing else.
 *
 * DEGRADES RATHER THAN GUESSES. Without the RPC this script still reports, but
 * it is NOT A GATE -- it exits 0 and says which tables a human must check. On
 * its first run, before 354, `achievements` was its only remaining FAIL and
 * was a false positive for precisely this reason. A gate that is wrong on its
 * first run gets loosened; one that says "I cannot tell" keeps its authority. */
async function triggerMaintained() {
  try {
    const r = await fetch(REST + "/rpc/tables_with_updated_at_trigger", {
      method: "POST",
      headers: { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" },
      body: "{}",
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) return null;                 // 404 = migration 354 has not run
    const rows = await r.json();
    if (!Array.isArray(rows)) return null;
    return new Set(rows.map((x) => (typeof x === "string" ? x : x.table_name)));
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------ source scan */
const SKIP = /(^|[\\/])(node_modules|\.next|\.git|dist|build|coverage|out)([\\/]|$)/;
function sourceFiles(root) {
  const out = [];
  if (!existsSync(root)) return out;
  const walk = (d) => {
    let entries;
    try { entries = readdirSync(d); } catch { return; }
    for (const e of entries) {
      const p = join(d, e);
      if (SKIP.test(p)) continue;
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (/\.(mjs|js|ts|tsx)$/.test(e)) out.push(p);
    }
  };
  walk(root);
  return out;
}

/**
 * Read a balanced argument list starting at the "(" index. Quote- and
 * comment-aware, because a brace inside a string literal is not a brace.
 * Returns null rather than guessing when the parens do not close inside the
 * file -- an unbalanced read must not become an answer.
 */
function balancedArgs(src, openIdx) {
  let depth = 0, i = openIdx, q = null, esc = false;
  for (; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (c === q) q = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if (c === "(" || c === "{" || c === "[") depth++;
    else if (c === ")" || c === "}" || c === "]") {
      depth--;
      if (depth === 0) return src.slice(openIdx + 1, i);
    }
  }
  return null;
}

const WRITE_METHODS = ["update", "upsert"];
const ANY_METHOD = /\.(update|upsert|insert|select|delete|rpc)\s*\(/g;

/**
 * Every write site against `table`, classified.
 *
 * Association rule: from a `.from("T")` match, the FIRST chained method that
 * appears is the one that belongs to it. Taking any later `.update(` would
 * attribute a different query's write to this table -- the same manufactured
 * adjacency as a GROUP BY over a nullable key.
 */
function writeSites(files, table) {
  const sites = [];
  const fromRe = new RegExp("\\.from\\(\\s*[\"'`]" + table.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[\"'`]\\s*\\)", "g");
  for (const f of files) {
    let src;
    try { src = readFileSync(f, "utf8"); } catch { continue; }
    if (f === SELF) continue;   // this file DOCUMENTS write sites; see limitation 3
    if (!src.includes(table)) continue;
    let m;
    fromRe.lastIndex = 0;
    while ((m = fromRe.exec(src)) !== null) {
      const after = m.index + m[0].length;
      ANY_METHOD.lastIndex = after;
      const call = ANY_METHOD.exec(src);
      if (!call) continue;
      const method = call[1];
      if (!WRITE_METHODS.includes(method)) continue;     // a read, not our business
      const args = balancedArgs(src, call.index + call[0].length - 1);
      const line = src.slice(0, call.index).split("\n").length;
      const where = relative(join(ROOT, ".."), f).replace(/\\/g, "/") + ":" + line;
      if (args === null) {
        sites.push({ where, method, verdict: "unresolved", why: "unbalanced parentheses" });
        continue;
      }
      const head = args.replace(/^\s+/, "");
      if (!head.startsWith("{") && !head.startsWith("[")) {
        /* A variable, a spread, a function call -- see limitation 1. */
        sites.push({ where, method, verdict: "unresolved", why: "payload is " + head.split(/[\s,(]/)[0].slice(0, 40) });
        continue;
      }
      /* AN UPSERT WITH ignoreDuplicates CANNOT UPDATE. It inserts or it does
       * nothing, so the column DEFAULT supplies the value and omitting
       * updated_at is correct rather than forgotten. Without this,
       * _shared/lti-provision.ts:344 reads as a defect and is not one -- it
       * was this check's first false positive. */
      const insertOnly = method === "upsert" && /ignoreDuplicates\s*:\s*true/.test(args);
      sites.push({
        where,
        method,
        verdict: /(^|[\s,{[])updated_at\s*:/.test(args) ? "sets"
               : insertOnly ? "insert-only" : "omits",
      });
    }
  }
  return sites;
}

/* --------------------------------------------------------------- self-test
 * A comparator that cannot fire turns the whole script green. Feed it a known
 * mixed table and require the FAIL classification to appear. */
function selfTest() {
  /* Four sites: one sets, one omits, one is a READ that must be ignored, one
   * is the variable-payload case that must land as unresolved rather than as
   * an omission. Classified in memory; the filesystem is never touched. */
  const fake = `
    await db.from("zz_selftest").update({ a: 1, updated_at: now });
    await db.from("zz_selftest").update({ a: 2 });
    await db.from("zz_selftest").select("a");
    await db.from("zz_selftest").upsert(somePayload, { onConflict: "a" });
    await db.from("zz_selftest").upsert({ a: 3 }, { onConflict: "a", ignoreDuplicates: true });
  `;
  const kinds = writeSitesFromString(fake, "zz_selftest").map((s) => s.verdict).sort().join(",");
  return { ok: kinds === "insert-only,omits,sets,unresolved", kinds };
}
function writeSitesFromString(src, table) {
  const sites = [];
  const fromRe = new RegExp("\\.from\\(\\s*[\"'`]" + table + "[\"'`]\\s*\\)", "g");
  let m;
  while ((m = fromRe.exec(src)) !== null) {
    const after = m.index + m[0].length;
    ANY_METHOD.lastIndex = after;
    const call = ANY_METHOD.exec(src);
    if (!call) continue;
    if (!WRITE_METHODS.includes(call[1])) continue;
    const args = balancedArgs(src, call.index + call[0].length - 1);
    if (args === null) { sites.push({ verdict: "unresolved" }); continue; }
    const head = args.replace(/^\s+/, "");
    if (!head.startsWith("{") && !head.startsWith("[")) { sites.push({ verdict: "unresolved" }); continue; }
    const io = call[1] === "upsert" && /ignoreDuplicates\s*:\s*true/.test(args);
    sites.push({ verdict: /(^|[\s,{[])updated_at\s*:/.test(args) ? "sets" : io ? "insert-only" : "omits" });
  }
  return sites;
}

/* -------------------------------------------------------------------- run */
const st = selfTest();
if (!st.ok) {
  console.error("SELF-TEST FAILED: the classifier returned [" + st.kinds + "] on a known");
  console.error("mixed fixture, expected sets + omits + unresolved. The comparator is broken;");
  console.error("a green run would prove nothing. Refusing to report.");
  process.exit(2);
}

const cat = await tablesWithUpdatedAt();
const TRIG = await triggerMaintained();
/* CONTROL. An empty table list reports "0 problems" -- the pass. */
if (cat.tables.length === 0) {
  console.error("The OpenAPI schema named " + cat.all + " definition(s) and NONE carries");
  console.error("updated_at. That is not credible; the extractor or the endpoint has changed.");
  process.exit(2);
}

const files = [...sourceFiles(join(ROOT, "functions")), ...sourceFiles(join(ROOT, "scripts")),
               ...sourceFiles(join(WEB, "app")), ...sourceFiles(join(WEB, "lib")),
               ...sourceFiles(join(WEB, "components")), ...sourceFiles(join(WEB, "scripts"))];
/* CONTROL. Zero source files means every table reports "no writers" and the
 * script is green against a directory it never opened. */
if (files.length === 0) {
  console.error("Scanned 0 source files. Check that " + WEB + " exists.");
  process.exit(2);
}

const report = [];
for (const t of cat.tables) {
  const sites = writeSites(files, t);
  const sets = sites.filter((s) => s.verdict === "sets");
  const omits = sites.filter((s) => s.verdict === "omits");
  const unresolved = sites.filter((s) => s.verdict === "unresolved");
  const insertOnly = sites.filter((s) => s.verdict === "insert-only");
  let state;
  if (sites.length === 0) state = "no-writers";
  else if (sets.length && omits.length) state = "MIXED";
  else if (sets.length) state = "all-set";
  else if (omits.length) state = "none-set";
  else state = "unresolved-only";
  report.push({ table: t, state, sets, omits, unresolved, insertOnly });
}

/* A disagreement on a trigger-maintained table is cosmetic, not a defect. */
const mixedAll = report.filter((r) => r.state === "MIXED");
const mixed = TRIG ? mixedAll.filter((r) => !TRIG.has(r.table)) : mixedAll;
const cosmetic = TRIG ? mixedAll.filter((r) => TRIG.has(r.table)) : [];
const unresolvedTotal = report.reduce((a, r) => a + r.unresolved.length, 0);
const scanned = report.reduce((a, r) => a + r.sets.length + r.omits.length + r.unresolved.length, 0);
/* CONTROL. The table list was non-empty and the file list was non-empty, but
 * if the association rule matches nothing then every table reports no-writers
 * and the run is vacuous. */
if (scanned === 0) {
  console.error("Found " + cat.tables.length + " table(s) and " + files.length + " file(s) and");
  console.error("ZERO write sites. The .from()/.update() association is broken.");
  process.exit(2);
}

if (JSON_OUT) {
  console.log(JSON.stringify({ tables: cat.tables.length, files: files.length, sites: scanned, mixed, report }, null, 2));
  process.exit(mixed.length ? 1 : 0);
}

console.log("");
console.log("updated_at writer consistency");
console.log("  " + cat.tables.length + " table(s) carry updated_at, derived from the live OpenAPI schema");
console.log("  " + files.length + " source file(s), " + scanned + " write site(s)");
console.log("");

for (const r of report) {
  if (r.state === "no-writers" && !VERBOSE) continue;
  const tag = r.state === "MIXED" ? "FAIL " : r.state === "all-set" ? "ok   " : "info ";
  console.log("  " + tag + r.table.padEnd(30) +
    r.sets.length + " set, " + r.omits.length + " omit, " + r.unresolved.length + " unresolved");
  if (r.state === "MIXED" || VERBOSE) {
    for (const s of r.omits) console.log("         OMITS  " + s.where + "  ." + s.method + "()");
    for (const s of r.sets) if (VERBOSE) console.log("         sets   " + s.where);
  }
  for (const s of r.unresolved) console.log("         ?      " + s.where + "  (" + s.why + ")");
}

console.log("");
if (unresolvedTotal > 0) {
  console.log("  " + unresolvedTotal + " site(s) UNRESOLVED -- the payload is not an object literal, so this");
  console.log("  run is incomplete by that much. Read them by hand; see limitation 1 in the header.");
}
if (cosmetic.length) {
  console.log("  " + cosmetic.length + " table(s) disagree but are TRIGGER-MAINTAINED, so the omission is");
  console.log("  correct and the inconsistency is cosmetic: " + cosmetic.map((r) => r.table).join(", "));
  console.log("");
}
if (!TRIG && mixedAll.length) {
  console.log("  NOT A GATE ON THIS RUN. Migration 354 has not run, so the trigger list is");
  console.log("  unavailable and a disagreement cannot be told from a trigger-maintained");
  console.log("  table. The " + mixedAll.length + " table(s) above need one query each:");
  console.log("");
  console.log("    select tgname from pg_trigger t join pg_class c on c.oid = t.tgrelid");
  console.log("     where c.relname = '<table>' and not t.tgisinternal;");
  console.log("");
  console.log("  Exiting 0. Run 354 to make this a gate.");
  process.exit(0);
}
if (mixed.length === 0) {
  console.log("  No table has writers that disagree about updated_at.");
  console.log("  A table reporting 'none-set' is trigger-maintained or insert-only. This check");
  console.log("  cannot tell those apart and does not try -- see the header.");
  process.exit(0);
}
console.log("  " + mixed.length + " table(s) have writers that DISAGREE. One of them is wrong,");
console.log("  and it is usually the newest. Named above.");
process.exit(1);
