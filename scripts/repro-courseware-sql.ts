// scripts/repro-courseware-sql.ts
//
// Run courseware-read's REAL query builder, as the REAL role, through the REAL
// driver -- without deploying.
//
//   deno run --allow-env --allow-net scripts/repro-courseware-sql.ts
//   deno run --allow-env --allow-net scripts/repro-courseware-sql.ts --resource search --query "service"
//
// READ-ONLY. It connects as mcp_reader, which has no grant on mcp.lesson and no
// write privilege anywhere, so there is nothing this can damage.
//
// ===================== WHY THIS EXISTS =====================
//
// On 2026-09-14 the v2 search SQL was verified by hand against the views and
// ran correctly. It then 500'd on every call once deployed. The hand check and
// the function differed in three ways and the check covered none of them:
//
//   hand check          function
//   ----------          --------
//   literal values      BOUND PARAMETERS through deno-postgres
//   role postgres       role mcp_reader, against security_barrier views
//   psql-equivalent     the driver's extended protocol
//
// And the failure surfaced as HTTP 500 with the body "read failed", because the
// handler deliberately returns no internals to an unauthenticated caller. That
// is right for the endpoint and useless for diagnosis: the actual Postgres error
// is written to the function log and nowhere a smoke test can see it.
//
// So this closes the loop from the other side. It imports buildQuery and
// validateArgs from functions/_shared/courseware-query.ts -- the same module the
// function imports, not a transcription -- and PRINTS THE POSTGRES ERROR IN FULL.
//
// ===================== WHAT IT NEEDS =====================
//
// The same two secrets the deployed function holds, in the environment rather
// than in a file:
//
//   MCP_READER_PASSWORD   the SCRAM-minted password
//   MCP_READER_DB_HOST    e.g. db.<ref>.supabase.co
//   MCP_READER_DB_PORT    optional; the port is NOT derivable from the host
//
// It deliberately does NOT read scripts/.env: that file holds a service-role
// key, and this script must never be able to fall back to a credential that
// would make the query succeed for the wrong reason.

import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { buildQuery, validateArgs } from "../functions/_shared/courseware-query.ts";

const KNOWN = new Set(["--resource", "--query", "--language", "--limit", "--task-code", "--slug", "--sql-only"]);
for (const a of Deno.args) {
  if (a.startsWith("--") && !KNOWN.has(a)) {
    console.error(`Unrecognised flag: ${a}. READ-ONLY; no --apply exists.`);
    Deno.exit(2);
  }
}
const flag = (n: string, d: string | null = null) => {
  const i = Deno.args.indexOf(`--${n}`);
  return i >= 0 && Deno.args[i + 1] ? Deno.args[i + 1] : d;
};

const raw: Record<string, unknown> = { resource: flag("resource", "search") };
if (flag("query")) raw.query = flag("query");
if (flag("language")) raw.language = flag("language");
if (flag("limit")) raw.limit = Number(flag("limit"));
if (flag("task-code")) raw.task_code = flag("task-code");
if (flag("slug")) raw.slug = flag("slug");
if (raw.resource === "search" && !raw.query) raw.query = "service";

let args;
try {
  args = validateArgs(raw);
} catch (e) {
  console.error("REJECTED by validateArgs: " + (e instanceof Error ? e.message : String(e)));
  Deno.exit(1);
}

const { q, searched } = buildQuery(args);

console.log("=".repeat(78));
console.log("ARGS SENT  : " + JSON.stringify(q.args));
console.log("SEARCHED   : " + JSON.stringify(searched ?? null));
console.log("=".repeat(78));
console.log(q.text);
console.log("=".repeat(78));

if (Deno.args.includes("--sql-only")) Deno.exit(0);

const PASSWORD = Deno.env.get("MCP_READER_PASSWORD") ?? "";
const DB_HOST = Deno.env.get("MCP_READER_DB_HOST") ?? "";
if (!PASSWORD || !DB_HOST) {
  console.error("");
  console.error("MCP_READER_PASSWORD and MCP_READER_DB_HOST must be set to execute.");
  console.error("Use --sql-only to print the statement without connecting.");
  Deno.exit(2);
}
const IS_SHARED_POOLER = /(^|\.)pooler\.supabase\.com$/i.test(DB_HOST);
const PROJECT_REF = "pctynukndxnmnxiqpgck";
const CONN_USER = IS_SHARED_POOLER ? `mcp_reader.${PROJECT_REF}` : "mcp_reader";
const DB_PORT = Number(Deno.env.get("MCP_READER_DB_PORT") ?? 6543);

const pool = new Pool({
  user: CONN_USER, password: PASSWORD, database: "postgres",
  hostname: DB_HOST, port: DB_PORT, tls: { enabled: true },
}, 1, true);

try {
  const conn = await pool.connect();
  try {
    const who = await conn.queryObject<{ who: string }>("select current_user::text as who");
    console.log(`connected as ${who.rows[0]?.who} at ${DB_HOST}:${DB_PORT}`);
    console.log("");
    const r = await conn.queryObject<Record<string, unknown>>(q);
    console.log(`ROWS: ${r.rows.length}`);
    for (const row of r.rows.slice(0, 8)) {
      console.log("  " + JSON.stringify(row).slice(0, 150));
    }
    if (r.rows.length > 8) console.log(`  ... ${r.rows.length - 8} more`);
  } finally {
    conn.release();
  }
} catch (e) {
  // THE WHOLE POINT. The deployed function catches this and returns
  // {"error":"read failed"} with no internals, which is correct for a public
  // endpoint and is why the failure was undiagnosable from the smoke test.
  console.error("");
  console.error("QUERY FAILED -- the error the function swallows:");
  console.error("");
  const err = e as { message?: string; fields?: Record<string, unknown> };
  console.error("  " + (err.message ?? String(e)));
  if (err.fields) {
    for (const [k, v] of Object.entries(err.fields)) {
      if (v) console.error(`  ${k}: ${v}`);
    }
  }
  Deno.exit(1);
} finally {
  await pool.end();
}

console.log("");
console.log("READ-ONLY: nothing was written.");
