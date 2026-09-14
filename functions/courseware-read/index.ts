// POST /functions/v1/courseware-read
//
// PUBLIC endpoint. verify_jwt = false, pinned in config.toml in the same commit
// as this file -- see the block above [functions.courseware-read] for why the
// pin and not the flag.
//
// The read side of the courseware MCP pilot (migrations 315 and 316). ONE
// function, parameterised by `resource`, per MCP-COURSEWARE.md section 3:
//
//   { resource: "certification" }
//   { resource: "task",    language?, domain_code?, task_code?, limit? }
//   { resource: "concept", slug?, task_code?, limit? }
//   { resource: "search",  query, language?, limit? }
//
// ===================== THE ONE PROPERTY THAT MATTERS =====================
//
// THIS FUNCTION MUST NEVER HOLD service_role. MCP-COURSEWARE.md section 2:
// "It would satisfy every query and make migration 315 decorative - the
// boundary would exist in the database and be bypassed by the only thing that
// talks to it."
//
// That is asserted three ways rather than promised once, because a promise in a
// header comment is the weakest form this could take:
//
//   1. STRUCTURALLY, by what is not imported. `_shared/supabase.ts` and its
//      getServiceClient() are absent from this file. There is no client here to
//      hand a key to.
//   2. AT LOAD, by scrubbing the environment. The service-role key and
//      SUPABASE_DB_URL are deleted from this isolate before any handler exists,
//      so a later edit that reaches for either gets undefined rather than a
//      credential. SUPABASE_DB_URL is scrubbed too and is the sharper of the
//      pair: it is a superuser DSN, which is worse than service_role, and it is
//      injected by the platform whether or not anyone asked for it.
//   3. AT THE DATABASE, by asking who we actually are. On the first query of
//      each cold start the connection asserts `current_user = 'mcp_reader'` AND
//      that it has NO select privilege on mcp.lesson. Both must hold or the
//      function serves nothing.
//
// (3) is the only one of the three that can catch a wrong credential, because
// it asks the database instead of the code. It is also the assertion that keeps
// this function from quietly becoming the holder path: the day someone wants
// lesson bodies, this check fails and forces the decision into the open rather
// than letting a changed password widen the boundary in silence.
//
// ===================== VALIDATION IS OWNED HERE =====================
//
// MCP-COURSEWARE.md section 3, stated as the cost of one function rather than
// four: "the function's input surface is wider than any single tool's, so its
// own validation must be real rather than inherited from a tool schema."
//
// So validateArgs below is enforcement, not documentation. It rejects unknown
// keys outright -- an unrecognised field means the caller and this function
// disagree about the contract, and guessing which of them is right is how a
// filter silently stops filtering. Nothing reaching SQL is interpolated; every
// value is a bound parameter.
//
// ===================== LOGGING =====================
//
// THE SEARCH QUERY IS NEVER LOGGED. Only its length. Same rule the credential
// path encodes by logging nothing about a lookup: the caller's search string is
// the caller's business, it can carry anything a partner typed, and a log line
// is a copy of it in a place nobody is treating as content.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { Pool } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

// --------------------------------------------------------------- (2) scrub
//
// Before anything else in this module. Deleting is the point: a later edit that
// calls Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") gets undefined and fails,
// rather than getting a working key and succeeding.
for (const name of [
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_URL",
]) {
  try {
    Deno.env.delete(name);
  } catch {
    // Deletion is defence in depth, not the boundary. (1) and (3) hold without
    // it, so a runtime that refuses is not a reason to fail the request.
  }
}

// ------------------------------------------------------------------ config

const DB_USER = "mcp_reader"; // never a variable, never from the environment
const PASSWORD = Deno.env.get("MCP_READER_PASSWORD") ?? "";
const DB_HOST = Deno.env.get("MCP_READER_DB_HOST") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";

// ============ THREE CONNECTION SHAPES, AND THE HOST SETTLES ONE THING ========
//
//   shape              host                                  user              port
//   -----------------  ------------------------------------  ----------------  ----
//   shared pooler      aws-0-<region>.pooler.supabase.com     mcp_reader.<ref>  6543 txn / 5432 session
//   DEDICATED pooler   db.<ref>.supabase.co                   mcp_reader        6543
//   direct             db.<ref>.supabase.co                   mcp_reader        5432
//
// THE USERNAME FORM IS DERIVABLE, AND ONLY FROM THE HOST. Only the SHARED
// pooler qualifies the role with the project ref, because only it multiplexes
// many projects behind one hostname and needs the ref to route. A dedicated
// pooler and a direct connection both answer on a host that already names the
// project, so both take the bare role.
//
// THE PORT IS NOT DERIVABLE, AND ASSUMING OTHERWISE WAS THE BUG. This read
// `IS_POOLER ? 6543 : 5432`, which encodes "a db.<ref> host means a direct
// connection". THIS PROJECT RUNS A DEDICATED POOLER ON db.<ref>.supabase.co:6543
// -- same hostname as a direct connection, same bare username, different port.
// No amount of string inspection separates those two, so the old default sent a
// dedicated-pooler deployment at 5432 and it only worked because the port had
// been set by hand.
//
// THE SHARED/DEDICATED DISTINCTION IS INVISIBLE IN A CONNECTION STRING except by
// the ABSENCE of the ref in the username, which is the kind of negative evidence
// the next reader reconstructs wrongly. It is written down here rather than left
// to be re-derived from a dashboard.
//
// So: 6543 unless told otherwise. Pooled is the right answer for a function that
// lives for one request, and the shape that is now WRONG by default -- a genuine
// direct connection -- is the one Supabase steers away from for serverless
// callers. MCP_READER_DB_PORT overrides for direct or session-mode.
const PROJECT_REF = (SUPABASE_URL.match(/^https:\/\/([a-z0-9]+)\.supabase\./)?.[1]) ?? "";
const IS_SHARED_POOLER = /(^|\.)pooler\.supabase\.com$/i.test(DB_HOST);
const CONN_USER = IS_SHARED_POOLER && PROJECT_REF ? `${DB_USER}.${PROJECT_REF}` : DB_USER;
const PORT_WAS_SET = Deno.env.get("MCP_READER_DB_PORT") !== undefined;
const DB_PORT = Number(Deno.env.get("MCP_READER_DB_PORT") ?? 6543);

/**
 * Which shape we believe we are talking to. Reported, never acted on beyond the
 * two values above -- its whole job is to make a wrong guess ONE LOG LINE rather
 * than a connect timeout with nothing to read.
 */
const CONN_SHAPE = IS_SHARED_POOLER
  ? `shared pooler (${DB_PORT === 5432 ? "session" : "transaction"} mode)`
  : DB_PORT === 6543
    ? "dedicated pooler"
    : DB_PORT === 5432
      ? "direct"
      : "non-standard port";

let pool: Pool | null = null;
function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      user: CONN_USER,
      password: PASSWORD,
      database: "postgres",
      hostname: DB_HOST,
      port: DB_PORT,
      tls: { enabled: true },
    }, 2, true);
  }
  return pool;
}

// ------------------------------------------------------- (3) identity check
//
// Once per cold start, awaited by every request. The pool's credentials are
// fixed at construction, so one connection proving its identity proves it for
// every connection the pool will open.
//
// Both halves are asserted. The positive half alone would pass for a superuser
// impersonating nothing; the negative half is the paywall, and it is the one
// that can contradict the deployment.
let identity: Promise<void> | null = null;
function assertIdentity(): Promise<void> {
  if (!identity) {
    identity = (async () => {
      const conn = await getPool().connect();
      try {
        const r = await conn.queryObject<{
          who: string;
          session_who: string;
          reader_can_read_lessons: boolean;
        }>({
          text:
            "select current_user::text as who, " +
            "session_user::text as session_who, " +
            "has_table_privilege(current_user, 'mcp.lesson', 'SELECT') as reader_can_read_lessons",
          args: [],
        });
        const row = r.rows[0];
        if (!row) throw new Error("identity check returned no row");
        if (row.who !== DB_USER || row.session_who !== DB_USER) {
          throw new Error(
            `connected as ${row.session_who}/${row.who}, expected ${DB_USER} -- refusing to serve`,
          );
        }
        if (row.reader_can_read_lessons) {
          throw new Error(
            "this connection can select mcp.lesson; courseware-read is the reader path and must not -- refusing to serve",
          );
        }
        // ONCE PER COLD START, AND ONLY AFTER THE ASSERTIONS PASS. The port
        // cannot be derived from the host, so the shape below is a BELIEF. This
        // line is what turns a wrong one into something readable instead of a
        // connect timeout with nothing attached. No password, and no secret
        // value -- host, port and role are operational facts.
        console.log(JSON.stringify({
          fn: "courseware-read",
          event: "connected",
          shape: CONN_SHAPE,
          host: DB_HOST,
          port: DB_PORT,
          port_explicit: PORT_WAS_SET,
          user: CONN_USER,
        }));
      } finally {
        conn.release();
      }
    })().catch((e) => {
      identity = null; // a cold start that failed must retry, not cache the failure
      throw e;
    });
  }
  return identity;
}

// --------------------------------------------------------------- validation

import {
  type Args,
  bad,
  BadRequest,
  buildQuery,
  validateArgs,
} from "../_shared/courseware-query.ts";

// ------------------------------------------------------------------ handler

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method not allowed" }, 405);

  const started = Date.now();
  let args: Args | null = null;

  try {
    if (!PASSWORD || !DB_HOST) {
      // Named without values. Which secret is missing is operational
      // information; neither secret's content is.
      console.error("courseware-read: missing MCP_READER_PASSWORD or MCP_READER_DB_HOST");
      return jsonResponse({ error: "not configured" }, 500);
    }

    const raw = await req.json().catch(() => bad("body must be valid JSON"));
    args = validateArgs(raw);

    await assertIdentity();

    const { q, searched } = buildQuery(args);
    const conn = await getPool().connect();
    let rows: Record<string, unknown>[];
    try {
      const r = await conn.queryObject<Record<string, unknown>>(q);
      rows = r.rows;
    } finally {
      conn.release();
    }

    // THE QUERY IS NEVER HERE. Its length is.
    console.log(JSON.stringify({
      fn: "courseware-read",
      resource: args.resource,
      language: args.language,
      ...(args.resource === "search" ? { q_len: args.query!.length, searched } : {}),
      rows: rows.length,
      ms: Date.now() - started,
    }));

    return jsonResponse({
      resource: args.resource,
      language: args.language,
      certification: "AISM-I",
      ...(searched ? { searched } : {}),
      count: rows.length,
      rows,
    });
  } catch (e) {
    if (e instanceof BadRequest) {
      console.log(JSON.stringify({
        fn: "courseware-read",
        resource: args?.resource ?? null,
        rejected: e.message,
        ms: Date.now() - started,
      }));
      return jsonResponse({ error: e.message }, 400);
    }
    // The caller gets no internals. A failed identity assertion in particular
    // must not tell an unauthenticated caller which role the function holds.
    console.error("courseware-read failed:", e instanceof Error ? e.message : String(e));
    return jsonResponse({ error: "read failed" }, 500);
  }
});
